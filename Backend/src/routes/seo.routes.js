const express = require("express");
const seoController = require("../controllers/seoController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public SEO Settings endpoint
router.get("/settings", seoController.getSettings);

// Admin-managed Global SEO Settings
router.put("/settings", requireAuth, seoController.updateSettings);

// Centralized Page Meta Settings (House of KNP Admin Reference)
router.get("/pages", requireAuth, seoController.listPageMeta);
router.get("/page-options", requireAuth, seoController.getPageOptions);
router.get("/pages/:id", requireAuth, seoController.getPageMeta);
router.post("/pages", requireAuth, seoController.savePageMeta);
router.delete("/pages/:id", requireAuth, seoController.deletePageMeta);

const multer = require("multer");
const memoryUploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Sitemap & Robots Management & Uploads
router.get("/sitemap-summary", requireAuth, seoController.getSitemapSummary);
router.post("/sync-sitemap", requireAuth, seoController.syncSitemap);
router.post("/upload-sitemap", requireAuth, memoryUploader.single("file"), seoController.uploadSitemapFile);
router.post("/upload-robots", requireAuth, memoryUploader.single("file"), seoController.uploadRobotsFile);

// Direct XML sitemap and robots routes under /api/seo/...
router.get("/sitemap.xml", seoController.getSitemapXml);
router.get("/robots.txt", seoController.getRobotsTxt);

module.exports = router;
