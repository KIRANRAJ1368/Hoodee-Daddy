const express = require("express");
const announcementController = require("../controllers/announcementController");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const v = require("../validators/announcementValidators");

const router = express.Router();

// Public: active announcement for storefront top navbar
router.get("/active", announcementController.getActive);

// Admin: full management
router.get("/", requireAuth, announcementController.list);
router.post("/", requireAuth, v.create, validate, announcementController.create);
router.put("/:id", requireAuth, v.update, validate, announcementController.update);
router.patch("/:id/toggle", requireAuth, v.idParam, validate, announcementController.toggle);
router.delete("/:id", requireAuth, v.idParam, validate, announcementController.remove);

module.exports = router;
