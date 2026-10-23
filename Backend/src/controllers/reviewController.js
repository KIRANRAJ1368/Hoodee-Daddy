const { Op } = require("sequelize");
const { Product, Review, Order, OrderItem } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

async function resolveProduct(idOrSlug) {
  if (!idOrSlug) return null;
  const clean = String(idOrSlug).trim();
  const isNumeric = /^\d+$/.test(clean);
  if (isNumeric) {
    const byId = await Product.findByPk(Number(clean));
    if (byId) return byId;
  }
  const hyphenated = clean.replace(/_/g, "-");
  const underscored = clean.replace(/-/g, "_");
  return Product.findOne({
    where: {
      [Op.or]: [
        { slug: clean },
        { slug: hyphenated },
        { slug: underscored },
        { sku: clean }
      ]
    }
  });
}

async function getCustomerEligibility(productId, user) {
  if (!user) {
    return {
      canReview: false,
      hasPurchased: false,
      isDelivered: false,
      alreadyReviewed: false,
      reason: "not_logged_in",
      message: "Please sign in to write a review.",
      orderItemId: null
    };
  }

  // 1. Check if user already submitted an active/approved review for this product
  const existingReview = await Review.findOne({
    where: {
      product_id: productId,
      [Op.or]: [
        { user_id: user.id },
        ...(user.email
          ? [{ customer_email: user.email }, { customer_email: user.email.toLowerCase() }]
          : [])
      ]
    }
  });

  // 2. Query all order items for this user and this product (excluding cancelled or returned orders)
  const orderWhere = {
    [Op.or]: [
      { user_id: user.id },
      ...(user.email
        ? [{ email: user.email }, { email: user.email.toLowerCase() }]
        : [])
    ],
    status: { [Op.notIn]: ["cancelled", "returned"] }
  };

  const orderItems = await OrderItem.findAll({
    where: { product_id: productId },
    include: [
      {
        model: Order,
        as: "order",
        where: orderWhere,
        attributes: ["id", "order_number", "user_id", "email", "status", "created_at"]
      },
      {
        model: Review,
        as: "review",
        attributes: ["id"]
      }
    ],
    order: [[{ model: Order, as: "order" }, "created_at", "DESC"]]
  });

  const hasPurchased = orderItems.length > 0;

  if (existingReview) {
    return {
      canReview: false,
      hasPurchased,
      isDelivered: orderItems.some((item) => item.order?.status === "delivered"),
      alreadyReviewed: true,
      existingReviewId: existingReview.id,
      reason: "already_reviewed",
      message: "You have already submitted a review for this product.",
      orderItemId: existingReview.order_item_id || null
    };
  }

  if (!hasPurchased) {
    return {
      canReview: false,
      hasPurchased: false,
      isDelivered: false,
      alreadyReviewed: false,
      reason: "not_purchased",
      message: "Only verified buyers who have purchased this product can submit a review.",
      orderItemId: null
    };
  }

  // Check if any order is delivered for verified buyer status
  const deliveredItems = orderItems.filter((item) => item.order?.status === "delivered");
  const isDelivered = deliveredItems.length > 0;
  const eligibleItem = orderItems.find((item) => !item.review) || orderItems[0];

  return {
    canReview: true,
    hasPurchased: true,
    isDelivered,
    alreadyReviewed: false,
    reason: "eligible",
    message: "You are eligible to submit a verified purchase review.",
    orderItemId: eligibleItem ? eligibleItem.id : null
  };
}

async function checkReviewEligibility(req, res) {
  const { idOrSlug } = req.params;
  const product = await resolveProduct(idOrSlug);
  if (!product) throw ApiError.notFound("Product not found");

  const eligibility = await getCustomerEligibility(product.id, req.user);
  return sendSuccess(res, { data: eligibility });
}

