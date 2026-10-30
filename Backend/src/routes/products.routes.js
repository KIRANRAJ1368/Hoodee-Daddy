const express = require("express");
const productController = require("../controllers/productController");
const reviewController = require("../controllers/reviewController");
const { requireAuth, requireCustomerAuth, optionalCustomerAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const v = require("../validators/productValidators");

const router = express.Router();

router.get("/", productController.list);

// Customer Reviews API
router.get("/admin/reviews", requireAuth, reviewController.adminList);
router.patch("/admin/reviews/:reviewId", requireAuth, reviewController.adminUpdate);
router.delete("/admin/reviews/:reviewId", requireAuth, reviewController.adminDelete);
router.get("/:idOrSlug/reviews/eligibility", optionalCustomerAuth, reviewController.checkReviewEligibility);
router.get("/:idOrSlug/reviews", optionalCustomerAuth, reviewController.listByProduct);
router.post("/:idOrSlug/reviews", requireCustomerAuth, reviewController.createForProduct);
router.put("/:idOrSlug/reviews/:reviewId", requireCustomerAuth, reviewController.updateOwnReview);
router.delete("/:idOrSlug/reviews/:reviewId", requireCustomerAuth, reviewController.deleteOwnReview);

// Admin edit forms need a database-ID lookup. Keep the public slug route
// separate so a numeric ID is never interpreted as a product slug.
router.get("/admin/:id", requireAuth, v.idParam, validate, productController.getById);
router.get("/:slug", productController.getBySlug);

router.post("/", requireAuth, v.create, validate, productController.create);
router.put("/:id", requireAuth, v.update, validate, productController.update);
router.delete("/:id", requireAuth, v.idParam, validate, productController.remove);

router.patch("/:id/best-seller", requireAuth, v.idParam, validate, productController.toggleBestSeller);
router.patch("/:id/new-arrival", requireAuth, v.idParam, validate, productController.toggleNewArrival);
router.patch("/:id/show-on-homepage", requireAuth, v.idParam, validate, productController.toggleShowOnHomepage);
router.patch("/:id/stock", requireAuth, v.stock, validate, productController.updateStock);

router.get("/:id/variants", requireAuth, v.idParam, validate, productController.listVariants);
router.post("/:id/variants", requireAuth, v.idParam, validate, productController.createVariant);
router.put("/:id/variants", requireAuth, v.idParam, validate, productController.saveVariants);
router.put("/:id/variants/:variantId", requireAuth, v.idParam, validate, productController.updateVariant);
router.delete("/:id/variants/:variantId", requireAuth, v.idParam, validate, productController.deleteVariant);

module.exports = router;
