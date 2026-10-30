const { body, param } = require("express-validator");

// Factory so the create and update chains never share chain objects.
// express-validator v7 chain methods (including .optional()) mutate the
// chain they run on and return the same instance, so mapping .optional()
// over `create` would silently overwrite create's own optional settings.
function productRules() {
  return [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 200 }),
    body("slug")
      .trim()
      .notEmpty()
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug may only contain lowercase letters, numbers and hyphens"),
    body("sku").optional({ values: "falsy" }).trim().isLength({ max: 60 }),
    body("category_id").isInt().withMessage("category_id is required"),
    body("product_type").trim().notEmpty().withMessage("Product type is required").isLength({ max: 60 }),
    body("description").trim().notEmpty().withMessage("Product description is required"),
    body("price").isFloat({ min: 0.01 }).withMessage("Selling price must be greater than zero"),
    body("original_price")
      .optional({ values: "null" })
      .isFloat({ min: 0.01 })
      .withMessage("Original / MRP price must be greater than zero")
      .custom((value, { req }) =>
        req.body.price === undefined || req.body.price === null || req.body.price === "" || Number(value) > Number(req.body.price)
      )
      .withMessage("Original / MRP price must be higher than selling price"),
    body("stock_count").optional().isInt({ min: 0 }),
    body("sales_count").optional().isInt({ min: 0 }),
    body("in_stock").optional().isBoolean(),
    body("is_best_seller").optional().isBoolean(),
    body("is_new_arrival").optional().isBoolean(),
    body("is_sale").optional().isBoolean(),
    body("show_on_homepage").optional().isBoolean(),
    body("badge_label").optional({ values: "null" }).isString().isLength({ max: 40 }),
    body("badge_type").optional({ values: "null" }).isIn(["hot", "new", "sale"]),
    body("images")
      .isArray({ min: 2, max: 12 })
      .withMessage("Both Front View and Back View images are required (minimum 2). Maximum 12 images allowed."),
    body("images.*")
      .custom((val) => {
        if (typeof val === "string" && val.trim().length > 0) return true;
        if (typeof val === "object" && val !== null && typeof val.url === "string" && val.url.trim().length > 0) return true;
        throw new Error("Invalid image entry");
      })
      .withMessage("Each image must have a valid URL"),
    body("specifications").isArray({ min: 4, max: 10 }).withMessage("Specifications must contain between 4 and 10 items"),
    body("specifications.*.title").isString().trim().notEmpty().withMessage("Specification title cannot be empty"),
    body("specifications.*.value").isString().trim().notEmpty().withMessage("Specification value cannot be empty"),
    body("colors").isArray({ min: 1 }).withMessage("At least one product color is required"),
    body("colors.*.name").isString().trim().notEmpty().withMessage("Color name is required"),
    body("colors.*.hex").optional().isString(),
    body("colors.*.hex_code").optional().isString(),
    body("sizes").isArray({ min: 1 }).withMessage("At least one size is required"),
    body("sizes.*").optional(),
    body("variants").isArray({ min: 1 }).withMessage("At least one color and size variant is required"),
    body("variants.*.size").optional({ values: "null" }),
    body("variants.*.color").optional({ values: "null" }),
    body("variants.*.stock_count").optional().isInt({ min: 0 }),
    body("variants.*.low_stock_threshold").optional().isInt({ min: 0 }),
    body("variants.*.gst_rate").optional().isFloat({ min: 0, max: 100 }),
    body("variants.*.sales_count").optional().isInt({ min: 0 }),
    body("variants.*.sku_suffix").optional({ values: "null" }),
    body("variants.*.price_override").optional({ values: "null" }).isFloat({ min: 0.01 }),
    body("variants.*.original_price_override").optional({ values: "null" }).isFloat({ min: 0.01 }),
    body("variants.*.image_url").optional({ values: "null" }).isString().isLength({ max: 2048 }),
    body("variants.*.gallery_images").optional({ values: "null" }).custom((val) => {
      if (Array.isArray(val)) return val.length <= 12;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return !Array.isArray(parsed) || parsed.length <= 12;
        } catch {
          return true;
        }
      }
      return true;
    }).withMessage("Gallery images must have at most 12 images"),
    body("meta_title").optional({ values: "null" }).isString().isLength({ max: 255 }),
    body("metaTitle").optional({ values: "null" }).isString().isLength({ max: 255 }),
    body("meta_description").optional({ values: "null" }).isString(),
    body("metaDescription").optional({ values: "null" }).isString(),
    body("meta_keywords").optional({ values: "null" }).isString().isLength({ max: 500 }),
    body("metaKeywords").optional({ values: "null" }).isString().isLength({ max: 500 }),
    body("canonical_url").optional({ values: "null" }).isString().isLength({ max: 255 }),
    body("canonicalUrl").optional({ values: "null" }).isString().isLength({ max: 255 })
  ];
}

const create = productRules();

const update = [param("id").isInt(), ...productRules().map((rule) => rule.optional({ values: "null" }))];

const idParam = [param("id").isInt().withMessage("Invalid product id")];
const stock = [
  ...idParam,
  body("stock_count").optional().isInt({ min: 0 }),
  body("sales_count").optional().isInt({ min: 0 }),
  body("in_stock").optional().isBoolean()
];

module.exports = { create, update, idParam, stock };