async function listByProduct(req, res) {
  const { idOrSlug } = req.params;
  const product = await resolveProduct(idOrSlug);
  if (!product) throw ApiError.notFound("Product not found");

  let dbReviews = await Review.findAll({
    where: { product_id: product.id, is_approved: true },
    order: [["created_at", "DESC"]]
  });

  const totalReviews = dbReviews.length;
  const ratingSum = dbReviews.reduce((sum, r) => sum + Number(r.rating), 0);
  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  dbReviews.forEach((r) => {
    const score = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
    breakdown[score] = (breakdown[score] || 0) + 1;
  });

  const breakdownPercentages = {};
  for (let s = 1; s <= 5; s++) {
    breakdownPercentages[s] = totalReviews > 0 ? Math.round((breakdown[s] / totalReviews) * 100) : 0;
  }

  const userEligibility = await getCustomerEligibility(product.id, req.user);

  return sendSuccess(res, {
    data: {
      productId: product.id,
      productName: product.name,
      averageRating,
      totalReviews,
      breakdown,
      breakdownPercentages,
      userEligibility,
      reviews: dbReviews.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        rating: Number(r.rating),
        title: r.title,
        comment: r.comment,
        verifiedPurchase: Boolean(r.verified_purchase),
        imageUrls: Array.isArray(r.image_urls)
          ? r.image_urls
          : typeof r.image_urls === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(r.image_urls);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })()
          : [],
        createdAt: r.createdAt || r.created_at
      }))
    }
  });
}

async function createForProduct(req, res) {
  if (!req.user) {
    throw ApiError.unauthorized("Please sign in to write a review.");
  }

  const { idOrSlug } = req.params;
  const product = await resolveProduct(idOrSlug);
  if (!product) throw ApiError.notFound("Product not found");

  const { order_item_id, rating, title, comment, image_urls, customer_name } = req.body;

  let orderItemToUse = null;

  if (order_item_id) {
    orderItemToUse = await OrderItem.findOne({
      where: { id: order_item_id, product_id: product.id },
      include: [{ model: Order, as: "order", attributes: ["id", "user_id", "status", "customer_name", "email"] }]
    });

    if (!orderItemToUse || !orderItemToUse.order) {
      throw ApiError.forbidden("Invalid order item for this product.");
    }

    const orderBelongsToUser =
      orderItemToUse.order.user_id === req.user.id ||
      (req.user.email && orderItemToUse.order.email?.toLowerCase() === req.user.email.toLowerCase());

    if (!orderBelongsToUser) {
      throw ApiError.forbidden("This order does not belong to your account.");
    }

    if (orderItemToUse.order.status === "cancelled" || orderItemToUse.order.status === "returned") {
      throw ApiError.forbidden("Reviews are not available for cancelled or returned orders.");
    }

    const existingForOrderItem = await Review.findOne({ where: { order_item_id: orderItemToUse.id } });
    if (existingForOrderItem) {
      throw ApiError.conflict("You have already submitted a review for this purchase. Edit your existing review instead.");
    }
  } else {
    // Automatically verify purchase and locate eligible order item
    const eligibility = await getCustomerEligibility(product.id, req.user);

    if (eligibility.alreadyReviewed) {
      throw ApiError.conflict("You have already submitted a review for this product.");
    }
    if (!eligibility.hasPurchased || !eligibility.canReview) {
      throw ApiError.forbidden(eligibility.message || "Only customers who have purchased this product can submit a review.");
    }

    if (eligibility.orderItemId) {
      orderItemToUse = await OrderItem.findByPk(eligibility.orderItemId);
    }

    if (!orderItemToUse) {
      throw ApiError.forbidden("Only customers who have purchased this product can submit a review.");
    }
  }

  // Prevent duplicate reviews for the same product by the same user
  const duplicateReview = await Review.findOne({
    where: {
      product_id: product.id,
      [Op.or]: [
        { user_id: req.user.id },
        ...(req.user.email
          ? [{ customer_email: req.user.email }, { customer_email: req.user.email.toLowerCase() }]
          : [])
      ]
    }
  });
  if (duplicateReview) {
    throw ApiError.conflict("You have already submitted a review for this product.");
  }

  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    throw ApiError.badRequest("Rating must be an integer between 1 and 5 stars");
  }

  if (!comment || comment.trim().length < 5) {
    throw ApiError.badRequest("Review comment must be at least 5 characters");
  }

  const authorName = (
    (req.user ? req.user.name : null) ||
    customer_name ||
    req.body.authorName ||
    "Verified Patron"
  ).trim();

  const authorEmail = (req.user ? req.user.email : null) || req.body.customer_email || null;

  const newReview = await Review.create({
    product_id: product.id,
    order_item_id: orderItemToUse ? orderItemToUse.id : null,
    user_id: req.user.id,
    customer_name: authorName,
    customer_email: authorEmail ? String(authorEmail).trim() : null,
    rating: numRating,
    title: title ? title.trim() : null,
    comment: comment.trim(),
    image_urls: Array.isArray(image_urls) ? image_urls.slice(0, 4) : [],
    verified_purchase: Boolean(orderItemToUse),
    is_approved: true
  });

  await recalculateProductRating(product.id);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Thank you! Your review has been submitted successfully.",
    data: {
      id: newReview.id,
      customerName: newReview.customer_name,
      rating: Number(newReview.rating),
      title: newReview.title,
      comment: newReview.comment,
      verifiedPurchase: Boolean(newReview.verified_purchase),
      imageUrls: newReview.image_urls || [],
      isApproved: true,
      createdAt: newReview.createdAt || newReview.created_at
    }
  });
}

