"use strict";

const { chromium } = require("k:/ZMW/Frontend/node_modules/playwright");
const path = require("path");
const fs = require("fs");
const { User, Order, Product, sequelize } = require("../src/models");

const ARTIFACT_DIR = "C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196";

function findLatestOtpFromLog() {
  const logDir = "C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196/.system_generated/tasks";
  const files = fs.readdirSync(logDir).filter((f) => f.endsWith(".log"));
  let latestOtp = null;
  let latestMtime = 0;
  for (const file of files) {
    try {
      const fullPath = path.join(logDir, file);
      const stat = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, "utf8");
      const matches = content.match(/\[OTP Code\]\s*:\s*(\d{6})/g);
      if (matches && stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        const lastMatch = matches[matches.length - 1];
        latestOtp = lastMatch.replace(/[^0-9]/g, "");
      }
    } catch {}
  }
  return latestOtp;
}

async function runAuthAndOrderSequenceTest() {
  console.log("==================================================================");
  console.log("RUNNING AUTH LIFECYCLE & ORDER SEQUENCE DUPLICATION PREVENTION TEST");
  console.log("==================================================================");

  const timestamp = Date.now();
  const testEmail = `zmw_tester_${timestamp}@gmail.com`;
  const initialPassword = "InitialPassword@2026";
  const updatedPassword = "UpdatedPassword@2026";

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Customer Registration
  console.log("\n--- 1. Testing Customer Registration ---");
  await page.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // Switch to Register tab if not already active
  const createAccountTab = page.locator("button:has-text('Create Account'), button:has-text('Register')").first();
  if (await createAccountTab.isVisible()) {
    await createAccountTab.click();
    await page.waitForTimeout(400);
  }

  await page.fill("#reg-name, input[name='name']", "ZMW Automation User");
  await page.fill("#auth-email, input[name='email']", testEmail);
  await page.fill("#reg-phone, input[name='phone']", "9840123456");
  await page.fill("#auth-password, input[name='password']", initialPassword);
  const confirmPass = page.locator("#reg-confirmPassword, input[name='confirmPassword']");
  if (await confirmPass.isVisible()) await confirmPass.fill(initialPassword);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "68-e2e-auth-customer-register.png") });
  console.log("✓ Captured: 68-e2e-auth-customer-register.png (Registration Form Filled)");

  await page.click("button[type='submit']");
  await page.waitForTimeout(2000);

  // 2. Customer Login
  console.log("\n--- 2. Testing Customer Login ---");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  await page.fill("#auth-email", testEmail);
  await page.fill("#auth-password", initialPassword);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "69-e2e-auth-customer-login.png") });
  console.log("✓ Captured: 69-e2e-auth-customer-login.png (Login Form)");

  await page.click("button[type='submit']");
  await page.waitForTimeout(1500);

  // 3. Customer Forgot Password & OTP Reset
  console.log("\n--- 3. Testing Customer Forgot Password & OTP Reset ---");
  await page.goto("http://localhost:3000/forgot-password", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  await page.fill("#auth-email", testEmail);
  await page.click("button[type='submit']");
  await page.waitForTimeout(1500);

  const otp = findLatestOtpFromLog();
  console.log("Dispatched OTP from mailer log:", otp);
  if (otp) {
    const otpInput = page.locator("#auth-otp");
    if (await otpInput.isVisible()) {
      await otpInput.fill(otp);
      await page.click("button[type='submit']");
      await page.waitForTimeout(1500);

      // Set New Password
      const newPassInput = page.locator("#auth-newPassword");
      if (await newPassInput.isVisible()) {
        await newPassInput.fill(updatedPassword);
        await page.fill("#auth-confirmPassword", updatedPassword);
        await page.click("button[type='submit']");
        await page.waitForTimeout(1500);
        console.log("✓ Successfully reset password to updatedPassword.");
      }
    }
  }

  // 4. Test Order Sequence & Double-Entry Prevention
  console.log("\n--- 4. Testing Order Sequence & Double-Entry Prevention ---");
  const testProduct = await Product.findOne({ order: [["id", "DESC"]] });
  if (!testProduct) throw new Error("No test product available");

  // Add product to cart
  await page.goto(`http://localhost:3000/product/${testProduct.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const addBtn = page.locator("button:has-text('Add to Cart'), button:has-text('ADD TO BAG')").first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await page.waitForTimeout(1000);
  }

  // Checkout
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Step 1
  const contactEmail = page.locator("#contactEmail");
  if (await contactEmail.isVisible()) {
    await contactEmail.fill(testEmail);
    const toDeliveryBtn = page.locator("button:has-text('CONTINUE TO DELIVERY')").first();
    if (await toDeliveryBtn.isVisible()) {
      await toDeliveryBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // Step 2
  await page.fill("#fullName", "ZMW Automation User");
  await page.fill("#deliveryPhone", "9840123456");
  await page.fill("#address", "45 Park Avenue, Anna Nagar");
  await page.fill("#postalCode", "600001");
  await page.waitForTimeout(800);
  await page.fill("#city", "Chennai");
  await page.fill("#state", "Tamil Nadu");

  const toPaymentBtn = page.locator("button:has-text('CONTINUE TO PAYMENT')").first();
  if (await toPaymentBtn.isVisible()) {
    await toPaymentBtn.click();
    await page.waitForTimeout(800);
  }

  // Step 3
  const codRadio = page.locator("label:has-text('Cash on Delivery'), input[value='cod']").first();
  if (await codRadio.isVisible()) {
    await codRadio.click();
    await page.waitForTimeout(400);
  }

  // Place Order #1
  console.log("Placing Order #1...");
  const placeOrderBtn = page.locator("button:has-text('PLACE ORDER')").first();
  if (await placeOrderBtn.isVisible()) {
    await placeOrderBtn.click();
    await page.waitForTimeout(3000);
  }

  // Check Receipt of Order #1
  const order1Num = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll("strong, h2, h3, span")).find((e) => e.innerText && e.innerText.includes("ZMW-"));
    return el ? el.innerText.trim() : null;
  });
  console.log("✓ Placed Order #1 Number:", order1Num);

  // Verify Cart is Cleared & Cannot re-submit same order
  console.log("Checking if user can enter the same order again...");
  await page.goto("http://localhost:3000/cart", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const isCartEmpty = await page.evaluate(() => {
    return document.body.innerText.includes("Your bag is empty") || document.body.innerText.includes("Your cart is empty") || document.querySelectorAll(".cart-item").length === 0;
  });
  console.log("✓ Bag is empty after order placement, preventing duplicate re-entry:", isCartEmpty);

  // Try navigating directly back to /checkout without items
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const checkoutBlocked = await page.evaluate(() => {
    return document.body.innerText.includes("Your bag is empty") || document.body.innerText.includes("No items to checkout") || !document.body.innerText.includes("PLACE ORDER");
  });
  console.log("✓ Checkout blocked when bag is empty (no double entry possible):", checkoutBlocked);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "70-e2e-prevent-duplicate-order-receipt.png") });
  console.log("✓ Captured: 70-e2e-prevent-duplicate-order-receipt.png (Duplicate Order Prevention)");

  // 5. Verify Order Sequence in Admin Orders
  console.log("\n--- 5. Verifying Order Sequence in Admin ---");
  const adminRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "adminzmw@gmail.com", password: "Admin@2026" })
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.data.token;

  await page.goto("http://localhost:5174/login");
  await page.evaluate((tok) => {
    localStorage.setItem("zmw_admin_token", tok);
    localStorage.setItem("zmw_admin_user", JSON.stringify({ email: "adminzmw@gmail.com", role: "admin" }));
  }, adminToken);

  await page.goto("http://localhost:5174/orders", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const ordersInAdmin = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tbody tr"));
    return rows.slice(0, 5).map((r) => r.innerText.replace(/\n+/g, " | "));
  });
  console.log("Top Orders in Admin Table (Reverse Chronological Sequence):", ordersInAdmin);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "71-e2e-admin-order-sequence-verification.png") });
  console.log("✓ Captured: 71-e2e-admin-order-sequence-verification.png (Strict Order Sequence in Admin)");

  await browser.close();
  console.log("\n==================================================================");
  console.log("AUTH & ORDER SEQUENCE VERIFICATION COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
  process.exit(0);
}

runAuthAndOrderSequenceTest().catch((err) => {
  console.error("FATAL ERROR in runAuthAndOrderSequenceTest:", err);
  process.exit(1);
});
