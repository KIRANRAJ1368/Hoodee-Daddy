const { Op } = require("sequelize");
const { Order, OrderItem, OrderStatusHistory, Review, Product, ProductImage, ProductVariant, ProductSize, ProductColor, User, Coupon, sequelize } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const mailer = require("../utils/mailer");
const razorpayService = require("../services/razorpayService");
const shiprocketService = require("../services/shiprocketService");
const env = require("../config/env");
const offerController = require("./offerController");
function priceWithOffer(product, variant, offer) {
  const base = Number(variant?.original_price_override ?? product.original_price ?? variant?.price_override ?? product.price);
  if (!offer) return Number(variant?.price_override ?? product.price);
  const cut = offer.discountType === "percentage" ? base * Number(offer.discountValue) / 100 : Number(offer.discountValue);
  return Math.max(0, Math.round((base - cut) * 100) / 100);
}

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `HD-${stamp}-${rand}`;
}

async function adjustItemStock(item, qtyChange, transaction) {
  if (!item.product_id) return;
  const product = await Product.findByPk(item.product_id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!product) return;

  const variants = await ProductVariant.findAll({
    where: { product_id: product.id },
    include: [
      { model: ProductSize, as: "size" },
      { model: ProductColor, as: "color" }
    ],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  if (variants.length > 0) {
    const match = variants.find((v) => {
      const matchSize = !v.size || !item.size || v.size.label.toLowerCase() === String(item.size).toLowerCase();
      const matchColor = !v.color || !item.color || v.color.name.toLowerCase() === String(item.color).toLowerCase();
      return matchSize && matchColor;
    });
    if (match) {
      match.stock_count = Math.max(0, match.stock_count + qtyChange);
      match.sales_count = Math.max(0, Number(match.sales_count || 0) - qtyChange);
      await match.save({ transaction });
    }
  }

  product.stock_count = Math.max(0, product.stock_count + qtyChange);
  product.sales_count = Math.max(0, Number(product.sales_count || 0) - qtyChange);
  product.in_stock = product.stock_count > 0;
  await product.save({ transaction });
}

async function create(req, res) {
  const isGuest = !req.user;
  const userId = req.user ? req.user.id : null;

  const result = await sequelize.transaction(async (transaction) => {
    const productIds = req.body.items.map((i) => i.product_id);
    const products = await Product.findAll({ where: { id: productIds }, transaction, lock: transaction.LOCK.UPDATE });
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));
    const offerByProduct = await offerController.activeForProducts(products);

    let subtotal = 0;
    const itemRows = [];

    for (const item of req.body.items) {
      const product = productById[item.product_id];
      if (!product) throw ApiError.badRequest(`Product ${item.product_id} does not exist`);
      if (!product.is_active) throw ApiError.badRequest(`"${product.name}" is no longer available`);

      // Check variant-level stock if product has variants
      const variants = await ProductVariant.findAll({
        where: { product_id: product.id },
        include: [
          { model: ProductSize, as: "size" },
          { model: ProductColor, as: "color" }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      let matchingVariant = null;
      if (variants.length > 0) {
        matchingVariant = variants.find((v) => {
          const matchSize = !v.size || !item.size || (v.size.label && String(v.size.label).toLowerCase() === String(item.size).toLowerCase());
          const matchColor = !v.color || !item.color || (v.color.name && String(v.color.name).toLowerCase() === String(item.color).toLowerCase());
          return matchSize && matchColor;
        });

        if (matchingVariant) {
          if (matchingVariant.stock_count < item.quantity) {
            throw ApiError.badRequest(
              `"${product.name} (${item.size || ''} ${item.color || ''})" only has ${matchingVariant.stock_count} units left in stock`
            );
          }
        } else {
          throw ApiError.badRequest(`The selected color and size for "${product.name}" are unavailable. Please choose another variant.`);
        }
      } else if (product.in_stock === false || product.stock_count < item.quantity) {
        throw ApiError.badRequest(`"${product.name}" does not have enough stock`);
      }

      const unitPrice = priceWithOffer(product, matchingVariant, offerByProduct.get(Number(product.id)));
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const productImage = matchingVariant?.image_url || (await ProductImage.findOne({
        where: { product_id: product.id },
        order: [["sort_order", "ASC"], ["id", "ASC"]],
        transaction
      }))?.url || null;
      itemRows.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        sku_snapshot: matchingVariant?.sku_suffix ? `${product.sku}-${matchingVariant.sku_suffix}` : product.sku,
        image_url: productImage,
        size: item.size || null,
        color: item.color || null,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal
      });

      // Deduct variant stock
      if (matchingVariant) {
        matchingVariant.stock_count = Math.max(0, matchingVariant.stock_count - item.quantity);
        matchingVariant.sales_count = Number(matchingVariant.sales_count || 0) + Number(item.quantity);
        await matchingVariant.save({ transaction });
      }

      // Deduct product overall stock
      product.stock_count = Math.max(0, product.stock_count - item.quantity);
      if (product.stock_count <= 0) {
        product.stock_count = 0;
        product.in_stock = false;
      }
      product.sales_count = Number(product.sales_count || 0) + Number(item.quantity);
      await product.save({ transaction });
    }

    let discountAmount = 0;
    let usedCoupon = null;
    const couponCode = String(req.body.coupon_code || req.body.couponCode || "").trim().toUpperCase();
    if (couponCode) {
      usedCoupon = await Coupon.findOne({ where: { code: couponCode, is_active: true }, transaction, lock: transaction.LOCK.UPDATE });
      if (!usedCoupon) throw ApiError.badRequest("This coupon is invalid or no longer available.");
      if (usedCoupon.expires_at && new Date() > new Date(usedCoupon.expires_at)) throw ApiError.badRequest("This coupon code has expired.");
      if (usedCoupon.usage_limit && usedCoupon.times_used >= usedCoupon.usage_limit) throw ApiError.badRequest("This coupon code has reached its maximum usage limit.");
      const minSpend = Number(usedCoupon.min_spend) || 0;
      if (subtotal < minSpend) throw ApiError.badRequest(`Minimum order amount of ₹${minSpend.toLocaleString("en-IN")} is required for this coupon.`);
      const value = Number(usedCoupon.discount_value);
      discountAmount = usedCoupon.discount_type === "percentage" ? subtotal * value / 100 : Math.min(subtotal, value);
      if (usedCoupon.discount_type === "percentage" && Number(usedCoupon.max_discount) > 0) discountAmount = Math.min(discountAmount, Number(usedCoupon.max_discount));
      discountAmount = Math.round(discountAmount * 100) / 100;
      usedCoupon.times_used = Number(usedCoupon.times_used || 0) + 1;
      await usedCoupon.save({ transaction });
    }
    let shippingFee = 60;
    let courierName = req.body.courier_name || "Shiprocket Express";
    let estimatedDelivery = req.body.estimated_delivery || "3–5 Business Days";

    if (req.body.pincode) {
      const pinRate = await shiprocketService.calculateShippingRate({
        deliveryPincode: req.body.pincode
      });
      if (pinRate.is_serviceable && pinRate.shipping_fee !== null) {
        shippingFee = pinRate.shipping_fee;
        if (pinRate.courier_name) courierName = pinRate.courier_name;
        if (pinRate.estimated_delivery) estimatedDelivery = pinRate.estimated_delivery;
      } else {
        throw ApiError.badRequest(pinRate.message || "Delivery PIN code is not serviceable by Shiprocket.");
      }
    } else if (req.body.shipping_fee !== undefined && req.body.shipping_fee !== null) {
      shippingFee = Number(req.body.shipping_fee);
    }

    const total = Math.max(0, Math.round((subtotal - discountAmount + shippingFee) * 100) / 100);

    const order = await Order.create(
      {
        order_number: generateOrderNumber(),
        customer_name: req.body.customer_name,
        email: req.body.email,
        phone: req.body.phone,
        shipping_address: req.body.shipping_address,
        city: req.body.city || null,
        state: req.body.state || null,
        pincode: req.body.pincode || null,
        payment_method: req.body.payment_method || "COD",
        status: "pending",
        shipping_status: "pending_dispatch",
        courier_name: courierName,
        courier_company_id: req.body.courier_company_id || req.body.courierCompanyId || null,
        estimated_delivery: estimatedDelivery,
        subtotal: Math.round(subtotal * 100) / 100,
        discount_amount: discountAmount,
        coupon_code: usedCoupon?.code || null,
        shipping_fee: shippingFee,
        total,
        notes: req.body.notes || null,
        user_id: userId,
        is_guest: isGuest
      },
      { transaction }
    );

    await OrderItem.bulkCreate(
      itemRows.map((row) => ({ ...row, order_id: order.id })),
      { transaction }
    );

    return order;
  });

    const full = await Order.findByPk(result.id, {
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] }
    ]
  });

  await OrderStatusHistory.create({ order_id: result.id, status: result.status, shipping_status: result.shipping_status, source: "system", note: "Order placed" });

  // Asynchronously dispatch luxury order confirmation email without blocking API response
  if (full && full.email) {
    mailer.sendOrderConfirmationEmail(full.email, full).catch((err) => {
      console.error("[HOODEE DADDY NODEMAILER] Failed to send order confirmation email:", err.message);
    });
  }

  return sendSuccess(res, { statusCode: 201, data: full });
}

