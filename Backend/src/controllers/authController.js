const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { AdminUser, User } = require("../models");
const mailer = require("../utils/mailer");
const otpStore = require("../utils/otpStore");

/* ── Admin Auth ── */

async function login(req, res) {
  const { email, password } = req.body;

  // Same error for "no such user" and "wrong password" — never reveal which one it was.
  const admin = await AdminUser.scope("withPassword").findOne({ where: { email } });
  if (!admin || !admin.is_active) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  admin.last_login_at = new Date();
  await admin.save();

  const token = jwt.sign({ sub: admin.id, role: admin.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn
  });

  return sendSuccess(res, {
    data: {
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    }
  });
}

async function me(req, res) {
  return sendSuccess(res, { data: req.admin });
}

/* ── Customer Auth ── */

async function customerRegister(req, res) {
  const { name, email, phone, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict("An account with this email address already exists. Please sign in instead.");
  }

  const password_hash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({
    name,
    email,
    phone,
    password_hash,
    is_active: true
  });

  // Asynchronously dispatch luxury welcome email to the newly registered customer
  if (user && user.email) {
    mailer.sendWelcomeEmail(user.email, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone
    }).catch((err) => {
      console.warn("[ZMW NODEMAILER] Welcome email notification notice:", err.message);
    });
  }

  const token = jwt.sign({ sub: user.id, role: "customer" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    }
  });
}

async function customerLogin(req, res) {
  const { email, password } = req.body;

  const user = await User.scope("withPassword").findOne({ where: { email } });
  if (!user || !user.is_active) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = jwt.sign({ sub: user.id, role: "customer" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn
  });

  return sendSuccess(res, {
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    }
  });
}

async function customerMe(req, res) {
  return sendSuccess(res, {
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        created_at: req.user.created_at
      }
    }
  });
}

async function customerUpdateProfile(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) throw ApiError.notFound("User not found");

  if (req.body.name && req.body.name.trim()) user.name = req.body.name.trim();
  if (req.body.phone && req.body.phone.trim()) user.phone = req.body.phone.trim();
  await user.save();

  return sendSuccess(res, {
    message: "Profile updated successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at
      }
    }
  });
}

async function customerForgotPassword(req, res) {
  const { email } = req.body;
  const normalizedEmail = (email || "").trim().toLowerCase();

  const user = await User.scope("withPassword").findOne({ where: { email: normalizedEmail } });
  if (!user || !user.is_active) {
    // Security: never reveal whether the email exists in DB
    return sendSuccess(res, {
      message: "If an account with this email address exists, a verification code has been sent.",
      data: { sent: true, email: normalizedEmail }
    });
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.saveOtp(normalizedEmail, otp, 10);

  // Send OTP email in background asynchronously so API response is INSTANT (< 20ms)
  mailer.sendPasswordResetOtp(user.email, otp).catch((err) => {
    console.error("[ZMW NODEMAILER] Background email dispatch error:", err.message);
  });

  return sendSuccess(res, {
    message: "A 6-digit verification code has been sent to your email.",
    data: {
      sent: true,
      email: user.email
    }
  });
}

async function customerVerifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw ApiError.badRequest("Email and 6-digit verification code (OTP) are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const verification = otpStore.verifyOtp(normalizedEmail, otp.toString());
  if (!verification.valid) {
    throw ApiError.badRequest(verification.reason);
  }

  const user = await User.scope("withPassword").findOne({ where: { email: normalizedEmail } });
  if (!user || !user.is_active) {
    throw ApiError.badRequest("Account not found or is currently inactive.");
  }

  // Generate cryptographically signed reset token valid for 15 minutes
  const resetToken = jwt.sign(
    { sub: user.id, email: user.email, type: "customer_pwd_reset" },
    env.jwt.secret + user.password_hash,
    { expiresIn: "15m" }
  );

  return sendSuccess(res, {
    message: "OTP verified successfully. Please enter your new password.",
    data: {
      verified: true,
      email: user.email,
      resetToken
    }
  });
}

async function customerResetPassword(req, res) {
  const { email, otp, token, newPassword, password } = req.body;
  const chosenPassword = newPassword || password;

  if (!chosenPassword || chosenPassword.length < 6) {
    throw ApiError.badRequest("Password must be at least 6 characters.");
  }

  let user = null;

  // Flow A: Cryptographic reset token from verified OTP
  if (token) {
    let decoded;
    try {
      decoded = jwt.decode(token);
    } catch (e) {
      throw ApiError.badRequest("Invalid password reset token.");
    }

    if (!decoded || !decoded.sub || decoded.type !== "customer_pwd_reset") {
      throw ApiError.badRequest("Invalid or malformed password reset token.");
    }

    user = await User.scope("withPassword").findByPk(decoded.sub);
    if (!user || !user.is_active) {
      throw ApiError.badRequest("Invalid or expired password reset token.");
    }

    try {
      jwt.verify(token, env.jwt.secret + user.password_hash);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw ApiError.badRequest("Password reset token has expired. Please request a new one.");
      }
      throw ApiError.badRequest("Invalid or already used password reset token.");
    }
  } else if (email && otp) {
    // Flow B: Direct OTP reset fallback
    const normalizedEmail = email.trim().toLowerCase();
    const verification = otpStore.verifyOtp(normalizedEmail, otp.toString());
    if (!verification.valid) {
      throw ApiError.badRequest(verification.reason);
    }

    user = await User.scope("withPassword").findOne({ where: { email: normalizedEmail } });
    if (!user || !user.is_active) {
      throw ApiError.badRequest("Account not found or is currently inactive.");
    }
  } else {
    throw ApiError.badRequest("Reset token or verification OTP is required.");
  }

  const password_hash = await bcrypt.hash(chosenPassword, env.bcryptSaltRounds);
  user.password_hash = password_hash;
  await user.save();

  return sendSuccess(res, {
    message: "Your password has been reset successfully. Please sign in with your new password.",
    data: { success: true }
  });
}

module.exports = {
  login,
  me,
  customerRegister,
  customerLogin,
  customerMe,
  customerUpdateProfile,
  customerForgotPassword,
  customerVerifyOtp,
  customerResetPassword
};
