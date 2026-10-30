const { Order, OrderItem, OrderStatusHistory, Product, User } = require("../models");
const shiprocketService = require("../services/shiprocketService");
const mailer = require("../utils/mailer");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { Op } = require("sequelize");

/**
 * Public: Calculate shipping charge strictly based on destination PIN code.
 */
async function calculateRate(req, res) {
  const { pincode, postalCode } = req.body;
  const pin = pincode || postalCode;

  if (!pin) {
    throw ApiError.badRequest("Delivery PIN code is required to calculate shipping rates.");
  }

  const cleanPin = String(pin).trim().replace(/\D/g, "");
  if (cleanPin.length !== 6) {
    throw ApiError.badRequest("Please enter a valid 6-digit Indian PIN code.");
  }

  const rateResult = await shiprocketService.calculateShippingRate({
    deliveryPincode: cleanPin
  });

  return sendSuccess(res, { data: rateResult });
}

/**
 * Admin: List shipments and delivery statuses.
 */
async function listShipments(req, res) {
  const { page, limit, offset } = getPagination(req.query);
  const where = {};

  if (req.query.shipping_status) {
    where.shipping_status = req.query.shipping_status;
  }

  if (req.query.search) {
    const q = req.query.search.trim();
    where[Op.or] = [
      { order_number: { [Op.like]: `%${q}%` } },
      { customer_name: { [Op.like]: `%${q}%` } },
      { tracking_number: { [Op.like]: `%${q}%` } },
      { awb_code: { [Op.like]: `%${q}%` } },
      { pincode: { [Op.like]: `%${q}%` } },
      { phone: { [Op.like]: `%${q}%` } }
    ];
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] }
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset
  });

  return sendSuccess(res, { data: rows, meta: buildMeta({ page, limit, count }) });
}

/**
 * Admin: Get single shipment details.
 */
async function getShipmentById(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] }
    ]
  });

  if (!order) {
    throw ApiError.notFound("Shipment / Order not found");
  }

  return sendSuccess(res, { data: order });
}

/**
 * Admin: Generate Shiprocket AWB / Shipment for an order.
 */
async function generateAwb(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status === "cancelled" || order.status === "returned") {
    throw ApiError.badRequest("Cancelled or returned orders cannot be shipped.");
  }

  if (order.shipment_id && order.awb_code) throw ApiError.conflict("This order already has a Shiprocket AWB.");
  const shipmentResult = await shiprocketService.createShipment(order);

  order.shipping_status = "manifested";
  order.status = "packed";
  order.shipment_id = shipmentResult.shipment_id;
  order.shiprocket_order_id = shipmentResult.shiprocket_order_id || shipmentResult.order_id || null;
  order.awb_code = shipmentResult.awb_code;
  order.tracking_number = shipmentResult.awb_code;
  order.courier_name = shipmentResult.courier_name;
  order.shipment_error = null;
  order.estimated_delivery = order.estimated_delivery || "3–5 Business Days";

  await order.save();

  await OrderStatusHistory.create({ order_id: order.id, status: order.status, shipping_status: order.shipping_status, source: "admin", note: "Shiprocket shipment and AWB generated" });

  if (order.email) {
    mailer.sendOrderStatusUpdateEmail(order.email, order, "packed", "confirmed", {
      courier_name: shipmentResult.courier_name,
      awb_code: shipmentResult.awb_code
    }).catch((err) => console.warn("[HOODEE DADDY NODEMAILER] AWB status email notice:", err.message));
  }

  return sendSuccess(res, {
    message: `Shiprocket AWB ${shipmentResult.awb_code} generated successfully!`,
    data: order
  });
}

/**
 * Admin: Update shipping status (pending_dispatch, manifested, in_transit, out_for_delivery, delivered).
 */
async function updateShippingStatus(req, res) {
  const shipping_status = req.body.shipping_status || req.body.shippingStatus;
  const tracking_number = req.body.tracking_number || req.body.trackingNumber;
  const courier_name = req.body.courier_name || req.body.courierName;
  const estimated_delivery = req.body.estimated_delivery || req.body.estimatedDelivery;

  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const previousStatus = order.status;
  const previousShippingStatus = order.shipping_status;

  if (shipping_status) {
    if (!req.admin) throw ApiError.forbidden("Admin access is required to set a manual shipping status.");
    order.shipping_status = shipping_status;

    // Sync order fulfillment status
    if (shipping_status === "manifested") {
      order.status = "packed";
    } else if (shipping_status === "in_transit" || shipping_status === "out_for_delivery") {
      order.status = "shipped";
    } else if (shipping_status === "delivered") {
      order.status = "delivered";
    } else if (shipping_status === "rto") {
      order.status = "returned";
    }
  }

  if (tracking_number) order.tracking_number = tracking_number;
  if (courier_name) order.courier_name = courier_name;
  if (estimated_delivery) order.estimated_delivery = estimated_delivery;

  await order.save();
  if (previousStatus !== order.status && ["cancelled", "returned"].includes(order.status) && !["cancelled", "returned"].includes(previousStatus)) {
    const { adjustItemStockForOrder } = require("./orderController");
    await adjustItemStockForOrder(order, order.items);
  }
  if (previousShippingStatus !== order.shipping_status || previousStatus !== order.status) {
    await OrderStatusHistory.create({ order_id: order.id, status: order.status, shipping_status: order.shipping_status, source: "admin", note: "Shipping status updated manually" });
  }

  if (previousStatus !== order.status && order.email) {
    mailer.sendOrderStatusUpdateEmail(order.email, order, order.status, previousStatus)
      .catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Shipping status update email notice:", err.message));
  }

  return sendSuccess(res, {
    message: `Shipping status updated to "${order.shipping_status}"`,
    data: order
  });
}