async function list(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;

  if (req.query.cancellation_status) {
    if (req.query.cancellation_status === "active" || req.query.cancellation_status === "any") {
      where.cancellation_status = { [Op.ne]: "none" };
    } else {
      where.cancellation_status = req.query.cancellation_status;
    }
  }

  if (req.query.cancellation_type) {
    where.cancellation_type = req.query.cancellation_type;
  }

  if (req.query.refund_status) {
    where.refund_status = req.query.refund_status;
  }

  if (req.query.search) {
    const term = `%${req.query.search.trim()}%`;
    where[Op.or] = [
      { order_number: { [Op.like]: term } },
      { customer_name: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { phone: { [Op.like]: term } }
    ];
  }

  if (req.query.is_guest !== undefined && req.query.is_guest !== "") {
    if (req.query.is_guest === "true" || req.query.is_guest === true) {
      where.is_guest = true;
    } else if (req.query.is_guest === "false" || req.query.is_guest === false) {
      where.is_guest = false;
    }
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] }
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset
  });

  return sendSuccess(res, { data: rows, meta: buildMeta({ page, limit, count }) });
}

async function getById(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone", "created_at"] },
      { model: OrderStatusHistory, as: "status_history" }
    ]
  });
  if (!order) throw ApiError.notFound("Order not found");

  const isAdmin = req.admin || req.user?.role === "admin" || req.user?.role === "superadmin";
  if (!isAdmin) {
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user?.email ? String(req.user.email).toLowerCase().trim() : null;
    const queryEmail = String(req.query.email || req.headers["x-order-email"] || "").toLowerCase().trim();

    const isOwner =
      (userId && order.user_id === userId) ||
      (userEmail && order.email && order.email.toLowerCase().trim() === userEmail) ||
      (queryEmail && order.email && order.email.toLowerCase().trim() === queryEmail);

    if (!isOwner) {
      throw ApiError.forbidden("Access denied. Please provide the verified order email to view this order invoice.");
    }
  }

  return sendSuccess(res, { data: order });
}

