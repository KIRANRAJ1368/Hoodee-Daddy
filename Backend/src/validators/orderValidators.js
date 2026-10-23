const { body, param } = require("express-validator");

const create = [
  body("customer_name")
    .customSanitizer((val, { req }) => val || req.body.name || req.body.fullName || "")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3 and 30 characters"),
  body("email")
    .customSanitizer((val, { req }) => val || req.body.customer_email || req.body.customerEmail || "")
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("phone")
    .customSanitizer((val, { req }) => val || req.body.customer_phone || req.body.customerPhone || "")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .matches(/^\d{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),
  body("shipping_address")
    .customSanitizer((val, { req }) => val || req.body.address || req.body.shipping_address_line1 || req.body.shippingAddress || "")
    .trim()
    .notEmpty()
    .withMessage("Shipping address is required"),
  body("city").optional({ nullable: true }).isString(),
  body("state").optional({ nullable: true }).isString(),
  body("pincode")
    .customSanitizer((val, { req }) => val || req.body.postal_code || req.body.postalCode || req.body.zip || "")
    .notEmpty()
    .withMessage("PIN code is required")
    .matches(/^\d{6}$/)
    .withMessage("PIN code must contain exactly 6 digits"),
  body("payment_method")
    .customSanitizer((val) => {
      if (!val) return "COD";
      const s = String(val).trim().toUpperCase();
      if (s.includes("COD") || s.includes("CASH")) return "COD";
      if (s.includes("PREPAID") || s.includes("ONLINE") || s.includes("RAZORPAY")) return "PREPAID";
      return s;
    })
    .optional()
    .isIn(["COD", "PREPAID"]),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.product_id").isInt().withMessage("Each item needs a valid product_id"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Each item needs a quantity of at least 1"),
  body("items.*.size").optional({ nullable: true }).isString(),
  body("items.*.color").optional({ nullable: true }).isString(),
  body("notes").optional({ nullable: true }).isString()
];

const updateStatus = [
  param("id").isInt(),
  body("status").isIn(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"])
];

const idParam = [param("id").isInt()];

module.exports = { create, updateStatus, idParam };