/**
 * Automatically sync shipment and order tracking status from Shiprocket.
 */
async function syncTracking(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: OrderItem, as: "items" }]
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const awb = order.awb_code || order.tracking_number;
  let newShippingStatus = order.shipping_status || "pending_dispatch";
  let newOrderStatus = order.status || "confirmed";
  let syncMessage = "Tracking status is synchronized with Shiprocket.";

  if (awb) {
    const tracking = await shiprocketService.trackShipment(awb);
    if (tracking && tracking.status) {
      newShippingStatus = tracking.status;
      newOrderStatus = tracking.order_status;
      syncMessage = `Live Shiprocket update: ${tracking.message || tracking.status}`;
    } else {
      syncMessage = "Shiprocket has no new scan yet. The current shipment status was kept unchanged.";
    }
  } else {
    // Retry shipment creation when tracking was requested before a shipment existed.
    const shipmentResult = await shiprocketService.createShipment(order);
    order.shipment_id = shipmentResult.shipment_id;
    order.awb_code = shipmentResult.awb_code;
    order.tracking_number = shipmentResult.awb_code;
    order.courier_name = shipmentResult.courier_name;
    newShippingStatus = "manifested";
    newOrderStatus = "packed";
    syncMessage = `Shiprocket AWB ${shipmentResult.awb_code} generated & status moved to Manifested.`;
  }

  const previousShippingStatus = order.shipping_status;
  const previousOrderStatus = order.status;
  order.shipping_status = newShippingStatus;
  order.status = newOrderStatus;
  await order.save();
  if (previousShippingStatus !== order.shipping_status || previousOrderStatus !== order.status) {
    await OrderStatusHistory.create({ order_id: order.id, status: order.status, shipping_status: order.shipping_status, source: "shiprocket", note: syncMessage });
  }

  if (previousOrderStatus !== order.status && order.email) {
    mailer.sendOrderStatusUpdateEmail(order.email, order, order.status, previousOrderStatus)
      .catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Sync tracking status update email notice:", err.message));
  }

  return sendSuccess(res, {
    message: syncMessage,
    data: order
  });
}

/**
 * Handle incoming webhook tracking event from Shiprocket.
 */
async function handleWebhook(req, res) {
  const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (webhookToken) {
    const provided = req.headers["x-api-key"] || req.headers["x-webhook-token"] || req.query.token;
    if (provided !== webhookToken) {
      return res.status(401).json({ success: false, message: "Unauthorized webhook request" });
    }
  }

  const { awb, current_status, shipment_status } = req.body || {};
  if (!awb) return res.status(200).json({ success: true, message: "Ignored, no AWB" });

  const order = await Order.findOne({
    where: {
      [Op.or]: [{ awb_code: awb }, { tracking_number: awb }]
    },
    include: [{ model: OrderItem, as: "items" }]
  });

  if (order) {
    const previousStatus = order.status;
    const previousShippingStatus = order.shipping_status;
    const mapped = shiprocketService.mapShiprocketStatus(current_status || shipment_status);
    if (mapped) {
      order.shipping_status = mapped.shipping_status;
      order.status = mapped.order_status;
      await order.save();
      if (previousStatus !== order.status || previousShippingStatus !== order.shipping_status) {
        await OrderStatusHistory.create({ order_id: order.id, status: order.status, shipping_status: order.shipping_status, source: "shiprocket", note: mapped.message });
      }
      if (previousStatus !== order.status && order.email) {
        mailer.sendOrderStatusUpdateEmail(order.email, order, order.status, previousStatus)
          .catch((err) => console.warn("[HOODEE DADDY NODEMAILER] Webhook status update email notice:", err.message));
      }
    }
  }

  return res.status(200).json({ success: true });
}

module.exports = {
  calculateRate,
  listShipments,
  getShipmentById,
  generateAwb,
  updateShippingStatus,
  syncTracking,
  handleWebhook
};
