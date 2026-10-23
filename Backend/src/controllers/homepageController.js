const { HomepageSection, Category, Subcategory, Banner, Product, Announcement } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { serializeProduct } = require("../services/productSerializer");
const { PRODUCT_INCLUDES } = require("../services/productService");

/**
 * One call that gives the customer frontend everything the homepage
 * currently hardcodes: active sections (with their admin-configured
 * title/subtitle/order), categories+subcategories, all active banners
 * grouped by placement, and ready-to-render best-seller / new-arrival
 * product lists. Inactive/toggled-off sections are simply left out so
 * the frontend can render `sections.map(...)` without extra branching.
 */
async function getHomePayload(req, res) {
  const sections = await HomepageSection.findAll({
    order: [["sort_order", "ASC"]]
  });

  const [categories, banners, activeAnnouncement] = await Promise.all([
    Category.findAll({
      where: { is_active: true },
      order: [["sort_order", "ASC"], ["id", "ASC"]],
      include: [{
        model: Subcategory,
        as: "subcategories",
        where: { is_active: true },
        required: false,
        separate: true,
        order: [["sort_order", "ASC"], ["id", "ASC"]]
      }]
    }),
    Banner.findAll({ where: { is_active: true }, order: [["sort_order", "ASC"], ["updated_at", "DESC"]] }),
    Announcement.findOne({
      where: { is_active: true },
      order: [["sort_order", "ASC"], ["id", "DESC"]]
    })
  ]);

  const bannersByPlacement = {};
  banners.forEach((b) => {
    const placement = b.placement === "home_hero" ? "hero" : b.placement;
    if (!bannersByPlacement[placement]) bannersByPlacement[placement] = [];
    bannersByPlacement[placement].push(b);
  });

  // Alias placements so queries by 'men' or 'mens', 'women' or 'womens' always resolve
  if (bannersByPlacement["mens"] && !bannersByPlacement["men"]) {
    bannersByPlacement["men"] = bannersByPlacement["mens"];
  } else if (bannersByPlacement["men"] && !bannersByPlacement["mens"]) {
    bannersByPlacement["mens"] = bannersByPlacement["men"];
  }
  if (bannersByPlacement["women"] && !bannersByPlacement["womens"]) {
    bannersByPlacement["womens"] = bannersByPlacement["women"];
  } else if (bannersByPlacement["womens"] && !bannersByPlacement["women"]) {
    bannersByPlacement["women"] = bannersByPlacement["womens"];
  }

  // Ensure every active category with banner fields is represented in bannersByPlacement
  categories.forEach((cat) => {
    if (!bannersByPlacement[cat.slug] && (cat.banner_image_url || cat.banner_title)) {
      bannersByPlacement[cat.slug] = [{
        id: `cat-${cat.id}`,
        placement: cat.slug,
        title: cat.banner_title || `${cat.name.toUpperCase()} COLLECTION`,
        subtitle: cat.banner_subtitle || cat.description || `Explore our premium ${cat.name.toLowerCase()} essentials.`,
        tag: cat.banner_tag || cat.name,
        badge_promo: cat.banner_badge_promo || "New Collection",
        image_url: cat.banner_image_url || "/images/dept-family-banner.jpg",
        image_position: cat.banner_image_position || "center center",
        primary_cta_text: cat.banner_primary_cta_text || `Shop ${cat.name}`,
        primary_cta_link: `/collection?category=${encodeURIComponent(cat.slug)}`,
        secondary_cta_text: cat.banner_secondary_cta_text || "",
        sort_order: cat.sort_order,
        is_active: cat.is_active
      }];
    }
  });

  const newArrivalsSection = sections.find((s) => s.section_key === "new_arrivals");
  const bestSellersSection = sections.find((s) => s.section_key === "best_sellers");

  const newArrivalsLimit = Math.max(1, Number(newArrivalsSection?.config?.limit) || 12);
  let newArrivalsPromise;
  if (
    newArrivalsSection?.config?.mode === "manual" &&
    Array.isArray(newArrivalsSection.config.product_ids) &&
    newArrivalsSection.config.product_ids.length > 0
  ) {
    newArrivalsPromise = Product.findAll({
      where: { id: newArrivalsSection.config.product_ids, is_active: true },
      include: PRODUCT_INCLUDES,
      limit: newArrivalsLimit
    });
  } else {
    newArrivalsPromise = Product.findAll({
      where: { is_active: true },
      include: PRODUCT_INCLUDES,
      order: [["is_new_arrival", "DESC"], ["created_at", "DESC"], ["id", "DESC"]],
      limit: newArrivalsLimit
    });
  }

  const bestSellersLimit = Math.max(1, Number(bestSellersSection?.config?.limit) || 12);
  let bestSellersPromise;
  if (
    bestSellersSection?.config?.mode === "manual" &&
    Array.isArray(bestSellersSection.config.product_ids) &&
    bestSellersSection.config.product_ids.length > 0
  ) {
    bestSellersPromise = Product.findAll({
      where: { id: bestSellersSection.config.product_ids, is_active: true },
      include: PRODUCT_INCLUDES,
      limit: bestSellersLimit
    });
  } else {
    bestSellersPromise = Product.findAll({
      where: { is_active: true, is_best_seller: true },
      include: PRODUCT_INCLUDES,
      order: [["review_count", "DESC"]],
      limit: bestSellersLimit
    }).then(async (items) => {
      if (items.length > 0) return items;
      // Fallback to top reviewed products
      return Product.findAll({
        where: { is_active: true },
        include: PRODUCT_INCLUDES,
        order: [["review_count", "DESC"], ["rating", "DESC"]],
        limit: bestSellersLimit
      });
    });
  }

  const [newArrivals, bestSellers] = await Promise.all([newArrivalsPromise, bestSellersPromise]);
  const offerController = require("./offerController");
  const allHomeProducts = [...newArrivals, ...bestSellers];
  const offersMap = await offerController.activeForProducts(allHomeProducts);

  return sendSuccess(res, {
    data: {
      sections,
      categories,
      banners: bannersByPlacement,
      activeAnnouncement: activeAnnouncement || null,
      newArrivals: newArrivals.map((p) => ({
        ...serializeProduct(p),
        offer: offersMap.get(Number(p.id)) || null
      })),
      bestSellers: bestSellers.map((p) => ({
        ...serializeProduct(p),
        offer: offersMap.get(Number(p.id)) || null
      }))
    }
  });
}

// ── Admin: homepage section registry management ─────────────────────────

const SECTION_TO_CATEGORY_SLUG_MAP = {
  mens_categories: "mens",
  womens_categories: "women",
  boys_categories: "boys",
  girls_categories: "girls",
  babies_categories: "babies"
};

async function listSections(req, res) {
  const sections = await HomepageSection.findAll({ order: [["sort_order", "ASC"]] });
  return sendSuccess(res, { data: sections });
}

async function updateSection(req, res) {
  const section = await HomepageSection.findOne({ where: { section_key: req.params.key } });
  if (!section) throw ApiError.notFound("Homepage section not found");

  const fields = ["title", "subtitle", "is_active", "sort_order", "config"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) section[f] = req.body[f];
  });
  await section.save();

  if (req.body.is_active !== undefined) {
    const catSlug = SECTION_TO_CATEGORY_SLUG_MAP[req.params.key];
    if (catSlug) {
      await Category.update(
        { show_on_homepage: Boolean(req.body.is_active) },
        { where: { slug: catSlug } }
      );
    }
  }

  return sendSuccess(res, { data: section });
}

module.exports = { getHomePayload, listSections, updateSection };
