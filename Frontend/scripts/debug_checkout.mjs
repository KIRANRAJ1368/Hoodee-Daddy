import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/product/1", { waitUntil: "networkidle" });
  console.log("Product page loaded.");
  
  // Click BUY IT NOW
  const buyBtn = page.locator('button:has-text("BUY IT NOW")').first();
  await buyBtn.click();
  console.log("Clicked BUY IT NOW, waiting for navigation...");
  
  await page.waitForURL("**/checkout**", { timeout: 10000 });
  console.log("Navigated to:", page.url());
  
  await page.waitForTimeout(1000);
  const inputs = await page.$$eval("input", els => els.map(i => ({ id: i.id, name: i.name, type: i.type })));
  console.log("Inputs on Checkout:", inputs);
  
  await browser.close();
}

run();