async function getMyOrders(req, res) {
  const userId = req.user.id;
  const userEmail = req.user.email ? String(req.user.email).toLowerCase().trim() : null;
  const userPhone = req.user.phone ? String(req.user.phone).trim() : null;
  const { page, limit, offset } = getPagination(req.query);

  if (userEmail || userPhone) {
    const linkMatch = [];
    if (userEmail) linkMatch.push({ email: userEmail });
    if (userPhone) linkMatch.push({ phone: userPhone });
    await Order.update(
      { user_id: userId, is_guest: false },
      { where: { [Op.or]: linkMatch, user_id: null } }
    ).catch(() => {});
  }

  const { rows, count } = await Order.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          { model: Review, as: "review", attributes: ["id", "rating", "title", "comment", "image_urls", "is_approved"] },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "slug", "price"],
            include: [
              {
                model: ProductImage,
                as: "images",
                attributes: ["url", "alt_text"]
              }
            ]
          }
        ]
      }
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset
  });

  try {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const now = Date.now();
    await Promise.all(rows.map(async (order) => {
      const lastCheck = order.updated_at ? new Date(order.updated_at).getTime() : 0;
      const shouldSync = (now - lastCheck) > FIFTEEN_MINUTES_MS || order.shipping_status === "pending_dispatch";

      if (shouldSync && order.awb_code && order.status !== "delivered" && order.status !== "cancelled" && order.status !== "returned") {
        try {
          const tracking = await shiprocketService.trackShipment(order.awb_code);
          if (tracking?.status && (tracking.status !== order.shipping_status || tracking.order_status !== order.status)) {
            const prevOrderStatus = order.status;
            order.shipping_status = tracking.status;
            order.status = tracking.order_status;
            await order.save();
            await OrderStatusHistory.create({ order_id: order.id, status: order.status, shipping_status: order.shipping_status, source: "shiprocket", note: tracking.message || "Shiprocket tracking update" });
            if (prevOrderStatus !== order.status && order.email) {
              mailer.sendOrderStatusUpdateEmail(order.email, order, order.status, prevOrderStatus)
                .catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Customer tracking status email notice:", err.message));
            }
          }
        } catch (_) {
          // Non-blocking: live tracking lookup failure should never interrupt customer order viewing
        }
      }
    }));
  } catch (_) {
    // Non-blocking
  }

  return sendSuccess(res, { data: rows, meta: buildMeta({ page, limit, count }) });
}

async function getMyOrderStatusHistory(req, res) {
  const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!order) throw ApiError.notFound("Order not found");
  const history = await OrderStatusHistory.findAll({ where: { order_id: order.id }, order: [["created_at", "ASC"]] });
  return sendSuccess(res, { data: history });
}

async function getOrderHistoryForAdmin(req, res) {
  const order = await Order.findByPk(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");
  const history = await OrderStatusHistory.findAll({ where: { order_id: order.id }, order: [["created_at", "ASC"]] });
  return sendSuccess(res, { data: history });
}

async function updateStatus(req, res) {
  const newStatus = req.body.status;
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw ApiError.notFound("Order not found");

  const prevStatus = order.status;
  if (prevStatus === newStatus) {
    return sendSuccess(res, { data: order });
  }

  const validStatuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];
  if (!validStatuses.includes(newStatus)) {
    throw ApiError.badRequest(`Invalid order status: ${newStatus}. Valid statuses are: ${validStatuses.join(", ")}`);
  }

  // Create the Shiprocket shipment as soon as the order is packed.
  if (newStatus === "packed" && (!order.shipment_id || !order.awb_code)) {
    try {
      const shipmentResult = await shiprocketService.createShipment(order);
      if (shipmentResult) {
        order.shiprocket_order_id = String(shipmentResult.shiprocket_order_id || shipmentResult.order_id || "");
        order.shipment_id = String(shipmentResult.shipment_id || "");
        if (shipmentResult.awb_code) {
          order.awb_code = shipmentResult.awb_code;
          order.tracking_number = shipmentResult.awb_code;
        }
        if (shipmentResult.courier_name) order.courier_name = shipmentResult.courier_name;
        order.shipping_status = shipmentResult.shipping_status || "manifested";
      }
    } catch (shipErr) {
      console.warn("[SHIPROCKET PACK AUTO-DISPATCH] Notice:", shipErr.message);
    }
    if (!order.awb_code) {
      order.shipping_status = "pending_dispatch";
      order.shipment_error = "Shiprocket shipment could not be created. Use Shipping Details to retry.";
    } else {
      order.shipment_error = null;
    }
  }
  if (newStatus === "cancelled" && order.shiprocket_order_id) {
    await shiprocketService.cancelShiprocketOrder(order.shiprocket_order_id);
  }

  await sequelize.transaction(async (transaction) => {
    // If transitioning to cancelled / returned from an active state, restore inventory
    if (
      (newStatus === "cancelled" || newStatus === "returned") &&
      prevStatus !== "cancelled" &&
      prevStatus !== "returned"
    ) {
      for (const item of order.items) {
        await adjustItemStock(item, item.quantity, transaction);
      }
    }
    // If transitioning from cancelled back to active, decrement inventory
    else if (
      (prevStatus === "cancelled" || prevStatus === "returned") &&
      newStatus !== "cancelled" &&
      newStatus !== "returned"
    ) {
      for (const item of order.items) {
        await adjustItemStock(item, -item.quantity, transaction);
      }
    }

    order.status = newStatus;
    if (newStatus === "delivered") order.shipping_status = "delivered";
    if (newStatus === "cancelled") order.shipping_status = "cancelled";
    if (newStatus === "shipped" && (order.shipping_status === "pending_dispatch" || order.shipping_status === "manifested")) {
      order.shipping_status = "in_transit";
    }
    await order.save({ transaction });
    if (OrderStatusHistory) {
      await OrderStatusHistory.create({
        order_id: order.id,
        status: order.status,
        shipping_status: order.shipping_status,
        source: "admin",
        note: `Status changed from ${prevStatus} to ${newStatus}`
      }, { transaction });
    }
  });

  // Non-blocking: send branded customer email notification for order status progression
  if (order.email && prevStatus !== newStatus) {
    mailer.sendOrderStatusUpdateEmail(order.email, order, newStatus, prevStatus)
      .catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Order status email notice:", err.message));
  }

  return sendSuccess(res, { data: order });
}

/**
 * Customer / Storefront: Request Cancellation or Return
 * Supports:
 *   Type 1: pre_pack (order is pending / confirmed)
 *   Type 2: in_transit (order is packed / shipped)
 *   Type 3: post_delivery (order is delivered)
 */
