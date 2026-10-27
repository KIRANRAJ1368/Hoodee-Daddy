const fs = require("fs");
const path = require("path");

const imgPath = path.join(__dirname, "..", "..", "frontend", "public", "images", "hoodee-daddy-logo.png");
const buf = fs.readFileSync(imgPath);
const base64 = "data:image/png;base64," + buf.toString("base64");

const brandLogoContent = `/**
 * Official HooDee Daddy Brand Logo in Base64 for embedded gateways (Razorpay, emails, modals).
 * Using Base64 ensures zero broken image icons across localhost, staging, and production.
 */
export const ZMW_LOGO_BASE64 = "${base64}";
export const ZMW_LOGO_URL = "/images/hoodee-daddy-logo.png";
`;

const zmwLogoContent = `/**
 * HooDee Daddy Brand Logo in Base64 Data URI format for Razorpay Checkout.
 * Razorpay Checkout runs in an isolated iframe/popup. Using a Base64 Data URI
 * ensures the logo is loaded reliably across all environments without broken image icons.
 */
export const ZMW_LOGO_DATA_URI = "${base64}";
export const ZMW_LOGO_URL = "/images/hoodee-daddy-logo.png";
`;

const brandLogoPath = path.join(__dirname, "..", "..", "frontend", "src", "utils", "brandLogo.js");
const zmwLogoPath = path.join(__dirname, "..", "..", "frontend", "src", "utils", "zmwLogo.js");

fs.writeFileSync(brandLogoPath, brandLogoContent, "utf8");
fs.writeFileSync(zmwLogoPath, zmwLogoContent, "utf8");
console.log("brandLogo.js and zmwLogo.js updated successfully!");
