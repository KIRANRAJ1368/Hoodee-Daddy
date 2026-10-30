const { Op } = require("sequelize");
const { Category, Product, HomepageSection, Banner } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const env = require("../config/env");

function sanitizeMediaUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("/uploads/")) {
    const idx = url.indexOf("/uploads/");
    return `${env.appUrl}${url.slice(idx)}`;
  }
  return url;
}

const CATEGORY_SECTION_KEY_MAP = {
  mens: "mens_categories",
  men: "mens_categories",
  women: "womens_categories",
  womens: "womens_categories",
  boys: "boys_categories",
  girls: "girls_categories",
  babies: "babies_categories"
};

const BANNER_FIELDS = [
  "banner_image_url",
  "banner_image_position",
  "banner_tag",
  "banner_title",
  "banner_subtitle",
  "banner_badge_promo",
  "banner_primary_cta_text",
  "banner_primary_cta_link",
  "banner_secondary_cta_text"
];

async function syncCategoryBanner(category, bannerData = {}) {
  try {
    const bannerImageUrl = bannerData.banner_image_url || category.banner_image_url || "/images/dept-family-banner.jpg";
    const bannerImagePosition = bannerData.banner_image_position || category.banner_image_position || "center center";
    const bannerTag = bannerData.banner_tag || category.banner_tag || category.name;
    const bannerTitle = bannerData.banner_title || category.banner_title || `${category.name.toUpperCase()} COLLECTION`;
    const bannerSubtitle =
      bannerData.banner_subtitle ||
      category.banner_subtitle ||
      category.description ||
      `Explore our premium ${category.name.toLowerCase()} essentials crafted for everyday comfort and modern style.`;
    const bannerBadgePromo = bannerData.banner_badge_promo || category.banner_badge_promo || "New Collection";
    const bannerPrimaryCtaText = bannerData.banner_primary_cta_text || category.banner_primary_cta_text || `Shop ${category.name}`;
    const bannerPrimaryCtaLink = bannerData.banner_primary_cta_link || category.banner_primary_cta_link || `/collection?category=${encodeURIComponent(category.slug)}`;
    const bannerSecondaryCtaText = bannerData.banner_secondary_cta_text || category.banner_secondary_cta_text || "";

    const [banner] = await Banner.findOrCreate({
      where: { placement: category.slug },
      defaults: {
        placement: category.slug,
        title: bannerTitle,
        subtitle: bannerSubtitle,
        tag: bannerTag,
        badge_promo: bannerBadgePromo,
        image_url: bannerImageUrl,
        image_position: bannerImagePosition,
        primary_cta_text: bannerPrimaryCtaText,
        primary_cta_link: bannerPrimaryCtaLink,
        secondary_cta_text: bannerSecondaryCtaText,
        is_active: category.is_active,
        sort_order: category.sort_order
      }
    });

    if (banner) {
      banner.title = bannerTitle;
      banner.subtitle = bannerSubtitle;
      banner.tag = bannerTag;
      banner.badge_promo = bannerBadgePromo;
      banner.image_url = bannerImageUrl;
      banner.image_position = bannerImagePosition;
      banner.primary_cta_text = bannerPrimaryCtaText;
      banner.primary_cta_link = bannerPrimaryCtaLink;
      banner.secondary_cta_text = bannerSecondaryCtaText;
      banner.is_active = category.is_active;
      banner.sort_order = category.sort_order;
      await banner.save();
    }
  } catch (err) {
    console.error("Failed to sync category banner:", err);
  }
}

async function list(req, res) {
  const where = req.query.includeInactive === "true" ? {} : { is_active: true };
  const categories = await Category.findAll({
    where,
    order: [["sort_order", "ASC"], ["id", "ASC"]] });
  const data = categories.map((c) => {
    const json = c.toJSON();
    if (json.banner_image_url) json.banner_image_url = sanitizeMediaUrl(json.banner_image_url);
    return json;
  });
  return sendSuccess(res, { data });
}

async function getBySlug(req, res) {
  const isNumericId = Number.isInteger(Number(req.params.slug)) && String(Number(req.params.slug)) === String(req.params.slug);
  const where = isNumericId
    ? { [Op.or]: [{ id: Number(req.params.slug) }, { slug: req.params.slug }] }
    : { slug: req.params.slug };
  const category = await Category.findOne({ where });
  if (!category) throw ApiError.notFound("Category not found");
  const json = category.toJSON();
  if (json.banner_image_url) json.banner_image_url = sanitizeMediaUrl(json.banner_image_url);
  return sendSuccess(res, { data: json });
}

