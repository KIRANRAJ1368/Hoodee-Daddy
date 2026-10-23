const { body, param } = require("express-validator");

const idParam = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Invalid announcement ID")
    .toInt()
];

const create = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Announcement message is required")
    .isLength({ max: 500 })
    .withMessage("Message must be under 500 characters"),
  body("link_url")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Link URL must be under 300 characters"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean")
    .toBoolean()
];

const update = [
  ...idParam,
  body("message")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Announcement message cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Message must be under 500 characters"),
  body("link_url")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Link URL must be under 300 characters"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean")
    .toBoolean()
];

module.exports = {
  idParam,
  create,
  update
};
