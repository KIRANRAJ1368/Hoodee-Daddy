import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function run() {
  console.log("================================================================================");
  console.log("🚀 CAPTURING STOREFRONT CHECKOUT COURIERS & TRACK/CANCEL MODAL (PORT 3000)");
  console.log("================================================================================");

  const localOutputDir = path.resolve("playwright-screenshots-all");
  const artifactDir = "C:\\Users\\Kalaiyarasi\\.gemini\\antigravity\\brain\\9d394afc-c95b-46b3-ad03-c609aca7d196";

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5
  });
  const page = await context.newPage();

  async function saveScreenshot(filename, fullPage = false) {
    const localPath = path.join(localOutputDir, filename);
    await page.screenshot({ path: localPath, fullPage });
    console.log(`📸 Captured local: ${localPath}`);

    const artifactPath = path.join(artifactDir, filename);
    fs.copyFileSync(localPath, artifactPath);
    console.log(`✓ Copied to artifact dir: ${artifactPath}`);
    return artifactPath;
  }

  // 1. ADD ITEM TO CART & GO TO CHECKOUT
  console.log("\n[1/2] Navigating to Home & Adding product to cart...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click first product card
  const productCard = await page.locator("a[href*='/product/']").first();
  if (await productCard.count() > 0) {
    await productCard.click();
    await page.waitForTimeout(1000);
    console.log("On product detail page:", page.url());

    // Click available size
    const sizePill = await page.locator("button.pdp-size-btn, button.size-btn, .size-selector button").first();
    if (await sizePill.count() > 0) {
      await sizePill.click();
      await page.waitForTimeout(200);
    }

    // Click Add to Cart
    const addBtn = await page.locator("button:has-text('ADD TO CART'), button:has-text('Add to Cart')").first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      console.log("Clicked Add to Cart!");
      await page.waitForTimeout(1000);
    }
  }

  // Navigate to Checkout
  console.log("Navigating to Checkout: http://localhost:3000/checkout");
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Check if Step 1 is visible
  const emailInput = await page.locator("#email");
  if (await emailInput.count() > 0) {
    console.log("Filling Step 1 Contact Info...");
    await emailInput.fill("ananya.sharma@example.com");
    await page.fill("#phone", "9876543210");
    await page.click("button:has-text('CONTINUE TO DELIVERY')");
    await page.waitForTimeout(1000);

    console.log("Filling Step 2 Address with PIN 641016 (Coimbatore warehouse hub)...");
    await page.fill("#fullName", "Ananya Sharma");
    await page.fill("#address", "740 Park Avenue, Apt 14B, Peelamedu");
    await page.fill("#postalCode", "641016");
    console.log("Waiting 3s for Shiprocket live rate calculation & multi-courier options...");
    await page.waitForTimeout(3000);

    await saveScreenshot("08-storefront-checkout-shiprocket.png", true);
  } else {
    console.warn("Notice: Checkout did not display #email field.");
    await saveScreenshot("08-storefront-checkout-shiprocket.png", true);
  }

  // 2. STOREFRONT ORDER TRACKING & CANCELLATION REQUEST MODAL
  console.log("\n[2/2] Opening Track Order modal for active order ZMW-PW-T2-MV225RDH...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click Track Order in footer
  const footerTrackBtn = await page.locator("footer a:has-text('Track Order'), a:has-text('Track Order')").first();
  if (await footerTrackBtn.count() > 0) {
    await footerTrackBtn.click();
    await page.waitForTimeout(800);
  }

  // Check if OrderTrackModal is open
  const modalInput = await page.locator("input#orderId, .track-modal input, input[placeholder*='Order' i]").first();
  if (await modalInput.count() > 0) {
    console.log("Found track order input, submitting ZMW-PW-T2-MV225RDH...");
    await modalInput.fill("ZMW-PW-T2-MV225RDH");
    const trackSubmit = await page.locator("button[type='submit']:has-text('Track'), button:has-text('TRACK')").first();
    if (await trackSubmit.count() > 0) {
      await trackSubmit.click();
      await page.waitForTimeout(1800);
    }
    await saveScreenshot("09-storefront-track-order-modal.png", false);

    // Click "Request Cancellation / Stop Delivery" button if present
    const cancelReqBtn = await page.locator("button:has-text('Stop Delivery'), button:has-text('Cancel Order'), button:has-text('Request Return')").first();
    if (await cancelReqBtn.count() > 0) {
      console.log("Opening Interactive Customer Cancellation / Return Modal...");
      await cancelReqBtn.click();
      await page.waitForTimeout(800);
      await saveScreenshot("10-storefront-cancel-return-form.png", false);
    }
  } else {
    console.warn("Notice: Track modal input not found.");
    await saveScreenshot("09-storefront-track-order-modal.png", false);
  }

  await browser.close();
  console.log("\n🎉 ALL ADDITIONAL STOREFRONT SCREENSHOTS CAPTURED!");
}

run().catch((err) => {
  console.error("❌ ERROR:", err);
  process.exit(1);
});