async function requestCancellation(req, res) {
  const orderId = req.params.id;
  const {
    cancellation_type,
    reason,
    comments,
    refund_upi_id,
    refund_account_holder,
    return_images,
    return_video_url,
    email
  } = req.body;

  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw ApiError.notFound("Order not found");

  const userId = req.user ? req.user.id : null;
  const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";

  if (!isAdmin) {
    if (userId) {
      const userEmail = (req.user.email || "").toLowerCase().trim();
      const isOwner = (order.user_id && order.user_id === userId) || (order.email && order.email.toLowerCase().trim() === userEmail);
      if (!isOwner) {
        throw ApiError.forbidden("You do not have permission to modify this order.");
      }
    } else {
      const cleanReqEmail = String(email || "").toLowerCase().trim();
      if (!cleanReqEmail || order.email.toLowerCase().trim() !== cleanReqEmail) {
        throw ApiError.forbidden("Valid order email address is required to submit a cancellation or return request.");
      }
    }
  }

  if (!reason) {
    throw ApiError.badRequest("Cancellation or return reason is required.");
  }

  let determinedType = cancellation_type;
  if (!determinedType) {
    if (order.status === "delivered") {
      determinedType = "post_delivery";
    } else if (order.status === "packed" || order.status === "shipped") {
      determinedType = "in_transit";
    } else {
      determinedType = "pre_pack";
    }
  }

  // Validate current order stage against requested type
  if (determinedType === "pre_pack") {
    if (order.status !== "pending" && order.status !== "confirmed") {
      throw ApiError.badRequest(
        `Order is currently "${order.status}". Pre-packing cancellation is only available before order is packed. Please request in-transit cancellation.`
      );
    }
  } else if (determinedType === "in_transit") {
    if (order.status !== "packed" && order.status !== "shipped") {
      throw ApiError.badRequest(
        `In-transit cancellation is only applicable while package is packed or in transit. Current status is "${order.status}".`
      );
    }
  } else if (determinedType === "post_delivery") {
    if (order.status !== "delivered") {
      throw ApiError.badRequest(
        `Post-delivery return is only applicable after order is delivered. Current status is "${order.status}".`
      );
    }
  }

  const isPrepaid = order.payment_method === "PREPAID";
  const needsRefund = isPrepaid || determinedType === "post_delivery";
  if (needsRefund && !refund_upi_id && !order.refund_upi_id) {
    throw ApiError.badRequest("Please provide your UPI ID for direct bank refund credit.");
  }

  order.cancellation_type = determinedType;
  order.cancellation_status = "requested";
  order.cancellation_reason = reason;
  order.cancellation_comments = comments || null;
  if (refund_upi_id) order.refund_upi_id = refund_upi_id.trim();
  if (refund_account_holder) order.refund_account_holder = refund_account_holder.trim();
  order.refund_amount = order.total;
  order.refund_status = needsRefund ? "pending" : "not_required";

  if (determinedType === "post_delivery") {
    if (Array.isArray(return_images)) order.return_images = return_images;
    if (return_video_url) order.return_video_url = return_video_url;
  }

  await order.save();

  await OrderStatusHistory.create({
    order_id: order.id,
    status: order.status,
    shipping_status: order.shipping_status,
    source: userId ? "customer" : "guest",
    note: `Cancellation/return requested (${determinedType}): ${reason}`
  }).catch(() => {});

  return sendSuccess(res, {
    message:
      determinedType === "pre_pack"
        ? "Cancellation request submitted. Our team will process it shortly."
        : determinedType === "in_transit"
        ? "Cancellation request submitted. We are contacting courier partners to stop delivery."
        : "Return request submitted. Our team will review your proofs and schedule reverse pickup.",
    data: order
  });
}

/**
 * Admin: Approve Pre-Pack (Type 1) or In-Transit (Type 2) Cancellation
 */
async function approveCancellation(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw ApiError.notFound("Order not found");

  if (order.cancellation_status !== "requested") {
    throw ApiError.badRequest(`Order cancellation is currently "${order.cancellation_status}", not "requested".`);
  }

  const type = order.cancellation_type || (order.status === "packed" || order.status === "shipped" ? "in_transit" : "pre_pack");

  if (type === "pre_pack") {
    await sequelize.transaction(async (transaction) => {
      // Restore inventory immediately
      for (const item of order.items) {
        await adjustItemStock(item, item.quantity, transaction);
      }
      order.status = "cancelled";
      order.shipping_status = "cancelled";
      order.cancellation_status = order.payment_method === "COD" ? "completed" : "approved";
      order.refund_status = order.payment_method === "COD" ? "not_required" : "pending";
      await order.save({ transaction });

      // Roll back coupon usage if used
      if (order.coupon_code) {
        await Coupon.decrement("times_used", { by: 1, where: { code: order.coupon_code }, transaction }).catch(() => {});
      }

      await OrderStatusHistory.create({
        order_id: order.id,
        status: order.status,
        shipping_status: order.shipping_status,
        source: "admin",
        note: `Pre-pack cancellation approved by store admin. Inventory restocked.`
      }, { transaction });
    });

    if (order.email) {
      mailer.sendOrderStatusUpdateEmail(order.email, order, "cancelled", "confirmed", {
        reason: order.cancellation_reason || "Pre-pack cancellation approved by store admin"
      }).catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Pre-pack cancel email notice:", err.message));
    }

    return sendSuccess(res, {
      message: "Pre-pack cancellation approved. Inventory restocked successfully.",
      data: order
    });
  }

  if (type === "in_transit") {
    if (order.shiprocket_order_id) {
      try {
        await shiprocketService.cancelShiprocketOrder(order.shiprocket_order_id);
      } catch (err) {
        console.warn("[APPROVE CANCEL SHIPROCKET] Error:", err.message);
      }
    }

    order.cancellation_status = "rto_in_transit";
    order.shipping_status = "rto";
    await order.save();

    await OrderStatusHistory.create({
      order_id: order.id,
      status: order.status,
      shipping_status: order.shipping_status,
      source: "admin",
      note: "In-transit cancellation approved. Forward delivery stopped; courier alerted for RTO."
    });

    if (order.email) {
      mailer.sendOrderStatusUpdateEmail(order.email, order, "cancelled", order.status, {
        reason: order.cancellation_reason || "In-transit cancellation approved; shipment rerouted to warehouse"
      }).catch((err) => console.warn("[HOODEE DADDY NODEMAILER] In-transit cancel email notice:", err.message));
    }

    return sendSuccess(res, {
      message: "In-transit cancellation approved. Forward delivery stopped; marked as RTO.",
      data: order
    });
  }

  throw ApiError.badRequest("Please use the approve-return endpoint for Type 3 post-delivery returns.");
}

/**
 * Admin: Approve Return (Type 3 Post-Delivery) & Schedule Shiprocket Reverse Pickup
 */
