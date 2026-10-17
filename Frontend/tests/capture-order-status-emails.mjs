import { chromium } from "playwright";
import { createRequire } from "module";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const dotenv = require("../../Backend/node_modules/dotenv");
dotenv.config({ path: path.resolve("../Backend/.env") });
const mailer = require("../../Backend/src/utils/mailer.js");

const ARTIFACT_DIR = "C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196";

const sampleOrder = {
  id: 108,
  order_number: "ZMW-2026-8899",
  customer_name: "Kiran Raj",
  email: "kiranraj071845@gmail.com",
  phone: "+91 98765 43210",
  shipping_address: "74 Avinashi Luxury Avenue, Race Course",
  city: "Coimbatore",
  state: "Tamil Nadu",
  pincode: "641018",
  payment_method: "PREPAID",
  subtotal: 5998.00,
  discount_amount: 500.00,
  shipping_fee: 0.00,
  total: 5498.00,
  refund_upi_id: "kiranraj@oksbi",
  refund_amount: 5498.00,
  refund_utr_number: "UTR-AXIS-99220199",
  items: [
    {
      product_name_snapshot: "ZMW Heavyweight Oversized Hoodie (Noir)",
      size: "L",
      color: "Noir Black",
      quantity: 1,
      unit_price: 3499.00
    },
    {
      product_name_snapshot: "ZMW Tailored Supima Cotton T-Shirt",
      size: "M",
      color: "Alabaster White",
      quantity: 1,
      unit_price: 2499.00
    }
  ]
};

const emailCases = [
  {
    status: "confirmed",
    file: "25-email-order-confirmed.png",
    title: "Order Confirmed Email Notification",
    extra: {}
  },
  {
    status: "packed",
    file: "26-email-order-packed.png",
    title: "Order Packed & Boxed Email Notification",
    extra: {
      courier_name: "Blue Dart Express",
      awb_code: "BD-8899220011",
      estimated_delivery: "2–3 Business Days"
    }
  },
  {
    status: "shipped",
    file: "27-email-order-shipped.png",
    title: "Order Shipped & In-Transit Email Notification",
    extra: {
      courier_name: "Delhivery Air Express",
      awb_code: "DELHIVERY-9988224411",
      estimated_delivery: "Tomorrow by 6:00 PM"
    }
  },
  {
    status: "delivered",
    file: "28-email-order-delivered.png",
    title: "Order Delivered Email Notification",
    extra: {
      courier_name: "Delhivery Air Express",
      awb_code: "DELHIVERY-9988224411"
    }
  },
  {
    status: "cancelled",
    file: "29-email-order-cancelled.png",
    title: "Order Cancelled Email Notification",
    extra: {
      reason: "Customer requested cancellation before courier pickup",
      cancellation_type: "pre_pack"
    }
  },
  {
    status: "returned",
    file: "30-email-order-returned.png",
    title: "Return Verified & Restocked Email Notification",
    extra: {
      inspected_by: "Chief Atelier QC Inspector",
      reason: "Size replacement request"
    }
  }
];

async function capture() {
  console.log("================================================================================");
  console.log("📸 CAPTURING SCREENSHOTS FOR ALL ORDER STATUS EMAIL NOTIFICATIONS");
  console.log("================================================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 1200 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const previewDir = path.resolve("./tests/email-previews");
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir, { recursive: true });
  }

  for (const c of emailCases) {
    console.log(`\nRendering status email: [${c.status.toUpperCase()}] -> ${c.title}...`);
    const { html } = mailer.buildOrderStatusEmailHtml(sampleOrder, c.status, "pending", c.extra);

    const htmlPath = path.join(previewDir, `preview-${c.status}.html`);
    fs.writeFileSync(htmlPath, html, "utf8");

    await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`);
    await page.waitForTimeout(400);

    const screenshotPath = path.join(ARTIFACT_DIR, c.file);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Captured screenshot: ${c.file}`);
  }

  // Also capture the Admin Order Status management UI
  try {
    console.log("\nCapturing Admin Orders Management UI...");
    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "adminzmw@gmail.com", password: "Admin@2026" })
    });
    const loginJson = await loginRes.json();
    const token = loginJson?.data?.token;

    await page.goto("http://localhost:5174/login");
    if (token) {
      await page.evaluate((tok) => {
        localStorage.setItem("zmw_admin_token", tok);
      }, token);
    }
    await page.goto("http://localhost:5174/orders", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const adminOrdersPath = path.join(ARTIFACT_DIR, "31-admin-orders-status-management.png");
    await page.screenshot({ path: adminOrdersPath, fullPage: true });
    console.log("✓ Captured screenshot: 31-admin-orders-status-management.png");

    console.log("Capturing Admin Order Detail page (/orders/82)...");
    await page.goto("http://localhost:5174/orders/82", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const orderDetailPath = path.join(ARTIFACT_DIR, "32-admin-order-detail-status-controls.png");
    await page.screenshot({ path: orderDetailPath, fullPage: true });
    console.log("✓ Captured screenshot: 32-admin-order-detail-status-controls.png");
  } catch (err) {
    console.warn("Could not capture admin page screenshot:", err.message);
  }

  await browser.close();
  console.log("\n🎉 ALL STATUS EMAIL SCREENSHOTS GENERATED SUCCESSFULLY!");
}

capture().catch((err) => {
  console.error("FATAL ERROR in capturing screenshots:", err);
  process.exit(1);
});
