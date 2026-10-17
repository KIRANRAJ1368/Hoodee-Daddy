const express = require("express");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/offerController");

const router = express.Router();

router.get("/", controller.list);
router.post("/", requireAuth, controller.create);
router.put("/:id", requireAuth, controller.update);
router.patch("/:id", requireAuth, controller.update);
router.delete("/:id", requireAuth, controller.remove);

module.exports = router;
