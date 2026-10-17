import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kalaiyarasi\\.gemini\\antigravity\\brain\\9d394afc-c95b-46b3-ad03-c609aca7d196";
const LOCAL_SCREENSHOT_DIR = "k:\\ZMW\\Frontend\\screenshots-verified";

if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) {
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Starting Playwright capture for Storefront Courier & Track Order...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // 1. STOREFRONT CHECKOUT WITH SHIPROCKET MULTI-COURIER SELECTION
    // -------------------------------------------------------------
    console.log("🛍️ Navigating to product page and adding item to cart...");
    await page.goto("http://localhost:3000/product/1", { waitUntil: "networkidle" });
    
    // Click ADD TO CART
    const addCartBtn = page.locator('button:has-text("ADD TO CART")').first();
    await addCartBtn.click();
    await page.waitForTimeout(600);

    // Cart drawer should now be open. Click Proceed to Checkout
    console.log("🛒 Clicking Proceed to Checkout in Cart Drawer...");
    const checkoutBtn = page.locator(".btn-checkout").first();
    await checkoutBtn.waitFor({ state: "visible", timeout: 5000 });
    await checkoutBtn.click();

    console.log("🚚 Arrived on /checkout page...");
    await page.waitForURL("**/checkout**", { timeout: 10000 });
    await page.waitForTimeout(500);

    // In case any drawer backdrop remains, dismiss via Escape key
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Step 1: Contact Information
    console.log("📝 Filling Step 1 Contact details...");
    await page.waitForSelector("#email", { timeout: 8000 });
    await page.fill("#email", "kiranraj071845@gmail.com");
    await page.fill("#phone", "9876543210");
    await page.click(".cko-submit-step-btn");
    await page.waitForTimeout(800);

    // Step 2: Delivery Address
    console.log("📍 Filling Step 2 Delivery Address & PIN code...");
    await page.waitForSelector("#fullName", { timeout: 5000 });
    await page.fill("#fullName", "Kiran Raj");
    await page.fill("#deliveryPhone", "9876543210");
    await page.fill("#address", "123, Avinashi Road, Peelamedu");
    await page.fill("#postalCode", "641016");

    // Wait for Shiprocket rate engine to calculate and render couriers
    console.log("⏳ Waiting for Shiprocket multi-courier selection cards...");
    await page.waitForSelector(".cko-couriers-group", { timeout: 10000 });
    await page.waitForTimeout(1200);

    const checkoutImgPath = path.join(LOCAL_SCREENSHOT_DIR, "08-storefront-checkout-shiprocket.png");
    await page.screenshot({ path: checkoutImgPath, fullPage: true });
    console.log("✅ Saved 08-storefront-checkout-shiprocket.png");

    fs.copyFileSync(checkoutImgPath, path.join(ARTIFACT_DIR, "08-storefront-checkout-shiprocket.png"));

    // -------------------------------------------------------------
    // 2. STOREFRONT TRACK ORDER MODAL WITH CANCELLATION/RETURN STATE
    // -------------------------------------------------------------
    console.log("🔍 Opening Storefront Track Order Modal...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

    // Scroll down to footer to click Track My Order
    const trackOrderBtn = page.locator('button:has-text("Track My Order")').first();
    await trackOrderBtn.scrollIntoViewIfNeeded();
    await trackOrderBtn.click();

    await page.waitForSelector(".order-track-modal", { timeout: 5000 });
    console.log("🔎 Entering test order details into tracking modal...");
    await page.fill("#orderId", "ZMW-PW-T2-MV225RDH");
    await page.fill("#trackEmail", "pooja@luxuryfashion.in");
    await page.click('button:has-text("Search Order Status")');

    console.log("⏳ Waiting for tracking results...");
    await page.waitForSelector(".tracking-results-card", { timeout: 10000 });
    await page.waitForTimeout(1000);

    const trackModalImgPath = path.join(LOCAL_SCREENSHOT_DIR, "09-storefront-track-order-modal.png");
    await page.screenshot({ path: trackModalImgPath, fullPage: false });
    console.log("✅ Saved 09-storefront-track-order-modal.png");

    fs.copyFileSync(trackModalImgPath, path.join(ARTIFACT_DIR, "09-storefront-track-order-modal.png"));

    console.log("🎉 All storefront courier and tracking screenshots successfully captured!");
  } catch (err) {
    console.error("❌ Error during test capture:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