async function recalculateProductRating(productId) {
  const rows = await Review.findAll({ where: { product_id: productId, is_approved: true }, attributes: ["rating"] });
  const count = rows.length;
  const rating = count ? Number((rows.reduce((sum, row) => sum + Number(row.rating), 0) / count).toFixed(1)) : 0;
  await Product.update({ rating, review_count: count }, { where: { id: productId } });
}

async function updateOwnReview(req, res) {
  const product = await resolveProduct(req.params.idOrSlug);
  const review = await Review.findOne({ where: { id: req.params.reviewId, product_id: product?.id, user_id: req.user.id } });
  if (!review) throw ApiError.notFound("Review not found");
  const { rating, title, comment, image_urls } = req.body;
  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) throw ApiError.badRequest("Rating must be between 1 and 5 stars.");
  if (!comment || String(comment).trim().length < 5) throw ApiError.badRequest("Review comment must be at least 5 characters.");
  await review.update({ rating: numRating, title: title ? String(title).trim() : null, comment: String(comment).trim(), image_urls: Array.isArray(image_urls) ? image_urls.slice(0, 4) : [], is_approved: true });
  await recalculateProductRating(review.product_id);
  return sendSuccess(res, { data: review, message: "Review updated successfully." });
}

async function deleteOwnReview(req, res) {
  const review = await Review.findOne({ where: { id: req.params.reviewId, user_id: req.user.id } });
  if (!review) throw ApiError.notFound("Review not found");
  const productId = review.product_id;
  await review.destroy();
  await recalculateProductRating(productId);
  return sendSuccess(res, { message: "Review deleted." });
}

async function adminList(req, res) {
  const where = {};
  if (req.query.approved === "true") where.is_approved = true;
  if (req.query.approved === "false") where.is_approved = false;
  const rows = await Review.findAll({ where, include: [{ model: Product, as: "product", attributes: ["id", "name", "slug"] }], order: [["created_at", "DESC"]], limit: 200 });
  const formattedRows = rows.map((r) => {
    let images = [];
    if (Array.isArray(r.image_urls)) images = r.image_urls;
    else if (typeof r.image_urls === "string") {
      try {
        const parsed = JSON.parse(r.image_urls);
        if (Array.isArray(parsed)) images = parsed;
      } catch {}
    }
    const plain = r.toJSON ? r.toJSON() : { ...r };
    return { ...plain, image_urls: images };
  });
  return sendSuccess(res, { data: formattedRows });
}

async function adminUpdate(req, res) {
  const review = await Review.findByPk(req.params.reviewId);
  if (!review) throw ApiError.notFound("Review not found");
  const updates = {};
  if (req.body.rating !== undefined) {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw ApiError.badRequest("Rating must be between 1 and 5 stars.");
    updates.rating = rating;
  }
  if (req.body.title !== undefined) updates.title = req.body.title ? String(req.body.title).trim() : null;
  if (req.body.comment !== undefined) {
    if (!String(req.body.comment).trim()) throw ApiError.badRequest("Review comment is required.");
    updates.comment = String(req.body.comment).trim();
  }
  if (req.body.is_approved !== undefined) updates.is_approved = Boolean(req.body.is_approved);
  if (req.body.action === "publish") updates.is_approved = true;
  if (req.body.action === "reject") updates.is_approved = false;
  await review.update(updates);
  await recalculateProductRating(review.product_id);
  return sendSuccess(res, { data: review });
}

async function adminDelete(req, res) {
  const review = await Review.findByPk(req.params.reviewId);
  if (!review) throw ApiError.notFound("Review not found");
  const productId = review.product_id;
  await review.destroy();
  await recalculateProductRating(productId);
  return sendSuccess(res, { message: "Review deleted." });
}

module.exports = {
  listByProduct,
  checkReviewEligibility,
  createForProduct,
  updateOwnReview,
  deleteOwnReview,
  adminList,
  adminUpdate,
  adminDelete
};
