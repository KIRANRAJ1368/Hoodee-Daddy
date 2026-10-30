const { body, param } = require("express-validator");

const create = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 80 }),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug may only contain lowercase letters, numbers and hyphens"),
  body("description").trim().notEmpty().withMessage("Category description is required"),
  body("sort_order").optional().isInt(),
  body("banner_image_url").optional({ nullable: true }).isString(),
  body("is_active").optional().isBoolean(),
  body("show_on_homepage").optional().isBoolean(),
  body("meta_title").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("metaTitle").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("meta_description").optional({ nullable: true }).isString(),
  body("metaDescription").optional({ nullable: true }).isString(),
  body("meta_keywords").optional({ nullable: true }).isString().isLength({ max: 500 }),
  body("metaKeywords").optional({ nullable: true }).isString().isLength({ max: 500 }),
  body("canonical_url").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("canonicalUrl").optional({ nullable: true }).isString().isLength({ max: 255 })
];

const update = [
  param("id").isInt().withMessage("Invalid category id"),
  body("name").optional().trim().notEmpty().isLength({ max: 80 }),
  body("slug")
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug may only contain lowercase letters, numbers and hyphens"),
  body("description").optional({ nullable: true }).isString(),
  body("sort_order").optional().isInt(),
  body("is_active").optional().isBoolean(),
  body("show_on_homepage").optional().isBoolean(),
  body("meta_title").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("metaTitle").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("meta_description").optional({ nullable: true }).isString(),
  body("metaDescription").optional({ nullable: true }).isString(),
  body("meta_keywords").optional({ nullable: true }).isString().isLength({ max: 500 }),
  body("metaKeywords").optional({ nullable: true }).isString().isLength({ max: 500 }),
  body("canonical_url").optional({ nullable: true }).isString().isLength({ max: 255 }),
  body("canonicalUrl").optional({ nullable: true }).isString().isLength({ max: 255 })
];

const idParam = [param("id").isInt().withMessage("Invalid category id")];

module.exports = { create, update, idParam };
