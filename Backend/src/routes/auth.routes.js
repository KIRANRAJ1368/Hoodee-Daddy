const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth, requireCustomerAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiters");
const validate = require("../middleware/validate");
const {
  login,
  customerRegister,
  customerLogin,
  customerForgotPassword,
  customerVerifyOtp,
  customerResetPassword,
  customerUpdateProfile
} = require("../validators/authValidators");

const router = express.Router();

/* ── Admin Auth Routes ── */
router.post("/login", authLimiter, login, validate, authController.login);
router.get("/me", requireAuth, authController.me);

/* ── Customer Auth Routes ── */
router.post("/register", authLimiter, customerRegister, validate, authController.customerRegister);
router.post("/customer/register", authLimiter, customerRegister, validate, authController.customerRegister);
router.post("/customer/login", authLimiter, customerLogin, validate, authController.customerLogin);
router.get("/customer/me", requireCustomerAuth, authController.customerMe);
router.put("/customer/profile", requireCustomerAuth, customerUpdateProfile, validate, authController.customerUpdateProfile);
router.post("/customer/forgot-password", authLimiter, customerForgotPassword, validate, authController.customerForgotPassword);
router.post("/forgot-password", authLimiter, customerForgotPassword, validate, authController.customerForgotPassword);
router.post("/customer/verify-otp", authLimiter, customerVerifyOtp, validate, authController.customerVerifyOtp);
router.post("/verify-otp", authLimiter, customerVerifyOtp, validate, authController.customerVerifyOtp);
router.post("/customer/reset-password", authLimiter, customerResetPassword, validate, authController.customerResetPassword);
router.post("/reset-password", authLimiter, customerResetPassword, validate, authController.customerResetPassword);

module.exports = router;
