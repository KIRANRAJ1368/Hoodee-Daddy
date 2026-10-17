const express = require("express");
const uploadController = require("../controllers/uploadController");
const { requireAuth } = require("../middleware/auth");
const { makeUploader } = require("../middleware/upload");
const ApiError = require("../utils/ApiError");

const router = express.Router();

const ALLOWED_FOLDERS = new Set(["products", "variants", "categories", "subcategories", "banners", "seo"]);

// :folder must be checked against a fixed allow-list *before* it ever
// reaches multer's disk storage — passing it straight through would let a
// crafted value (e.g. "../../etc") escape the uploads directory.
router.post(
  "/:folder",
  requireAuth,
  (req, res, next) => {
    if (!ALLOWED_FOLDERS.has(req.params.folder)) {
      return next(ApiError.badRequest("Invalid upload folder"));
    }
    const uploader = makeUploader(req.params.folder).array("files", 10);
    uploader(req, res, (err) => (err ? next(err) : next()));
  },
  uploadController.upload
);

module.exports = router;