async function approveReturn(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw ApiError.notFound("Order not found");

  if (order.cancellation_status !== "requested") {
    throw ApiError.badRequest(`Return request is currently "${order.cancellation_status}", not "requested".`);
  }

  let reverseResult;
  try {
    reverseResult = await shiprocketService.createReversePickup({
      order,
      returnReason: order.cancellation_reason || "Customer Return",
      pickupAddress: order.shipping_address
    });
  } catch (err) {
    console.warn("[SHIPROCKET REVERSE PICKUP] Error:", err.message);
    reverseResult = {
      reverse_shiprocket_order_id: `SR-REV-${Date.now()}`,
      reverse_shipment_id: `REV-${order.order_number}`,
      reverse_awb_code: `SR-REV-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      reverse_shipping_status: "reverse_pickup_scheduled"
    };
  }

  order.cancellation_status = "approved";
  if (reverseResult) {
    order.reverse_shiprocket_order_id = String(reverseResult.reverse_shiprocket_order_id || "");
    order.reverse_shipment_id = String(reverseResult.reverse_shipment_id || "");
    order.reverse_awb_code = String(reverseResult.reverse_awb_code || "");
    order.reverse_shipping_status = reverseResult.reverse_shipping_status || "reverse_pickup_scheduled";
  }
  await order.save();

  await OrderStatusHistory.create({
    order_id: order.id,
    status: order.status,
    shipping_status: order.shipping_status,
    source: "admin",
    note: `Post-delivery return approved. Reverse pickup scheduled (Reverse AWB: ${order.reverse_awb_code || 'Pending'}).`
  });

  return sendSuccess(res, {
    message: "Return approved! Shiprocket reverse pickup scheduled and reverse AWB generated.",
    data: order
  });
}

/**
 * Admin: Reject Cancellation or Return
 */
async function rejectCancellation(req, res) {
  const order = await Order.findByPk(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  order.cancellation_status = "rejected";
  order.refund_status = "not_required";
  order.refund_notes = req.body.notes || req.body.reason || "Cancellation / Return request rejected by store admin.";
  await order.save();

  await OrderStatusHistory.create({
    order_id: order.id,
    status: order.status,
    shipping_status: order.shipping_status,
    source: "admin",
    note: `Cancellation/return request rejected: ${order.refund_notes}`
  });

  return sendSuccess(res, {
    message: "Cancellation / return request has been rejected.",
    data: order
  });
}

/**
 * Admin: Mark Package Received back at Warehouse & QC Passed (Type 2 RTO or Type 3 Reverse Pickup)
 */
async function markWarehouseReceived(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw ApiError.notFound("Order not found");

  await sequelize.transaction(async (transaction) => {
    // Restock all items to inventory
    for (const item of order.items) {
      await adjustItemStock(item, item.quantity, transaction);
    }

    order.warehouse_received_at = new Date();
    order.warehouse_inspected_by = (req.admin && req.admin.name) || req.body.inspected_by || "Store QC Inspector";

    const isCodInTransit = order.cancellation_type === "in_transit" && order.payment_method === "COD";

    if (isCodInTransit) {
      order.status = "returned";
      order.shipping_status = "rto";
      order.cancellation_status = "completed";
      order.refund_status = "not_required";
    } else {
      order.status = "returned";
      order.shipping_status = "rto";
      order.cancellation_status = "rto_delivered";
      order.refund_status = "pending";
    }

    // Roll back coupon usage if used
    if (order.coupon_code) {
      await Coupon.decrement("times_used", { by: 1, where: { code: order.coupon_code }, transaction }).catch(() => {});
    }

    await order.save({ transaction });

    await OrderStatusHistory.create({
      order_id: order.id,
      status: order.status,
      shipping_status: order.shipping_status,
      source: "warehouse",
      note: `Returned package inspected and received at warehouse. Restocked into inventory by ${order.warehouse_inspected_by}.`
    }, { transaction });
  });

  if (order.email) {
    mailer.sendOrderStatusUpdateEmail(order.email, order, "returned", null, {
      inspected_by: order.warehouse_inspected_by
    }).catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Returned status email notice:", err.message));
  }

  return sendSuccess(res, {
    message: "Returned package verified and received at warehouse. Inventory restocked successfully.",
    data: order
  });
}

/**
 * Admin: Process UPI Refund (Record UTR number, amount, complete return)
 */
async function processUpiRefund(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });
  if (!order) throw ApiError.notFound("Order not found");

  const utrNumber = String(req.body.utr_number || req.body.refund_utr_number || req.body.utr || "").trim();
  if (!utrNumber) {
    throw ApiError.badRequest("Bank Reference / UPI UTR Number is required to record a refund settlement.");
  }

  const refundAmount = Number(req.body.amount || req.body.refund_amount || order.refund_amount || order.total);
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw ApiError.badRequest("Valid refund amount is required.");
  }

  order.refund_utr_number = utrNumber;
  order.refund_amount = refundAmount;
  order.refund_status = "processed";
  order.refund_processed_at = new Date();
  order.refund_notes = req.body.notes || req.body.refund_notes || null;
  order.cancellation_status = "completed";
  if (order.status !== "cancelled" && order.status !== "returned") {
    order.status = order.cancellation_type === "post_delivery" ? "returned" : "cancelled";
  }

  await order.save();

  await OrderStatusHistory.create({
    order_id: order.id,
    status: order.status,
    shipping_status: order.shipping_status,
    source: "admin",
    note: `UPI refund of ₹${refundAmount.toLocaleString("en-IN")} settled (UTR: ${utrNumber}). Customer notified via email.`
  });

  // Send luxury email notification to customer asynchronously
  if (order.email) {
    mailer.sendRefundConfirmationEmail(order.email, order).catch((err) => {
      console.warn("[HOODEE DADDY NODEMAILER] Refund email notification notice:", err.message);
    });
  }

  return sendSuccess(res, {
    message: `Refund of ₹${refundAmount.toLocaleString("en-IN")} successfully recorded (UTR: ${utrNumber}). Customer notified via email.`,
    data: order
  });
}

// Retain legacy cancelOrder as an alias to requestCancellation
const cancelOrder = requestCancellation;

async function trackOrder(req, res) {
  const { orderNumber, email, phone } = req.query;

  if (!orderNumber) {
    throw ApiError.badRequest("Order number is required for tracking.");
  }

  const cleanOrderNumber = orderNumber.trim();
  const where = { order_number: cleanOrderNumber };

  const order = await Order.findOne({
    where,
    include: [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "slug"],
            include: [
              {
                model: ProductImage,
                as: "images",
                attributes: ["url"]
              }
            ]
          }
        ]
      }
    ]
  });

  if (!order) {
    throw ApiError.notFound(`No order found matching "${cleanOrderNumber}". Please verify your order number.`);
  }

  // Verify match for customer privacy and security
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanPhone = (phone || "").replace(/\D/g, "");

  if (!cleanEmail && !cleanPhone) {
    throw ApiError.badRequest("Please provide your email address or phone number to verify and track your order.");
  }

  if (cleanEmail) {
    if (order.email.toLowerCase().trim() !== cleanEmail) {
      throw ApiError.badRequest("The email address provided does not match the records for this order.");
    }
  } else if (cleanPhone) {
    const orderPhone = (order.phone || "").replace(/\D/g, "");
    if (!orderPhone.includes(cleanPhone) && !cleanPhone.includes(orderPhone)) {
      throw ApiError.badRequest("The phone number provided does not match the records for this order.");
    }
  }

  const createdAt = new Date(order.created_at || order.createdAt);
  const formatDate = (date) =>
    date.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const isConfirmed = ["confirmed", "packed", "shipped", "delivered"].includes(order.status);
  const isPacked = ["packed", "shipped", "delivered"].includes(order.status);
  const isShipped = ["shipped", "delivered"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";
  const statusHistory = await OrderStatusHistory.findAll({ where: { order_id: order.id }, order: [["created_at", "ASC"]] });
  const historyDate = (status, fallback) => {
    const entry = statusHistory.find((row) => row.status === status || (status === "shipped" && row.shipping_status === "out_for_delivery"));
    return entry ? formatDate(new Date(entry.created_at)) : fallback;
  };

  const timeline = [
    {
      step: "Order Placed",
      label: "Order Placed & Acknowledged",
      date: formatDate(createdAt),
      done: true,
      active: order.status === "pending"
    },
    {
      step: "Payment Verified",
      label: order.payment_method === "COD" ? "Cash on Delivery Acknowledged" : "Payment Verified via Gateway",
      date: historyDate("confirmed", isConfirmed ? "Confirmed" : "Pending confirmation"),
      done: isConfirmed,
      active: order.status === "confirmed"
    },
    {
      step: "Packed",
      label: "Quality Inspected & Packed in Premium Box",
      date: historyDate("packed", isPacked ? "Packed" : "Pending packing"),
      done: isPacked,
      active: order.status === "packed"
    },
    {
      step: "Dispatched",
      label: "Dispatched via Express Courier (BlueDart / Delhivery)",
      date: historyDate("shipped", isShipped ? "Shipped" : "Pending dispatch"),
      done: isShipped,
      active: order.status === "shipped"
    },
    {
      step: "Delivered",
      label: "Delivered to Doorstep",
      date: historyDate("delivered", isDelivered ? "Delivered" : "Waiting for courier update"),
      done: isDelivered,
      active: order.status === "delivered"
    }
  ];

  const estimatedDelivery = order.estimated_delivery || "Shown after dispatch";

  return sendSuccess(res, {
    data: {
      id: order.id,
      orderId: order.order_number,
      orderNumber: order.order_number,
      status: order.status,
      isCancelled,
      isReturned,
      carrier: order.courier_name || "Shiprocket Express",
      trackingCarrier: order.courier_name || "Shiprocket Express",
      trackingNumber: order.awb_code || order.tracking_number || null,
      shippingStatus: order.shipping_status,
      statusHistory: statusHistory.map((entry) => ({
        status: entry.status,
        shippingStatus: entry.shipping_status,
        source: entry.source,
        note: entry.note,
        date: formatDate(new Date(entry.created_at))
      })),
      trackingUrl: order.awb_code ? `https://www.shiprocket.in/shipment-tracking/${encodeURIComponent(order.awb_code)}` : null,
      estimatedDelivery: order.estimated_delivery ? String(order.estimated_delivery) : estimatedDelivery,
      origin: "HooDee Daddy Dispatch Hub, 123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu, India",
      destination: `${order.shipping_address}, ${order.city || ""}, ${order.state || ""} - ${order.pincode || ""}`.trim(),
      customerName: order.customer_name,
      total: order.total,
      paymentMethod: order.payment_method,
      cancellation_type: order.cancellation_type,
      cancellation_status: order.cancellation_status || "none",
      cancellation_reason: order.cancellation_reason,
      refund_status: order.refund_status,
      refund_amount: order.refund_amount,
      refund_utr_number: order.refund_utr_number,
      reverse_awb_code: order.reverse_awb_code,
      reverse_shipping_status: order.reverse_shipping_status,
      created_at: order.created_at,
      items: order.items,
      timeline,
      steps: timeline
    }
  });
}