async function create(req, res) {
  const name = (req.body.name || "").trim();
  const slug = (req.body.slug || "")
    .trim()
    .toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const existing = await Category.findOne({ where: { slug } });
  if (existing) throw ApiError.conflict("A category with this slug already exists");

  const category = await Category.create({
    name,
    slug,
    description: req.body.description || null,
    sort_order: req.body.sort_order ?? 0,
    is_active: req.body.is_active ?? true,
    show_on_homepage: req.body.show_on_homepage ?? true,
    banner_image_url: req.body.banner_image_url || "/images/dept-family-banner.jpg",
    banner_image_position: req.body.banner_image_position || "center center",
    banner_tag: req.body.banner_tag || name,
    banner_title: req.body.banner_title || `${name.toUpperCase()} COLLECTION`,
    banner_subtitle: req.body.banner_subtitle || req.body.description || `Explore our premium ${name.toLowerCase()} essentials crafted for everyday comfort and modern style.`,
    banner_badge_promo: req.body.banner_badge_promo || "New Collection",
    banner_primary_cta_text: req.body.banner_primary_cta_text || `Shop ${name}`,
    banner_primary_cta_link: req.body.banner_primary_cta_link || null,
    banner_secondary_cta_text: req.body.banner_secondary_cta_text || "",
    meta_title: req.body.meta_title || req.body.metaTitle || null,
    meta_description: req.body.meta_description || req.body.metaDescription || null,
    meta_keywords: req.body.meta_keywords || req.body.metaKeywords || null,
    canonical_url: req.body.canonical_url || req.body.canonicalUrl || null
  });

  const sectionKey = CATEGORY_SECTION_KEY_MAP[category.slug];
  if (sectionKey) {
    await HomepageSection.update(
      { is_active: category.show_on_homepage },
      { where: { section_key: sectionKey } }
    );
  }

  await syncCategoryBanner(category, req.body);

  return sendSuccess(res, { statusCode: 201, data: category.toJSON() });
}

async function update(req, res) {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  const oldSlug = category.slug;
  if (req.body.slug && req.body.slug !== category.slug) {
    const clash = await Category.findOne({ where: { slug: req.body.slug } });
    if (clash) throw ApiError.conflict("A category with this slug already exists");
  }

  const fields = [
    "name",
    "slug",
    "description",
    "sort_order",
    "is_active",
    "show_on_homepage",
    "meta_title",
    "meta_description",
    "meta_keywords",
    "canonical_url",
    ...BANNER_FIELDS
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  if (req.body.metaTitle !== undefined) category.meta_title = req.body.metaTitle;
  if (req.body.metaDescription !== undefined) category.meta_description = req.body.metaDescription;
  if (req.body.metaKeywords !== undefined) category.meta_keywords = req.body.metaKeywords;
  if (req.body.canonicalUrl !== undefined) category.canonical_url = req.body.canonicalUrl;
  await category.save();

  // If slug changed, update corresponding banner placement
  if (req.body.slug && req.body.slug !== oldSlug) {
    try {
      await Banner.update(
        { placement: req.body.slug, tag: category.name },
        { where: { placement: oldSlug } }
      );
    } catch (bannerErr) {
      console.error("Failed to sync banner placement:", bannerErr);
    }
  }

  await syncCategoryBanner(category, req.body);

  if (req.body.show_on_homepage !== undefined) {
    const sectionKey = CATEGORY_SECTION_KEY_MAP[category.slug];
    if (sectionKey) {
      await HomepageSection.update(
        { is_active: Boolean(category.show_on_homepage) },
        { where: { section_key: sectionKey } }
      );
    }
  }

  return sendSuccess(res, { data: category.toJSON() });
}

async function remove(req, res) {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  const productCount = await Product.count({ where: { category_id: category.id } });
  if (productCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete — ${productCount} product(s) still belong to this category. Reassign or delete them first.`
    );
  }

  // Remove corresponding category banner and subcategories if any
  try {
    await Banner.destroy({ where: { placement: [category.slug, `${category.slug}_header`] } });
  } catch (bannerErr) {
    console.error("Failed to delete category banner:", bannerErr);
  }

  await category.destroy();
  return sendSuccess(res, { message: "Category deleted" });
}

module.exports = { list, getBySlug, create, update, remove };
