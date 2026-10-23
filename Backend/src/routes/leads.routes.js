const express = require("express");
const leadController = require("../controllers/leadController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public endpoints
router.post("/submit", leadController.submitLead);
router.get("/pincode/:pincode", leadController.lookupPincode);

// Admin endpoint
router.get("/", requireAuth, leadController.listLeads);

module.exports = router;
