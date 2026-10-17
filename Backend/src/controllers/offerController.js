const { Op } = require("sequelize");
const { Offer, Product, Category, Subcategory } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

const VALID_TARGET_TYPES = ["all", "category", "subcategory", "product"];

const parseTargetIds = (offerOrIds) => {
  const raw = offerOrIds && typeof offerOrIds === "object" && !Array.isArray(offerOrIds)
    ? offerOrIds.target_ids
    : offerOrIds;
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
    } catch {
      return [];
    }
  }
  return [];
};

async function resolveTargetAndProducts(type, rawIds) {
  if (!VALID_TARGET_TYPES.includes(type)) {
    throw ApiError.badRequest("Invalid offer target type. Choose Overall Shop, Category, Subcategory, or Particular Product.");
  }

  const cleanIds = Array.from(new Set(parseTargetIds(rawIds)));

  if (type === "all") {
    const products = await Product.findAll({
      where: { is_active: true },
      attributes: ["id", "name", "price", "original_price", "category_id", "subcategory_id"]
    });
    return { savedTargetIds: [], products };
  }

  if (!cleanIds.length) {
    throw ApiError.badRequest(
      type === "category"
        ? "Please select at least one category."
        : type === "subcategory"
        ? "Please select at least one subcategory."
        : "Please select at least one product."
    );
  }

  if (type === "category") {
    const categories = await Category.findAll({ where: { id: cleanIds }, attributes: ["id", "name"] });
    if (!categories.length) {
      throw ApiError.badRequest("Selected category was not found.");
    }
    const products = await Product.findAll({
      where: { category_id: cleanIds },
      attributes: ["id", "name", "price", "original_price", "category_id", "subcategory_id"]
    });
    return { savedTargetIds: categories.map((c) => Number(c.id)), products };
  }

  if (type === "subcategory") {
    const subcategories = await Subcategory.findAll({ where: { id: cleanIds }, attributes: ["id", "name", "category_id"] });
    if (!subcategories.length) {
      throw ApiError.badRequest("Selected subcategory was not found.");
    }
    const products = await Product.findAll({
      where: { subcategory_id: cleanIds },
      attributes: ["id", "name", "price", "original_price", "category_id", "subcategory_id"]
    });
    return { savedTargetIds: subcategories.map((s) => Number(s.id)), products };
  }

  // type === "product"
  const products = await Product.findAll({
    where: { id: cleanIds },
    attributes: ["id", "name", "price", "original_price", "category_id", "subcategory_id"]
  });
  if (!products.length) {
    throw ApiError.badRequest("Selected products were not found.");
  }
  return { savedTargetIds: products.map((p) => Number(p.id)), products };
}

function validateDiscount(body, products) {
  const value = Number(body.discount_value);
  if (!Number.isFinite(value) || value <= 0 || !["percentage", "flat"].includes(body.discount_type)) {
    throw ApiError.badRequest("Enter a valid discount value greater than 0.");
  }
  if (body.discount_type === "percentage" && value >= 100) {
    throw ApiError.badRequest("Percentage discount must be less than 100%.");
  }
  for (const p of products) {
    const mrp = Number(p.original_price || p.price);
    if (!mrp || mrp <= 0) continue;
    const reduction = body.discount_type === "percentage" ? (mrp * value) / 100 : value;
    if (mrp - reduction < 0.01) {
      throw ApiError.badRequest(
        `Flat discount of ₹${value} exceeds or equals the price of "${p.name || `Product #${p.id}`}" (₹${mrp}). Please reduce the flat discount or use a percentage discount.`
      );
    }
  }
}

async function checkOverlap(targetType, targetIds, startsAt, endsAt, ignoreId = null) {
  const numericIgnoreId = ignoreId ? Number(ignoreId) : null;
  const offers = await Offer.findAll({
    where: {
      is_active: true,
      target_type: targetType,
      ...(numericIgnoreId ? { id: { [Op.ne]: numericIgnoreId } } : {})
    }
  });

  const conflict = offers.find((offer) => {
    if (numericIgnoreId && Number(offer.id) === numericIgnoreId) return false;
    const timeOverlaps = new Date(offer.starts_at) < endsAt && new Date(offer.ends_at) > startsAt;
    if (!timeOverlaps) return false;
    if (targetType === "all") return true;
    const existingIds = parseTargetIds(offer);
    return existingIds.some((id) => targetIds.includes(id));
  });

  if (conflict) {
    throw ApiError.conflict(
      `This target already has an active overlapping offer "${conflict.name}" scheduled during this period. Edit or deactivate "${conflict.name}" first, or choose a different target.`,
      { offerId: conflict.id }
    );
  }
}

function doesOfferMatchProduct(offer, product) {
  const type = offer.target_type;
  if (type === "all") return true;
  const ids = parseTargetIds(offer);
  if (type === "product") {
    return ids.includes(Number(product.id));
  }
  if (type === "subcategory") {
    const subId = Number(product.subcategory_id ?? product.subcategoryId);
    return subId > 0 && ids.includes(subId);
  }
  if (type === "category") {
    const catId = Number(product.category_id ?? product.categoryId);
    return catId > 0 && ids.includes(catId);
  }
  return false;
}

