import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function run() {
  console.log("================================================================================");
  console.log("🚀 STARTING PLAYWRIGHT COMPREHENSIVE SCREENSHOT CAPTURE SUITE");
  console.log("================================================================================");

  const localOutputDir = path.resolve("playwright-screenshots-all");
  const artifactDir = "C:\\Users\\Kalaiyarasi\\.gemini\\antigravity\\brain\\9d394afc-c95b-46b3-ad03-c609aca7d196";

  if (!fs.existsSync(localOutputDir)) {
    fs.mkdirSync(localOutputDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5 // Crisp retina quality
  });
  const page = await context.newPage();

  async function saveScreenshot(filename, fullPage = false) {
    const localPath = path.join(localOutputDir, filename);
    await page.screenshot({ path: localPath, fullPage });
    console.log(`📸 Captured local: ${localPath}`);

    // Also copy directly to the artifact directory for rendering in Antigravity
    const artifactPath = path.join(artifactDir, filename);
    fs.copyFileSync(localPath, artifactPath);
    console.log(`✓ Copied to artifact dir: ${artifactPath}`);
    return artifactPath;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ADMIN LOGIN & FULL DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[1/7] Logging into Admin Portal & Capturing Dashboard...");
  await page.goto("http://localhost:5174/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.fill("#login-email", "adminzmw@gmail.com");
  await page.fill("#login-password", "Admin@2026");
  await page.click("button[type='submit']");
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
  await page.waitForTimeout(2000);

  await saveScreenshot("01-admin-dashboard-full.png", true);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ADMIN ORDERS - PENDING CANCEL / RETURN REQUESTS TAB
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[2/7] Capturing Orders Page with 'Pending Cancel/Return Requests' filter...");
  await page.goto("http://localhost:5174/orders?cancellation_status=requested", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await saveScreenshot("02-admin-orders-cancellations.png", false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ADMIN ORDERS - PENDING REFUNDS (UPI) TAB
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[3/7] Capturing Orders Page with 'Pending Refunds (UPI)' filter...");
  await page.goto("http://localhost:5174/orders?refund_status=pending", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await saveScreenshot("03-admin-orders-refunds.png", false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ORDER DETAIL: TYPE 1 PRE-PACK CANCELLATION & UPI REFUND CARD
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[4/7] Capturing Order Detail: Type 1 Pre-Pack Cancellation...");
  // Find order 68 or first requested order
  await page.goto("http://localhost:5174/orders/68", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await saveScreenshot("04-admin-order-prepack-cancellation.png", true);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ORDER DETAIL: TYPE 3 POST-DELIVERY RETURN WITH MEDIA PROOF & SHIPROCKET REVERSE PICKUP
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[5/7] Capturing Order Detail: Type 3 Post-Delivery Return...");
  await page.goto("http://localhost:5174/orders/70", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await saveScreenshot("05-admin-order-postdelivery-return.png", true);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. ADMIN SHIPPING & SHIPROCKET LOGISTICS TRACKING
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[6/7] Capturing Shipping & Shiprocket Logistics Tracking...");
  await page.goto("http://localhost:5174/shipping/69", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await saveScreenshot("06-admin-shipping-shiprocket.png", true);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. STOREFRONT: HOMEPAGE, LIVE CHECKOUT COURIER SELECTION & TRACK ORDER
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[7/7] Capturing Storefront Views...");

  // 7.1 Homepage
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await saveScreenshot("07-storefront-homepage.png", false);

  // 7.2 Add product to cart and visit Checkout to show live Shiprocket courier selection
  try {
    console.log("Navigating to product detail to add an item to cart...");
    await page.goto("http://localhost:5173/products", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const prodCard = await page.locator("a[href*='/product/']").first();
    if (await prodCard.count() > 0) {
      await prodCard.click();
      await page.waitForTimeout(800);

      // Select size if available
      const sizeBtn = await page.locator(".size-btn, button:has-text('M'), button:has-text('Standard')").first();
      if (await sizeBtn.count() > 0) {
        await sizeBtn.click();
        await page.waitForTimeout(300);
      }

      // Add to cart
      const addBtn = await page.locator("button:has-text('Add to Cart'), button:has-text('ADD TO CART')").first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // Go to checkout
    console.log("Navigating to Checkout...");
    await page.goto("http://localhost:5173/checkout", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    // Fill pincode 641016 to fetch live Shiprocket rates
    const pinInput = await page.locator("input[name*='pincode' i], input[name*='postal' i], input[placeholder*='PIN' i]").first();
    if (await pinInput.count() > 0) {
      await pinInput.fill("641016");
      await page.waitForTimeout(1500);
    }

    await saveScreenshot("08-storefront-checkout-shiprocket.png", false);
  } catch (err) {
    console.warn("Notice during storefront cart checkout capture:", err.message);
  }

  // 7.3 Track Order Modal
  try {
    console.log("Opening Storefront Track Order modal...");
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const trackNavBtn = await page.locator("button:has-text('Track Order'), a:has-text('Track Order')").first();
    if (await trackNavBtn.count() > 0) {
      await trackNavBtn.click();
      await page.waitForTimeout(800);

      // Type the order number in search if input exists
      const orderSearchInput = await page.locator(".track-order-modal input, .modal input").first();
      if (await orderSearchInput.count() > 0) {
        await orderSearchInput.fill("ZMW-PW-T2-MV225RDH");
        await page.waitForTimeout(500);
        const searchBtn = await page.locator(".track-order-modal button:has-text('Track'), .modal button[type='submit']").first();
        if (await searchBtn.count() > 0) {
          await searchBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    await saveScreenshot("09-storefront-track-order-modal.png", false);
  } catch (err) {
    console.warn("Notice during track order modal capture:", err.message);
  }

  await browser.close();

  console.log("\n================================================================================");
  console.log("🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED AND COPIED TO ARTIFACT DIRECTORY!");
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("❌ CAPTURE SUITE ERROR:", err);
  process.exit(1);
});
