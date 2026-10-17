const express = require("express");
const subcategoryController = require("../controllers/subcategoryController");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const v = require("../validators/subcategoryValidators");

const router = express.Router();

router.get("/", subcategoryController.list);
router.get("/:id", v.idParam, validate, subcategoryController.getById);

router.post("/", requireAuth, v.create, validate, subcategoryController.create);
router.put("/:id", requireAuth, v.update, validate, subcategoryController.update);
router.delete("/:id", requireAuth, v.idParam, validate, subcategoryController.remove);

module.exports = router;
