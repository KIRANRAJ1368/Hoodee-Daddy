const { body, param } = require("express-validator");

const create = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 150 }),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\d{10}$/)
    .withMessage("Phone number must contain exactly 10 digits"),
  body("subject").optional({ nullable: true }).isString().isLength({ max: 200 }),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 5000 })
];

const updateStatus = [param("id").isInt(), body("status").isIn(["new", "read", "responded"])];

const idParam = [param("id").isInt()];

module.exports = { create, updateStatus, idParam };