async function list(req, res) {
  const rows = await Offer.findAll({ order: [["created_at", "DESC"], ["id", "DESC"]] });
  const now = new Date();
  return sendSuccess(res, {
    data: rows.map((row) => {
      const json = row.toJSON();
      return {
        ...json,
        target_ids: parseTargetIds(json),
        status:
          !row.is_active || new Date(row.ends_at) <= now
            ? "inactive"
            : new Date(row.starts_at) > now
            ? "scheduled"
            : "active"
      };
    })
  });
}

async function create(req, res) {
  const body = req.body || {};
  const startsAt = body.starts_at ? new Date(body.starts_at) : new Date();
  const endsAt = body.ends_at ? new Date(body.ends_at) : new Date(Date.now() + 7 * 86400000);

  if (!body.name?.trim()) {
    throw ApiError.badRequest("Please enter an offer name.");
  }
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    throw ApiError.badRequest("End date/time must be after start date/time.");
  }

  const targetType = body.target_type || "product";
  const { savedTargetIds, products } = await resolveTargetAndProducts(targetType, body.target_ids);
  validateDiscount(body, products);
  await checkOverlap(targetType, savedTargetIds, startsAt, endsAt);

  const offer = await Offer.create({
    name: body.name.trim(),
    target_type: targetType,
    target_ids: savedTargetIds,
    discount_type: body.discount_type,
    discount_value: Number(body.discount_value),
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: body.is_active !== false
  });

  return sendSuccess(res, { statusCode: 201, data: offer });
}

async function update(req, res) {
  const offer = await Offer.findByPk(req.params.id);
  if (!offer) throw ApiError.notFound("Offer not found");

  if (req.body.is_active !== undefined && Object.keys(req.body).length === 1) {
    const nextActive = Boolean(req.body.is_active);
    if (nextActive) {
      await checkOverlap(
        offer.target_type,
        parseTargetIds(offer),
        new Date(offer.starts_at),
        new Date(offer.ends_at),
        offer.id
      );
    }
    offer.is_active = nextActive;
    await offer.save();
    return sendSuccess(res, { data: offer });
  }

  const body = { ...offer.toJSON(), ...req.body };
  const startsAt = new Date(body.starts_at);
  const endsAt = new Date(body.ends_at);
  if (!body.name?.trim() || !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    throw ApiError.badRequest("Enter offer name and a valid start/end schedule.");
  }

  const targetType = body.target_type || offer.target_type || "product";
  const { savedTargetIds, products } = await resolveTargetAndProducts(targetType, body.target_ids);
  validateDiscount(body, products);
  if (body.is_active !== false) {
    await checkOverlap(targetType, savedTargetIds, startsAt, endsAt, offer.id);
  }

  await offer.update({
    name: body.name.trim(),
    target_type: targetType,
    target_ids: savedTargetIds,
    discount_type: body.discount_type,
    discount_value: Number(body.discount_value),
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: body.is_active !== false
  });

  return sendSuccess(res, { data: offer });
}

async function remove(req, res) {
  const offer = await Offer.findByPk(req.params.id);
  if (!offer) {
    return sendSuccess(res, { message: "Offer deleted or already removed" });
  }
  await offer.destroy();
  return sendSuccess(res, { message: "Offer deleted" });
}

/**
 * Resolves the highest-priority active offer for each product:
 * Specificity priority: "product" (4) > "subcategory" (3) > "category" (2) > "all" (1)
 */
async function activeForProducts(products) {
  if (!Array.isArray(products) || !products.length) return new Map();

  const now = new Date();
  const offers = await Offer.findAll({
    where: {
      is_active: true,
      starts_at: { [Op.lte]: now },
      ends_at: { [Op.gt]: now }
    },
    order: [["id", "DESC"]]
  });

  if (!offers.length) return new Map();

  const priorityWeight = { product: 4, subcategory: 3, category: 2, all: 1 };
  const sortedOffers = [...offers].sort(
    (a, b) => (priorityWeight[b.target_type] || 0) - (priorityWeight[a.target_type] || 0) || b.id - a.id
  );

  const map = new Map();
  for (const p of products) {
    const offer = sortedOffers.find((o) => doesOfferMatchProduct(o, p));
    if (!offer) continue;
    const mrp = Number(p.original_price || p.originalPrice || p.price);
    if (!mrp || mrp <= 0) continue;
    const discount =
      offer.discount_type === "percentage"
        ? (mrp * Number(offer.discount_value)) / 100
        : Number(offer.discount_value);
    const price = Math.max(1, Math.round((mrp - discount) * 100) / 100);
    map.set(Number(p.id), {
      id: offer.id,
      name: offer.name,
      targetType: offer.target_type,
      price,
      originalPrice: mrp,
      discountPercent: Math.max(1, Math.round(((mrp - price) / mrp) * 100)),
      discountType: offer.discount_type,
      discountValue: Number(offer.discount_value),
      startsAt: offer.starts_at,
      endsAt: offer.ends_at
    });
  }
  return map;
}

module.exports = { list, create, update, remove, activeForProducts };
