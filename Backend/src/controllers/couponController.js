const { Coupon } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

async function validate(req, res) {
  const { code, subtotal } = req.body;
  if (!code) {
    throw ApiError.badRequest("Coupon code is required");
  }

  const cleanCode = (code || "").trim().toUpperCase();
  const cartSubtotal = Number(subtotal) || 0;

  const coupon = await Coupon.findOne({ where: { code: cleanCode, is_active: true } });
  if (!coupon) {
    throw ApiError.badRequest("Invalid or expired coupon code");
  }

  if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
    throw ApiError.badRequest("This coupon code has expired");
  }

  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
    throw ApiError.badRequest("This coupon code has reached its maximum usage limit");
  }

  const minSpend = Number(coupon.min_spend) || 0;
  if (cartSubtotal < minSpend) {
    throw ApiError.badRequest(
      `Minimum spend of ₹${minSpend.toLocaleString("en-IN")} required for coupon ${cleanCode}`
    );
  }

  let discountAmount = 0;
  const discountVal = Number(coupon.discount_value);

  if (coupon.discount_type === "percentage") {
    discountAmount = (cartSubtotal * discountVal) / 100;
    if (coupon.max_discount && Number(coupon.max_discount) > 0) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
    }
  } else {
    discountAmount = Math.min(cartSubtotal, discountVal);
  }

  return sendSuccess(res, {
    message: `Coupon ${cleanCode} applied successfully!`,
    data: {
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: discountVal,
      discount_amount: Math.round(discountAmount * 100) / 100,
      min_spend: minSpend,
      max_discount: coupon.max_discount ? Number(coupon.max_discount) : null
    }
  });
}

async function list(req, res) {
  const coupons = await Coupon.findAll({ order: [["created_at", "DESC"]] });
  return sendSuccess(res, { data: coupons });
}

async function listAvailable(req, res) {
  const now = new Date();
  const coupons = await Coupon.findAll({
    where: { is_active: true },
    attributes: ["code", "description", "discount_type", "discount_value", "min_spend", "max_discount", "expires_at", "usage_limit", "times_used"],
    order: [["created_at", "DESC"]]
  });
  const available = coupons.filter((coupon) =>
    (!coupon.expires_at || new Date(coupon.expires_at) >= now) &&
    (!coupon.usage_limit || coupon.times_used < coupon.usage_limit)
  );
  return sendSuccess(res, { data: available });
}

async function create(req, res) {
  const code = req.body.code;
  const description = req.body.description;
  const discount_type = req.body.discount_type || req.body.discountType || "percentage";
  const discount_value = req.body.discount_value !== undefined ? req.body.discount_value : req.body.discountValue;
  const min_spend = req.body.min_spend !== undefined ? req.body.min_spend : req.body.minSpend;
  const max_discount = req.body.max_discount !== undefined ? req.body.max_discount : req.body.maxDiscount;
  const usage_limit = req.body.usage_limit !== undefined ? req.body.usage_limit : req.body.usageLimit;
  const expires_at = req.body.expires_at !== undefined ? req.body.expires_at : req.body.expiresAt;
  const is_active = req.body.is_active !== undefined ? req.body.is_active : req.body.isActive;

  if (!code || discount_value === undefined || discount_value === null || discount_value === "") {
    throw ApiError.badRequest("Coupon code and discount value are required");
  }

  const existing = await Coupon.findOne({ where: { code: code.trim().toUpperCase() } });
  if (existing) {
    throw ApiError.badRequest("A coupon with this code already exists");
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    description: description || null,
    discount_type: discount_type || "percentage",
    discount_value: Number(discount_value),
    min_spend: Number(min_spend) || 0,
    max_discount: max_discount ? Number(max_discount) : null,
    usage_limit: usage_limit ? Number(usage_limit) : null,
    expires_at: expires_at || null,
    is_active: is_active !== undefined ? Boolean(is_active) : true
  });

  return sendSuccess(res, { statusCode: 201, data: coupon });
}

async function update(req, res) {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");

  const fieldMap = {
    description: ["description"],
    discount_type: ["discount_type", "discountType"],
    discount_value: ["discount_value", "discountValue"],
    min_spend: ["min_spend", "minSpend"],
    max_discount: ["max_discount", "maxDiscount"],
    usage_limit: ["usage_limit", "usageLimit"],
    expires_at: ["expires_at", "expiresAt"],
    is_active: ["is_active", "isActive"]
  };

  Object.entries(fieldMap).forEach(([modelField, aliases]) => {
    for (const alias of aliases) {
      if (req.body[alias] !== undefined) {
        coupon[modelField] = req.body[alias];
        break;
      }
    }
  });

  if (req.body.code) {
    coupon.code = req.body.code.trim().toUpperCase();
  }

  await coupon.save();
  return sendSuccess(res, { data: coupon });
}

async function getById(req, res) {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  return sendSuccess(res, { data: coupon });
}

async function remove(req, res) {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  await coupon.destroy();
  return sendSuccess(res, { message: "Coupon deleted successfully" });
}

module.exports = {
  validate,
  listAvailable,
  list,
  getById,
  create,
  update,
  remove
};
