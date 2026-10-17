const express = require("express");

const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/categories", require("./categories.routes"));
router.use("/subcategories", require("./subcategories.routes"));
router.use("/products", require("./products.routes"));
router.use("/banners", require("./banners.routes"));
router.use("/offers", require("./offers.routes"));
router.use("/home", require("./home.routes"));
router.use("/orders", require("./orders.routes"));
router.use("/shipping", require("./shipping.routes"));
router.use("/contact", require("./contact.routes"));
router.use("/customers", require("./customers.routes"));
router.use("/coupons", require("./coupons.routes"));
router.use("/admin/uploads", require("./upload.routes"));
router.use("/admin/dashboard", require("./dashboard.routes"));
router.use("/admin/reports", require("./reports.routes"));
router.use("/seo", require("./seo.routes"));

module.exports = router;
