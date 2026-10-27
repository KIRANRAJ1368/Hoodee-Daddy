const { Product, Category, Banner, Order, ContactSubmission, User } = require("../models");
const { sendSuccess } = require("../utils/apiResponse");
const { Op } = require("sequelize");

const SALES_EXCLUDED_STATUSES = ["cancelled", "returned"];

async function summary(req, res) {
  const { from, to } = req.query;

  const parseDate = (value, endOfDay) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    if (endOfDay) d.setHours(23, 59, 59, 999);
    return d;
  };
  const fromDate = parseDate(from, false);
  const toDate = parseDate(to, true);

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);

  const salesWhere = (extra = {}) => ({ status: { [Op.notIn]: SALES_EXCLUDED_STATUSES }, ...extra });

  const [
    productCount,
    activeProductCount,
    outOfStockCount,
    lowStockCount,
    categoryCount,
    activeCategoryCount,
    bannerCount,
    activeBannerCount,
    orderCount,
    pendingOrders,
    confirmedOrders,
    packedOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    returnedOrders,
    customerCount,
    guestOrderCount,
    registeredOrderCount,
    totalSales,
    todaySales,
    rangeSales,
    newContactCount,
    pendingCancellationRequests,
    pendingRefundCount,
    processedRefundCount,
    totalRefundAmount,
    rtoInTransitCount,
    rtoDeliveredCount
  ] = await Promise.all([
    Product.count(),
    Product.count({ where: { is_active: true } }),
    Product.count({
      where: {
        [Op.or]: [{ in_stock: false }, { stock_count: 0 }]
      }
    }),
    Product.count({ where: { in_stock: true, stock_count: { [Op.lte]: 5 } } }),
    Category.count(),
    Category.count({ where: { is_active: true } }),
    Banner.count(),
    Banner.count({ where: { is_active: true } }),
    Order.count(),
    Order.count({ where: { status: "pending" } }),
    Order.count({ where: { status: "confirmed" } }),
    Order.count({ where: { status: "packed" } }),
    Order.count({ where: { status: "shipped" } }),
    Order.count({ where: { status: "delivered" } }),
    Order.count({ where: { status: "cancelled" } }),
    Order.count({ where: { status: "returned" } }),
    User.count(),
    Order.count({ where: { is_guest: true } }),
    Order.count({ where: { is_guest: false } }),
    Order.sum("total", { where: salesWhere() }),
    Order.sum("total", { where: salesWhere({ createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } }) }),
    fromDate && toDate
      ? Order.sum("total", { where: salesWhere({ createdAt: { [Op.gte]: fromDate, [Op.lte]: toDate } }) })
      : null,
    ContactSubmission.count({ where: { status: "new" } }),
    Order.count({ where: { cancellation_status: "requested" } }),
    Order.count({ where: { refund_status: "pending" } }),
    Order.count({ where: { refund_status: "processed" } }),
    Order.sum("refund_amount", { where: { refund_status: "processed" } }),
    Order.count({ where: { cancellation_status: "rto_in_transit" } }),
    Order.count({ where: { cancellation_status: "rto_delivered" } })
  ]);

  const recentCancellations = await Order.findAll({
    where: {
      [Op.or]: [
        { cancellation_status: { [Op.ne]: "none" } },
        { refund_status: "pending" }
      ]
    },
    order: [["updated_at", "DESC"]],
    limit: 6,
    attributes: [
      "id",
      "order_number",
      "customer_name",
      "email",
      "phone",
      "total",
      "status",
      "shipping_status",
      "cancellation_type",
      "cancellation_status",
      "cancellation_reason",
      "refund_status",
      "refund_amount",
      "refund_upi_id",
      "refund_utr_number",
      "created_at",
      "updated_at"
    ]
  });

  return sendSuccess(res, {
    data: {
      productCount,
      activeProductCount,
      outOfStockCount,
      lowStockCount,
      categoryCount,
      activeCategoryCount,
      bannerCount,
      activeBannerCount,
      orderCount,
      pendingOrders,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      customerCount,
      guestOrderCount,
      registeredOrderCount,
      totalSales: Number(totalSales) || 0,
      todaySales: Number(todaySales) || 0,
      rangeSales: rangeSales === null ? null : Number(rangeSales) || 0,
      newContactCount,
      pendingCancellationRequests,
      pendingRefundCount,
      processedRefundCount,
      totalRefundAmount: Number(totalRefundAmount) || 0,
      rtoInTransitCount,
      rtoDeliveredCount,
      recentCancellations: recentCancellations || []
    }
  });
}

module.exports = { summary };