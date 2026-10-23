const { Banner } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

async function list(req, res) {
  const where = req.query.includeInactive === "true" ? {} : { is_active: true };
  if (req.query.placement) where.placement = req.query.placement;

  const banners = await Banner.findAll({ where, order: [["sort_order", "ASC"]] });
  return sendSuccess(res, { data: banners });
}

async function create(req, res) {
  const placement = req.body.placement === "home_hero" ? "hero" : req.body.placement;
  if (placement === "hero") {
    const heroCount = await Banner.count({ where: { placement: "hero" } });
    if (heroCount >= 3) {
      throw ApiError.badRequest("Maximum 3 Hero Banners can be added.");
    }
  }
  if (placement === "offers" && await Banner.count({ where: { placement: "offers" } }) >= 10) {
    throw ApiError.badRequest("Maximum 10 offer banners can be added.");
  }

  const banner = await Banner.create({
    placement,
    tag: req.body.tag || null,
    title: req.body.title || (placement === "hero" ? "Hero Banner" : "Banner"),
    subtitle: req.body.subtitle || null,
    badge_promo: req.body.badge_promo || null,
    image_url: req.body.image_url,
    image_position: req.body.image_position || null,
    primary_cta_text: req.body.primary_cta_text || null,
    primary_cta_link: req.body.primary_cta_link || null,
    secondary_cta_text: req.body.secondary_cta_text || null,
    secondary_cta_link: req.body.secondary_cta_link || null,
    sort_order: req.body.sort_order ?? 0,
    is_active: req.body.is_active ?? true
  });
  return sendSuccess(res, { statusCode: 201, data: banner });
}

async function update(req, res) {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) throw ApiError.notFound("Banner not found");

  const placement = req.body.placement === "home_hero" ? "hero" : req.body.placement;
  if (placement === "hero" && banner.placement !== "hero") {
    const heroCount = await Banner.count({ where: { placement: "hero" } });
    if (heroCount >= 3) {
      throw ApiError.badRequest("Maximum 3 Hero Banners can be added.");
    }
  }
  if (placement === "offers" && banner.placement !== "offers" && await Banner.count({ where: { placement: "offers" } }) >= 10) {
    throw ApiError.badRequest("Maximum 10 offer banners can be added.");
  }

  const fields = [
    "placement",
    "tag",
    "title",
    "subtitle",
    "badge_promo",
    "image_url",
    "image_position",
    "primary_cta_text",
    "primary_cta_link",
    "secondary_cta_text",
    "secondary_cta_link",
    "sort_order",
    "is_active"
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) banner[f] = f === "placement" ? placement : req.body[f];
  });
  await banner.save();
  return sendSuccess(res, { data: banner });
}

async function remove(req, res) {
  const banner = await Banner.findByPk(req.params.id);
  if (!banner) throw ApiError.notFound("Banner not found");
  await banner.destroy();
  return sendSuccess(res, { message: "Banner deleted" });
}

module.exports = { list, create, update, remove };
