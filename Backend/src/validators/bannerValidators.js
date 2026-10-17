const { body, param } = require("express-validator");

function buildRules(isUpdate = false) {
  const placementRule = body("placement")
    .customSanitizer((val, { req }) => val || req.body.position || (isUpdate ? undefined : "hero"))
    .trim();
  const titleRule = body("title").trim();
  const imageRule = body("image_url")
    .customSanitizer((val, { req }) => val || req.body.imageUrl || (isUpdate ? undefined : ""))
    .trim();

  return [
    isUpdate
      ? placementRule.optional({ nullable: true, checkFalsy: true }).isLength({ max: 60 })
      : placementRule.notEmpty().withMessage("Placement is required").isLength({ max: 60 }),
    isUpdate
      ? titleRule.optional({ nullable: true, checkFalsy: true }).isLength({ max: 200 })
      : titleRule.notEmpty().withMessage("Title is required").isLength({ max: 200 }),
    body("subtitle").optional({ nullable: true }).isString(),
    body("tag").optional({ nullable: true }).isString(),
    body("badge_promo").optional({ nullable: true }).isString(),
    isUpdate
      ? imageRule.optional({ nullable: true, checkFalsy: true })
      : imageRule.notEmpty().withMessage("Image URL is required"),
    body("image_position").optional({ nullable: true }).isString(),
    body("primary_cta_text").optional({ nullable: true }).isString(),
    body("primary_cta_link").optional({ nullable: true }).isString(),
    body("secondary_cta_text").optional({ nullable: true }).isString(),
    body("secondary_cta_link").optional({ nullable: true }).isString(),
    body("sort_order").optional({ nullable: true, checkFalsy: true }).isInt().toInt(),
    body("is_active").optional({ nullable: true }).isBoolean().toBoolean()
  ];
}

const create = buildRules(false);
const update = [param("id").isInt(), ...buildRules(true)];
const idParam = [param("id").isInt()];

module.exports = { create, update, idParam };

