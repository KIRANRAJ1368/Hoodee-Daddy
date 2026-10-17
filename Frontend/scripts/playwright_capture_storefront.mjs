import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function run() {
  console.log("================================================================================");
  console.log("🚀 CAPTURING STOREFRONT (PORT 3000): HOMEPAGE, SHIPROCKET CHECKOUT & TRACK MODAL");
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. STOREFRONT HOMEPAGE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[1/3] Navigating to Storefront: http://localhost:3000/");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await saveScreenshot("07-storefront-homepage.png", false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CHECKOUT WITH SHIPROCKET COURIER SELECTION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[2/3] Setting up cart & navigating to Checkout...");
  // Inject item into localStorage so cart is populated
  await page.evaluate(() => {
    const testItem = {
      id: 1,
      name: "Printed Round Neck T-Shirt - Jet Black & Off White",
      price: 1249,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
      sku: "ZMW-PW-01",
      quantity: 1,
      size: "M",
      color: "Jet Black"
    };
    localStorage.setItem("zmw_cart", JSON.stringify([testItem]));
  });

  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Complete Step 1 (Contact Info)
  console.log("Filling Step 1 Contact Info...");
  await page.fill("#email", "rahul.sharma@example.com");
  await page.fill("#phone", "9876543210");
  await page.click("button:has-text('CONTINUE TO DELIVERY')");
  await page.waitForTimeout(800);

  // Complete Step 2 (Delivery Address & PIN Code)
  console.log("Filling Step 2 Delivery Address & PIN code 641016...");
  await page.fill("#fullName", "Rahul Sharma");
  await page.fill("#address", "740 Park Avenue, Apt 14B, Peelamedu");
  await page.fill("#postalCode", "641016");
  await page.waitForTimeout(2000); // Wait for Shiprocket serviceability rates to calculate

  await saveScreenshot("08-storefront-checkout-shiprocket.png", true);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. STOREFRONT TRACK ORDER MODAL & CANCELLATION REQUEST POPUP
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n[3/3] Opening Storefront Track Order modal for active order...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Open modal via footer or navbar or window dispatch
  await page.evaluate(() => {
    // If shop context modal is reachable
    const trackBtn = Array.from(document.querySelectorAll("button, a")).find((el) =>
      el.textContent.includes("Track Order")
    );
    if (trackBtn) trackBtn.click();
  });
  await page.waitForTimeout(1000);

  // If modal opened, search for seeded order
  const orderInput = await page.locator(".order-track-input, input[placeholder*='Order' i], input[placeholder*='ZMW' i]").first();
  if (await orderInput.count() > 0) {
    console.log("Searching for order ZMW-PW-T2-MV225RDH in track modal...");
    await orderInput.fill("ZMW-PW-T2-MV225RDH");
    const trackSubmitBtn = await page.locator("button:has-text('TRACK'), button:has-text('Track Order')").first();
    if (await trackSubmitBtn.count() > 0) {
      await trackSubmitBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  await saveScreenshot("09-storefront-track-order-modal.png", false);

  await browser.close();

  console.log("\n================================================================================");
  console.log("🎉 STOREFRONT CAPTURES COMPLETED & COPIED TO ARTIFACT DIRECTORY!");
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("❌ CAPTURE ERROR:", err);
  process.exit(1);
});
