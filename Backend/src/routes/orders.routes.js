const express = require("express");
const orderController = require("../controllers/orderController");
const uploadController = require("../controllers/uploadController");
const { requireAuth, requireCustomerAuth, optionalCustomerAuth } = require("../middleware/auth");
const { makeUploader } = require("../middleware/upload");
const validate = require("../middleware/validate");
const v = require("../validators/orderValidators");

const router = express.Router();

// Order Tracking (Public - guest or customer)
router.get("/track", orderController.trackOrder);

// Customer Order History
router.get("/my-orders", requireCustomerAuth, orderController.getMyOrders);
router.get("/my-orders/:id/status-history", requireCustomerAuth, orderController.getMyOrderStatusHistory);

// Media Proof Upload for Returns (Customer / Guest)
router.post(
  "/upload-proof",
  (req, res, next) => {
    req.uploadFolder = "returns";
    const uploader = makeUploader("returns").array("files", 5);
    uploader(req, res, (err) => (err ? next(err) : next()));
  },
  uploadController.upload
);

router.post("/upload-review-images", requireCustomerAuth, (req, res, next) => {
  req.uploadFolder = "reviews";
  const uploader = makeUploader("reviews").array("files", 4);
  uploader(req, res, (err) => (err ? next(err) : next()));
}, uploadController.upload);

// Customer / Storefront Order Cancellation & Return Request (Guest or Customer)
router.post("/:id/cancel", optionalCustomerAuth, v.idParam, validate, orderController.requestCancellation);
router.post("/:id/request-cancellation", optionalCustomerAuth, v.idParam, validate, orderController.requestCancellation);

// Storefront checkout (Guest or Authenticated Customer)
router.post("/razorpay/create-order", optionalCustomerAuth, orderController.createRazorpayOrder);
router.post("/razorpay/verify-payment", optionalCustomerAuth, orderController.verifyRazorpayPayment);
router.post("/", optionalCustomerAuth, v.create, validate, orderController.create);

// Order Invoice (Customer or Admin)
router.get("/:id/invoice", optionalCustomerAuth, v.idParam, validate, orderController.getById);

// Admin Order Management
router.get("/", requireAuth, orderController.list);
router.get("/:id", requireAuth, v.idParam, validate, orderController.getById);
router.patch("/:id/status", requireAuth, v.updateStatus, validate, orderController.updateStatus);
router.get("/:id/status-history", requireAuth, v.idParam, validate, orderController.getOrderHistoryForAdmin);

// Admin Cancellation, Return & Refund Workflow
router.post("/:id/approve-cancellation", requireAuth, v.idParam, validate, orderController.approveCancellation);
router.post("/:id/approve-return", requireAuth, v.idParam, validate, orderController.approveReturn);
router.post("/:id/reject-cancellation", requireAuth, v.idParam, validate, orderController.rejectCancellation);
router.post("/:id/mark-warehouse-received", requireAuth, v.idParam, validate, orderController.markWarehouseReceived);
router.post("/:id/process-upi-refund", requireAuth, v.idParam, validate, orderController.processUpiRefund);

module.exports = router;
