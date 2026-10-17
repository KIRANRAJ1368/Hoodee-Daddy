const express = require("express");
const couponController = require("../controllers/couponController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public storefront coupon validation
router.post("/validate", couponController.validate);
router.get("/available", couponController.listAvailable);

// Admin Coupon Management
router.get("/", requireAuth, couponController.list);
router.get("/:id", requireAuth, couponController.getById);
router.post("/", requireAuth, couponController.create);
router.put("/:id", requireAuth, couponController.update);
router.delete("/:id", requireAuth, couponController.remove);

module.exports = router;
