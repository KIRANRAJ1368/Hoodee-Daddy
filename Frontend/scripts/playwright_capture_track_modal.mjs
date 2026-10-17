import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Kalaiyarasi\\.gemini\\antigravity\\brain\\9d394afc-c95b-46b3-ad03-c609aca7d196";
const LOCAL_SCREENSHOT_DIR = "k:\\ZMW\\Frontend\\screenshots-verified";

async function run() {
  console.log("🚀 Starting Playwright capture for Track Order Modal with correct email...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1
  });

  try {
    console.log("🌐 Navigating to homepage...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

    console.log("🔍 Clicking footer 'Track My Order' button...");
    const footerTrackBtn = page.locator('footer button:has-text("Track My Order"), .site-footer button:has-text("Track My Order")').first();
    await footerTrackBtn.scrollIntoViewIfNeeded();
    await footerTrackBtn.click();

    console.log("⏳ Waiting for .order-track-container...");
    await page.waitForSelector(".order-track-container", { state: "visible", timeout: 8000 });

    console.log("📝 Filling Order Number and verified seed Email (pooja.hegde@example.com)...");
    await page.fill("#orderId", "ZMW-PW-T2-MV225RDH");
    await page.fill("#trackEmail", "pooja.hegde@example.com");
    await page.click('button:has-text("Search Order Status")');

    console.log("⏳ Waiting for tracking results card...");
    await page.waitForSelector(".tracking-results-card", { state: "visible", timeout: 8000 });
    await page.waitForTimeout(1000);

    const trackModalImgPath = path.join(LOCAL_SCREENSHOT_DIR, "09-storefront-track-order-modal.png");
    await page.screenshot({ path: trackModalImgPath, fullPage: false });
    console.log("✅ Saved 09-storefront-track-order-modal.png");

    fs.copyFileSync(trackModalImgPath, path.join(ARTIFACT_DIR, "09-storefront-track-order-modal.png"));
    console.log("🎉 Successfully copied 09-storefront-track-order-modal.png to artifact directory!");
  } catch (err) {
    console.error("❌ Error during test:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
