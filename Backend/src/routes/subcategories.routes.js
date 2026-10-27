const express = require("express");
const router = express.Router();

// Subcategories have been removed in favor of direct Categories -> Products architecture.
// Return empty array gracefully to prevent any legacy caller from failing.
router.get("/", (req, res) => res.json({ success: true, data: [] }));
router.get("/:id", (req, res) => res.status(404).json({ success: false, message: "Subcategories have been removed" }));
router.post("/", (req, res) => res.status(400).json({ success: false, message: "Subcategories have been removed. Assign products directly to categories." }));
router.put("/:id", (req, res) => res.status(400).json({ success: false, message: "Subcategories have been removed" }));
router.delete("/:id", (req, res) => res.json({ success: true, message: "Subcategory removed" }));

module.exports = router;