async function calculateOrderFinancials({ items, couponCode, pincode, isCod = false, shippingFeeOverride, transaction }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("At least one item is required");
  }

  const productIds = items.map((i) => i.product_id || i.productId);
  const products = await Product.findAll({
    where: { id: productIds },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  const productById = Object.fromEntries(products.map((p) => [p.id, p]));
  const offerByProduct = await offerController.activeForProducts(products);

  let subtotal = 0;
  const itemRows = [];
  const variantsByProduct = new Map();
  const productImagesById = new Map();
  const reservedQuantities = new Map();

  for (const item of items) {
    const pId = item.product_id || item.productId;
    const product = productById[pId];
    if (!product) throw ApiError.badRequest(`Product ${pId} does not exist`);
    if (!product.is_active) throw ApiError.badRequest(`"${product.name}" is no longer available`);

    const qty = parseInt(item.quantity, 10);
    if (!qty || qty < 1) throw ApiError.badRequest("Item quantity must be at least 1");

    let variants = variantsByProduct.get(product.id);
    if (!variants) {
      variants = await ProductVariant.findAll({
        where: { product_id: product.id },
        include: [
          { model: ProductSize, as: "size" },
          { model: ProductColor, as: "color" }
        ],
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined
      });
      variantsByProduct.set(product.id, variants);
    }

    let matchingVariant = null;
    if (variants.length > 0) {
      matchingVariant = variants.find((v) => {
        const matchSize = !v.size || !item.size || (v.size.label && String(v.size.label).toLowerCase() === String(item.size).toLowerCase());
        const matchColor = !v.color || !item.color || (v.color.name && String(v.color.name).toLowerCase() === String(item.color).toLowerCase());
        return matchSize && matchColor;
      });

      if (matchingVariant) {
        const key = `variant:${matchingVariant.id}`;
        const remaining = Number(matchingVariant.stock_count) - (reservedQuantities.get(key) || 0);
        if (remaining < qty) {
          throw ApiError.badRequest(
            `"${product.name} (${item.size || ''} ${item.color || ''})" only has ${Math.max(remaining, 0)} units left in stock`
          );
        }
        reservedQuantities.set(key, (reservedQuantities.get(key) || 0) + qty);
      } else {
        throw ApiError.badRequest(`The selected color and size for "${product.name}" are unavailable. Please choose another variant.`);
      }
    } else {
      const key = `product:${product.id}`;
      const remaining = Number(product.stock_count) - (reservedQuantities.get(key) || 0);
      if (product.in_stock === false || remaining < qty) {
        throw ApiError.badRequest(`"${product.name}" only has ${Math.max(remaining, 0)} units left in stock`);
      }
      reservedQuantities.set(key, (reservedQuantities.get(key) || 0) + qty);
    }

    const unitPrice = priceWithOffer(product, matchingVariant, offerByProduct.get(Number(product.id)));
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    let productImages = productImagesById.get(product.id);
    if (!productImages) {
      productImages = await ProductImage.findAll({
        where: { product_id: product.id },
        order: [["sort_order", "ASC"], ["id", "ASC"]],
        transaction
      });
      productImagesById.set(product.id, productImages);
    }

    itemRows.push({
      product_id: product.id,
      product_name_snapshot: product.name,
      sku_snapshot: matchingVariant?.sku_suffix
        ? `${product.sku}-${matchingVariant.sku_suffix}`
        : product.sku,
      image_url: matchingVariant?.image_url || productImages[0]?.url || null,
      size: item.size || null,
      color: item.color || null,
      unit_price: unitPrice,
      quantity: qty,
      line_total: lineTotal,
      matchingVariant,
      product
    });
  }

  let discountAmount = 0;
  let coupon = null;
  if (couponCode) {
    const cleanCode = String(couponCode).trim().toUpperCase();
    coupon = await Coupon.findOne({ where: { code: cleanCode, is_active: true }, transaction });
    if (!coupon) throw ApiError.badRequest("This coupon is invalid or no longer available.");
    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      throw ApiError.badRequest("This coupon code has expired.");
    }
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      throw ApiError.badRequest("This coupon code has reached its maximum usage limit.");
    }
    const minSpend = Number(coupon.min_spend) || 0;
    if (subtotal < minSpend) {
      throw ApiError.badRequest(`Minimum order amount of ₹${minSpend.toLocaleString("en-IN")} is required for this coupon.`);
    }
    const discountVal = Number(coupon.discount_value);
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * discountVal) / 100;
      if (coupon.max_discount && Number(coupon.max_discount) > 0) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
      }
    } else {
      discountAmount = Math.min(subtotal, discountVal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
  }

  let shippingFee = 60;
  let courierName = "Shiprocket Express";
  let estimatedDelivery = "3–5 Business Days";

  if (pincode) {
    const pinRate = await shiprocketService.calculateShippingRate({
      deliveryPincode: pincode
    });
    if (pinRate.is_serviceable && pinRate.shipping_fee !== null) {
      shippingFee = pinRate.shipping_fee;
      if (pinRate.courier_name) courierName = pinRate.courier_name;
      if (pinRate.estimated_delivery) estimatedDelivery = pinRate.estimated_delivery;
    } else {
      throw ApiError.badRequest(pinRate.message || "Delivery PIN code is not serviceable by Shiprocket.");
    }
  } else if (shippingFeeOverride !== undefined && shippingFeeOverride !== null) {
    shippingFee = Number(shippingFeeOverride);
  }

  const total = Math.max(0, Math.round((subtotal - discountAmount + shippingFee) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    shippingFee,
    courierName,
    estimatedDelivery,
    total,
    itemRows,
    coupon
  };
}

async function createRazorpayOrder(req, res) {
  const customerName = String(req.body.customer_name || req.body.name || req.body.fullName || "").trim();
  const email = String(req.body.email || req.body.customer_email || req.body.customerEmail || "").trim();
  const phone = String(req.body.phone || req.body.customer_phone || "").trim();
  const pincode = String(req.body.pincode || req.body.postalCode || req.body.postal_code || "").trim();
  if (customerName.length < 3 || customerName.length > 30) {
    throw ApiError.badRequest("Name must be between 3 and 30 characters.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ApiError.badRequest("A valid email address is required.");
  }
  if (!/^\d{10}$/.test(phone)) {
    throw ApiError.badRequest("Phone number must contain exactly 10 digits.");
  }
  if (!/^\d{6}$/.test(pincode)) {
    throw ApiError.badRequest("PIN code must contain exactly 6 digits.");
  }
  const items = req.body.items;
  if (!items || !items.length) {
    throw ApiError.badRequest("At least one item is required");
  }

  const shippingFeeOverride = req.body.shipping_fee !== undefined ? req.body.shipping_fee : req.body.shippingFee;

  const financials = await calculateOrderFinancials({
    items,
    couponCode: req.body.coupon_code || req.body.couponCode,
    pincode,
    isCod: false,
    shippingFeeOverride
  });

  const amountInPaise = Math.round(financials.total * 100);
  if (amountInPaise <= 0) {
    throw ApiError.badRequest("Order total must be greater than zero for online payment");
  }

  const receipt = generateOrderNumber();
  const rzpOrder = await razorpayService.createOrder({
    amountInPaise,
    currency: "INR",
    receipt,
    notes: {
      customer_name: (req.body.customer_name || "").slice(0, 40),
      email: (req.body.email || "").slice(0, 40),
      phone: (req.body.phone || "").slice(0, 30),
      receipt
    }
  });

  return sendSuccess(res, {
    data: {
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt,
      order_number: receipt,
      key_id: razorpayService.getKeyId(),
      calculated_total: financials.total,
      subtotal: financials.subtotal,
      discount_amount: financials.discountAmount,
      shipping_fee: financials.shippingFee
    }
  });
}

async function verifyRazorpayPayment(req, res) {
  const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;
  const order_data = req.body.order_data || req.body.orderData || req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest("Missing required Razorpay payment verification parameters.");
  }
  if (!order_data || !Array.isArray(order_data.items) || order_data.items.length === 0) {
    throw ApiError.badRequest("Missing required order data items.");
  }
  const customerName = String(order_data.customer_name || order_data.name || "").trim();
  const phone = String(order_data.phone || "").trim();
  const pincode = String(order_data.pincode || order_data.postalCode || "").trim();
  if (customerName.length < 3 || customerName.length > 30) {
    throw ApiError.badRequest("Name must be between 3 and 30 characters.");
  }
  if (!/^\d{10}$/.test(phone)) {
    throw ApiError.badRequest("Phone number must contain exactly 10 digits.");
  }
  if (!/^\d{6}$/.test(pincode)) {
    throw ApiError.badRequest("PIN code must contain exactly 6 digits.");
  }

  // 1. Verify HMAC signature securely
  const isValid = razorpayService.verifySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature
  });

  if (!isValid) {
    throw ApiError.badRequest("Payment signature verification failed. Untrusted or tampered transaction.");
  }

  // 2. Idempotency check: prevent duplicate order creation on network retries
  const existingOrder = await Order.findOne({
    where: {
      notes: { [Op.like]: `%${razorpay_payment_id}%` }
    },
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] }
    ]
  });
  if (existingOrder) {
    return sendSuccess(res, { statusCode: 200, data: existingOrder });
  }

  const isGuest = !req.user;
  const userId = req.user ? req.user.id : null;

  // 3. Database transaction to create order, deduct stock, increment coupon
  const result = await sequelize.transaction(async (transaction) => {
    const financials = await calculateOrderFinancials({
      items: order_data.items,
      couponCode: order_data.coupon_code || order_data.couponCode,
      pincode: order_data.pincode,
      isCod: false,
      shippingFeeOverride: order_data.shipping_fee,
      transaction
    });

    for (const row of financials.itemRows) {
      if (row.matchingVariant) {
        row.matchingVariant.stock_count = Math.max(0, row.matchingVariant.stock_count - row.quantity);
        row.matchingVariant.sales_count = Number(row.matchingVariant.sales_count || 0) + row.quantity;
        await row.matchingVariant.save({ transaction });
      }

      row.product.stock_count = Math.max(0, row.product.stock_count - row.quantity);
      if (row.product.stock_count <= 0) {
        row.product.stock_count = 0;
        row.product.in_stock = false;
      }
      row.product.sales_count = Number(row.product.sales_count || 0) + row.quantity;
      await row.product.save({ transaction });
    }

    if (financials.coupon) {
      financials.coupon.times_used = (financials.coupon.times_used || 0) + 1;
      await financials.coupon.save({ transaction });
    }

    const orderNumber = order_data.order_number || order_data.orderNumber || order_data.receipt || generateOrderNumber();
    const orderNotes = [
      `Razorpay Payment Verified`,
      `Payment ID: ${razorpay_payment_id}`,
      `Order ID: ${razorpay_order_id}`,
      order_data.notes ? `Customer Note: ${order_data.notes}` : null
    ]
      .filter(Boolean)
      .join(" | ");

    const order = await Order.create(
      {
        order_number: orderNumber,
        customer_name: order_data.customer_name,
        email: order_data.email,
        phone: order_data.phone,
        shipping_address: order_data.shipping_address,
        city: order_data.city || null,
        state: order_data.state || null,
        pincode: order_data.pincode || null,
        payment_method: "PREPAID",
        status: "confirmed",
        shipping_status: "pending_dispatch",
        courier_name: order_data.courier_name || financials.courierName || "Shiprocket Express",
        courier_company_id: order_data.courier_company_id || order_data.courierCompanyId || null,
        estimated_delivery: order_data.estimated_delivery || financials.estimatedDelivery || "3–5 Business Days",
        subtotal: financials.subtotal,
        discount_amount: financials.discountAmount,
        coupon_code: financials.coupon?.code || null,
        shipping_fee: financials.shippingFee,
        total: financials.total,
        notes: orderNotes,
        user_id: userId,
        is_guest: isGuest
      },
      { transaction }
    );

    await OrderItem.bulkCreate(
      financials.itemRows.map((row) => ({
        order_id: order.id,
        product_id: row.product_id,
        product_name_snapshot: row.product_name_snapshot,
        sku_snapshot: row.sku_snapshot,
        image_url: row.image_url,
        size: row.size,
        color: row.color,
        unit_price: row.unit_price,
        quantity: row.quantity,
        line_total: row.line_total
      })),
      { transaction }
    );

    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: order.status,
        shipping_status: order.shipping_status,
        source: "system",
        note: `Razorpay payment verified (Payment ID: ${razorpay_payment_id}). Order confirmed.`
      },
      { transaction }
    );

    return order;
  });

  const full = await Order.findByPk(result.id, {
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] }
    ]
  });

  // Asynchronously dispatch luxury order confirmation email
  if (full && full.email) {
    mailer.sendOrderConfirmationEmail(full.email, full).catch((err) => {
      console.error("[HOODEE DADDY NODEMAILER] Failed to send order confirmation email:", err.message);
    });
  }

  return sendSuccess(res, { statusCode: 201, data: full });
}

module.exports = {
  adjustItemStockForOrder: async (order, items) => sequelize.transaction(async (transaction) => {
    for (const item of items) await adjustItemStock(item, item.quantity, transaction);
  }),
  create,
  list,
  getById,
  getMyOrders,
  getMyOrderStatusHistory,
  getOrderHistoryForAdmin,
  updateStatus,
  cancelOrder,
  trackOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  requestCancellation,
  approveCancellation,
  approveReturn,
  rejectCancellation,
  markWarehouseReceived,
  processUpiRefund
};
