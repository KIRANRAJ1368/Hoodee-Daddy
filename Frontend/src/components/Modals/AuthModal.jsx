import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { isValidEmail, isValidPhone, cleanPhoneInput, isNonEmpty } from "../../utils/validators";
import "./AuthModal.css";

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  newPassword: "",
  otp: ""
};

export default function AuthModal() {
  const navigate = useNavigate();
  const {
    authModalState,
    setAuthModalState,
    loginCustomer,
    registerCustomer,
    forgotPassword,
    verifyOtp,
    resetPassword,
    setIsCheckoutOpen,
    pendingCheckout,
    setPendingCheckout,
    checkoutIntent,
    addToast
  } = useShop();

  const [activeTab, setActiveTab] = useState("login"); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Forgot Password 3-step flow: 'request' (email) -> 'otp' (verify code) -> 'new_password' (set password)
  const [forgotStep, setForgotStep] = useState("request");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Countdown timer for OTP resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-detect resetToken from URL query if user clicked an external link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || params.get("resetToken");
      if (token) {
        setResetToken(token);
        setForgotStep("new_password");
        setActiveTab("forgot");
        setAuthModalState("forgot");
      }
    } catch (e) {
      // Ignored in non-browser context
    }
  }, [setAuthModalState]);

  useEffect(() => {
    if (authModalState === "register") {
      setActiveTab("register");
    } else if (authModalState === "forgot") {
      setActiveTab("forgot");
    } else if (authModalState === "login") {
      setActiveTab("login");
    } else {
      setActiveTab("register");
    }
    setErrorMessage("");
    setForgotSubmitted(false);
    setForgotStep("request");
    setResetToken("");
    setResetEmail("");
    setResendCooldown(0);
    setFormData(INITIAL_FORM_DATA);
  }, [authModalState]);

  if (!authModalState) return null;

  const handleChange = (e) => {
    setErrorMessage("");
    const { name, value } = e.target;
    let nextVal = value;
    if (name === "phone") {
      nextVal = cleanPhoneInput(value);
    } else if (name === "otp") {
      nextVal = value.replace(/\D/g, "").slice(0, 6);
    }
    setFormData((prev) => ({ ...prev, [name]: nextVal }));
  };

  const handleClose = () => {
    setForgotSubmitted(false);
    setForgotStep("request");
    setResetToken("");
    setResetEmail("");
    setResendCooldown(0);
    setErrorMessage("");
    setAuthModalState(null);
    setPendingCheckout(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !resetEmail || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await forgotPassword(resetEmail);
      setResendCooldown(30);
      addToast("A fresh 6-digit verification code has been dispatched to your email.", "info");
    } catch (err) {
      setErrorMessage(err.message || "Failed to resend verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (activeTab === "register") {
      if (!isNonEmpty(formData.name)) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (!isNonEmpty(formData.phone)) {
        setErrorMessage("Mobile number is required.");
        return;
      }
      if (!isValidPhone(formData.phone)) {
        setErrorMessage("Phone number must be exactly 10 digits.");
        return;
      }
      if (!isNonEmpty(formData.email)) {
        setErrorMessage("Email address is required.");
        return;
      }
      if (!isValidEmail(formData.email)) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (!formData.confirmPassword) {
        setErrorMessage("Please confirm your password.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match. Please verify and try again.");
        return;
      }

      setIsSubmitting(true);
      try {
        await registerCustomer({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });

        // Reset the form state only after a successful API response
        setFormData(INITIAL_FORM_DATA);
        setAuthModalState(null);
        if (pendingCheckout) {
          setPendingCheckout(false);
          navigate(checkoutIntent === "buy-now" ? "/checkout" : "/cart", { replace: true, state: checkoutIntent === "buy-now" ? { buyNow: true } : {} });
        }
      } catch (err) {
        setErrorMessage(err.message || "Failed to create account. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === "login") {
      if (!isNonEmpty(formData.email)) {
        setErrorMessage("Email address is required.");
        return;
      }
      if (!isValidEmail(formData.email)) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      if (!formData.password) {
        setErrorMessage("Password is required.");
        return;
      }

      setIsSubmitting(true);
      try {
        await loginCustomer(formData.email.trim(), formData.password);

        // Reset the form state only after a successful API response
        setFormData(INITIAL_FORM_DATA);
        setAuthModalState(null);
        if (pendingCheckout) {
          setPendingCheckout(false);
          navigate(checkoutIntent === "buy-now" ? "/checkout" : "/cart", { replace: true, state: checkoutIntent === "buy-now" ? { buyNow: true } : {} });
        }
      } catch (err) {
        setErrorMessage(err.message || "Invalid email or password.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === "forgot") {
      if (forgotStep === "request") {
        const emailToVerify = (formData.email || "").trim();
        if (!isNonEmpty(emailToVerify)) {
          setErrorMessage("Please enter your registered email address.");
          return;
        }
        if (!isValidEmail(emailToVerify)) {
          setErrorMessage("Please enter a valid email address.");
          return;
        }

        setIsSubmitting(true);
        try {
          const res = await forgotPassword(emailToVerify);
          const targetEmail = res?.email || emailToVerify;
          setResetEmail(targetEmail);
          setForgotStep("otp");
          setResendCooldown(30);
          setErrorMessage("");
          addToast("Verification code (OTP) sent to your email! Please check your inbox.", "success");
        } catch (err) {
          setErrorMessage(err.message || "Failed to send verification code. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      } else if (forgotStep === "otp") {
        const otpCode = (formData.otp || "").trim();
        if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
          setErrorMessage("Please enter the 6-digit numeric verification code (OTP) sent to your email.");
          return;
        }

        setIsSubmitting(true);
        try {
          const verifyRes = await verifyOtp({
            email: resetEmail,
            otp: otpCode
          });

          if (verifyRes?.resetToken) {
            setResetToken(verifyRes.resetToken);
          }
          setForgotStep("new_password");
          setErrorMessage("");
          addToast("Code verified successfully! Now set your new password below.", "success");
        } catch (err) {
          setErrorMessage(err.message || "Invalid or expired verification code. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      } else if (forgotStep === "new_password") {
        const newPwd = formData.newPassword || formData.password;
        if (!newPwd || newPwd.length < 6) {
          setErrorMessage("New password must be at least 6 characters long.");
          return;
        }
        if (!formData.confirmPassword) {
          setErrorMessage("Please confirm your new password.");
          return;
        }
        if (newPwd !== formData.confirmPassword) {
          setErrorMessage("Passwords do not match. Please verify and try again.");
          return;
        }

        setIsSubmitting(true);
        try {
          await resetPassword({
            email: resetEmail,
            token: resetToken || undefined,
            newPassword: newPwd,
            confirmPassword: formData.confirmPassword
          });

          // Reset the form state only after a successful API response
          setFormData(INITIAL_FORM_DATA);
          setResetToken("");
          setResetEmail("");
          setForgotStep("request");
          setForgotSubmitted(false);
          setResendCooldown(0);
          setErrorMessage("");
          setActiveTab("login");
          addToast("Password reset successfully! Please sign in with your new password.", "success");
        } catch (err) {
          setErrorMessage(err.message || "Failed to reset password. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="modal-overlay active" onClick={handleClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="auth-close-btn"
          onClick={handleClose}
          aria-label="Close"
          type="button"
        >
          ✕
        </button>

        {/* Forgot Password Unregistered Notification Screen */}
        {activeTab === "forgot" && forgotSubmitted ? (
          <div className="auth-confirmation-view">
            <div className="auth-confirm-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="auth-title">Instructions Dispatched</h2>
            <p className="auth-desc" style={{ marginBottom: "20px" }}>
              If an account with <strong>{formData.email || "that email address"}</strong> exists in our system, password reset instructions have been generated.
            </p>
            <button
              type="button"
              className="btn btn-primary auth-submit-btn"
              onClick={() => {
                setForgotSubmitted(false);
                setForgotStep("request");
                setActiveTab("login");
                setErrorMessage("");
                setFormData(INITIAL_FORM_DATA);
              }}
              style={{ width: "100%", marginBottom: "10px" }}
            >
              Return to Sign In
            </button>
            <button
              type="button"
              className="forgot-link-btn"
              onClick={() => {
                setForgotSubmitted(false);
                setForgotStep("request");
              }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
            >
              Change email or try again
            </button>
          </div>
        ) : (
          <div className="auth-modal-inner">
            {/* Modal Header */}
            <div className="auth-header">
              <img
                src={process.env.PUBLIC_URL + "/images/hoodee-daddy-logo.svg"}
                alt="HooDee Daddy"
                className="auth-brand-logo"
                style={{ height: 42, width: "auto", margin: "0 auto 10px", display: "block" }}
              />
              <span className="auth-kicker">HOODEE DADDY</span>
              <h2 className="auth-title">
                {activeTab === "login" && "Customer Sign In"}
                {activeTab === "register" && "Create An Account"}
                {activeTab === "forgot" && (
                  forgotStep === "request"
                    ? "Reset Your Password"
                    : forgotStep === "otp"
                    ? "Enter Verification Code"
                    : "Set New Password"
                )}
              </h2>
              <p className="auth-desc">
                {pendingCheckout && (
                  <span className="auth-checkout-hint">
                    ✦ Create an account or sign in to complete checkout
                  </span>
                )}
                {activeTab === "login" && "Sign in for express checkout, saved delivery details, and order tracking."}
                {activeTab === "register" && "Join HooDee Daddy to save delivery addresses, view order history, and unlock member perks."}
                {activeTab === "forgot" && (
                  forgotStep === "request"
                    ? "Enter your registered email address to receive a 6-digit verification code (OTP)."
                    : forgotStep === "otp"
                    ? `Enter the 6-digit verification code sent to ${resetEmail || "your email"}.`
                    : `Create a new secure password for ${resetEmail || "your account"}.`
                )}
              </p>
            </div>

            {/* Tab Selector */}
            {activeTab !== "forgot" && (
              <div className="auth-tab-switch">
                <button
                  type="button"
                  className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMessage("");
                    setFormData(INITIAL_FORM_DATA);
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMessage("");
                    setFormData(INITIAL_FORM_DATA);
                  }}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="auth-error-banner" role="alert">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Register Extra Fields: Name & Mobile */}
              {activeTab === "register" && (
                <div className="auth-form-row">
                  <div className="form-group">
                    <label htmlFor="reg-name">Full Name</label>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Liam Sterling"
                      value={formData.name}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-phone">Mobile Number</label>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                </div>
              )}

              {/* Email Address Field (for login, register, and forgot-request) */}
              {(activeTab !== "forgot" || forgotStep === "request") && (
                <div className="form-group">
                  <label htmlFor="auth-email">Email Address</label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              )}

              {/* Register Password & Confirm */}
              {activeTab === "register" && (
                <div className="auth-form-row">
                  <div className="form-group">
                    <label htmlFor="auth-password">Password</label>
                    <input
                      id="auth-password"
                      name="password"
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-confirmPassword">Confirm Password</label>
                    <input
                      id="reg-confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                </div>
              )}

              {/* Login Password */}
              {activeTab === "login" && (
                <div className="form-group">
                  <div className="password-label-row">
                    <label htmlFor="auth-password">Password</label>
                    <button
                      type="button"
                      className="forgot-link-btn"
                      onClick={() => {
                        setForgotSubmitted(false);
                        setForgotStep("request");
                        setActiveTab("forgot");
                        setErrorMessage("");
                        setFormData(INITIAL_FORM_DATA);
                      }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    id="auth-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>
              )}

              {/* Step 2: OTP Verification Only */}
              {activeTab === "forgot" && forgotStep === "otp" && (
                <>
                  <div className="auth-otp-badge-row">
                    <span>Code sent to: <strong>{resetEmail || formData.email}</strong></span>
                    <button
                      type="button"
                      className="auth-change-email-btn"
                      onClick={() => {
                        setForgotStep("request");
                        setErrorMessage("");
                        setFormData((prev) => ({ ...prev, otp: "" }));
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <div className="form-group">
                    <label htmlFor="auth-otp">6-Digit Verification Code (OTP)</label>
                    <input
                      id="auth-otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      placeholder="• • • • • •"
                      value={formData.otp}
                      onChange={handleChange}
                      className="auth-input auth-otp-input"
                      autoFocus
                      autoComplete="one-time-code"
                    />
                  </div>

                  <div className="auth-resend-row">
                    <button
                      type="button"
                      className="auth-resend-btn"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isSubmitting}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Didn't receive code? Resend OTP"}
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Set New Password Only (Appears ONLY AFTER OTP is verified) */}
              {activeTab === "forgot" && forgotStep === "new_password" && (
                <>
                  <div className="auth-otp-badge-row">
                    <span>Resetting password for: <strong>{resetEmail}</strong></span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="auth-newPassword">New Password</label>
                    <input
                      id="auth-newPassword"
                      name="newPassword"
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="auth-input"
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="auth-confirmPassword">Confirm New Password</label>
                    <input
                      id="auth-confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="auth-input"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Processing..."
                ) : activeTab === "login" ? (
                  "Sign In"
                ) : activeTab === "register" ? (
                  "Create Account & Proceed"
                ) : forgotStep === "request" ? (
                  "Send Verification Code (OTP) →"
                ) : forgotStep === "otp" ? (
                  "Verify Code →"
                ) : (
                  "Save New Password & Sign In →"
                )}
              </button>
            </form>
            {/* Tab Switcher Footer */}
            <div className="auth-footer">
              {activeTab === "login" && (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="switch-tab-btn"
                    onClick={() => {
                      setErrorMessage("");
                      setActiveTab("register");
                      setFormData(INITIAL_FORM_DATA);
                    }}
                  >
                    Sign Up
                  </button>
                </p>
              )}
              {activeTab === "register" && (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="switch-tab-btn"
                    onClick={() => {
                      setErrorMessage("");
                      setActiveTab("login");
                      setFormData(INITIAL_FORM_DATA);
                    }}
                  >
                    Sign In
                  </button>
                </p>
              )}
              {activeTab === "forgot" && (
                <p>
                  Remember your password?{" "}
                  <button
                    type="button"
                    className="switch-tab-btn"
                    onClick={() => {
                      setErrorMessage("");
                      setForgotStep("request");
                      setActiveTab("login");
                      setFormData(INITIAL_FORM_DATA);
                    }}
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
