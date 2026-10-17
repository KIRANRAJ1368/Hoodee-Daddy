const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "..", "Frontend", "public", "logo192.png");
const targetPath = path.join(__dirname, "..", "..", "Frontend", "src", "utils", "brandLogo.js");

const buf = fs.readFileSync(logoPath);
const base64 = "data:image/png;base64," + buf.toString("base64");

const content = `/**
 * Official ZMW Brand Logo in Base64 for embedded gateways (Razorpay, emails, modals).
 * Using Base64 ensures zero broken image icons across localhost, staging, and production.
 */
export const ZMW_LOGO_BASE64 = "${base64}";
export const ZMW_LOGO_URL = "/images/zmw-logo.png";
`;

fs.writeFileSync(targetPath, content, "utf8");
console.log("brandLogo.js generated successfully! Size:", content.length);
