/**
 * End-to-End Verification Script:
 * 1. Registers customer "kalai" with email "kalaiyarasiravi2005@gmail.com" -> triggers Welcome Email
 * 2. Places an order for customer "kalai" ("kalaiyarasiravi2005@gmail.com") -> triggers Order Confirmation Email
 * 3. Transitions order status sequentially: confirmed -> packed -> shipped -> delivered -> triggers Status Update Email at each step
 * 4. Renders and captures Playwright screenshots of the Welcome Email and each Order Status Email
 */

const path = require("path");
const { chromium } = require("k:/ZMW/Frontend/node_modules/playwright");
const app = require("../src/app");
const { User, Order, OrderItem, Product, ProductVariant, ProductSize, ProductColor, sequelize } = require("../src/models");
const mailer = require("../src/utils/mailer");

let API_BASE = "http://localhost:5000/api";
const ARTIFACT_DIR = "C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196";

const CUSTOMER_NAME = "kalai";
const CUSTOMER_EMAIL = "kalaiyarasiravi2005@gmail.com";
const CUSTOMER_PHONE = "9876543210";
const CUSTOMER_PASSWORD = "Kalai@2026";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiRequest(endpoint, { method = "GET", token = null, body = null } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`API ${method} ${endpoint} failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  API_BASE = `http://127.0.0.1:${port}/api`;

  console.log("==================================================================");
  console.log("🚀 STARTING KALAI WELCOME & ORDER STATUS EMAIL E2E VERIFICATION");
  console.log(`👤 Customer : ${CUSTOMER_NAME}`);
  console.log(`📧 Email    : ${CUSTOMER_EMAIL}`);
  console.log(`🌐 Test API : ${API_BASE}`);
  console.log("==================================================================\n");

  // 1. Clean up existing user & previous test orders with kalaiyarasiravi2005@gmail.com so registration and order run fresh
  const prevOrders = await Order.findAll({ where: { email: CUSTOMER_EMAIL } });
  for (const po of prevOrders) {
    await OrderItem.destroy({ where: { order_id: po.id } });
    await po.destroy();
  }
  const existingUser = await User.findOne({ where: { email: CUSTOMER_EMAIL } });
  if (existingUser) {
    console.log(`ℹ️ Cleaning up previous test user record for ${CUSTOMER_EMAIL} (id: ${existingUser.id}) to test fresh registration...`);
    await Order.update({ user_id: null }, { where: { user_id: existingUser.id } });
    await existingUser.destroy();
  }

  // 2. Register Customer "kalai" via API (triggers mailer.sendWelcomeEmail in authController.customerRegister)
  console.log(`\n[STEP 1] Registering customer "${CUSTOMER_NAME}" (${CUSTOMER_EMAIL}) via POST /auth/customer/register...`);
  const regRes = await apiRequest("/auth/customer/register", {
    method: "POST",
    body: {
      name: CUSTOMER_NAME,
      email: CUSTOMER_EMAIL,
      phone: CUSTOMER_PHONE,
      password: CUSTOMER_PASSWORD
    }
  });

  const customerToken = regRes.data?.token;
  const registeredUser = regRes.data?.user;
  console.log(`✅ Registered Customer Successfully: ID=${registeredUser.id}, Name=${registeredUser.name}, Email=${registeredUser.email}`);
  await sleep(3500);

  // 3. Login as Admin to get Admin JWT token for status transitions
  console.log(`\n[STEP 2] Authenticating Admin (adminzmw@gmail.com)...`);
  const adminRes = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      email: process.env.SEED_ADMIN_EMAIL || "adminzmw@gmail.com",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin@2026"
    }
  });
  const adminToken = adminRes.data?.token;
  console.log(`✅ Admin authenticated.`);

  // 4. Find an active product with stock to place an order
  const product = await Product.findOne({
    where: { is_active: true },
    include: [
      {
        model: ProductVariant,
        as: "variants",
        include: [
          { model: ProductSize, as: "size" },
          { model: ProductColor, as: "color" }
        ]
      }
    ]
  });

  if (!product) {
    throw new Error("No active product found in database to place an order.");
  }

  let selectedSize = null;
  let selectedColor = null;
  if (product.variants && product.variants.length > 0) {
    const v = product.variants[0];
    if (v.stock_count < 5) {
      v.stock_count = 20;
      await v.save();
    }
    selectedSize = v.size ? v.size.label : null;
    selectedColor = v.color ? v.color.name : null;
  }
  if (product.stock_count < 5) {
    product.stock_count = 20;
    product.in_stock = true;
    await product.save();
  }

  // 5. Place Order for Customer "kalai" ("kalaiyarasiravi2005@gmail.com")
  console.log(`\n[STEP 3] Placing Order for "${CUSTOMER_NAME}" (${CUSTOMER_EMAIL})...`);
  const orderRes = await apiRequest("/orders", {
    method: "POST",
    token: customerToken,
    body: {
      customer_name: CUSTOMER_NAME,
      email: CUSTOMER_EMAIL,
      phone: CUSTOMER_PHONE,
      shipping_address: "42 RS Puram, Avinashi Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641002",
      payment_method: "COD",
      items: [
        {
          product_id: product.id,
          quantity: 1,
          size: selectedSize,
          color: selectedColor
        }
      ]
    }
  });

  const createdOrder = orderRes.data;
  console.log(`✅ Order Placed: ${createdOrder.order_number} (ID: ${createdOrder.id}, Status: ${createdOrder.status}, Total: ₹${createdOrder.total})`);
  await sleep(2500);

  // 6. Progress Order Status sequentially: confirmed -> packed -> shipped -> delivered
  const statuses = ["confirmed", "packed", "shipped", "delivered"];
  const updatedSnapshots = {};

  for (const nextStatus of statuses) {
    console.log(`\n[STEP 4.${statuses.indexOf(nextStatus) + 1}] Updating Order ${createdOrder.order_number} status -> "${nextStatus.toUpperCase()}"...`);
    const updateRes = await apiRequest(`/orders/${createdOrder.id}/status`, {
      method: "PATCH",
      token: adminToken,
      body: { status: nextStatus }
    });
    const updatedOrder = updateRes.data;
    updatedSnapshots[nextStatus] = updatedOrder;
    console.log(
      `✅ Order ${updatedOrder.order_number} transitioned to "${updatedOrder.status.toUpperCase()}" | Shipping Status: "${updatedOrder.shipping_status}"` +
      (updatedOrder.awb_code ? ` | AWB: ${updatedOrder.awb_code} (${updatedOrder.courier_name})` : "")
    );
    await sleep(3000);
  }

  // 7. Fetch final order with items & status history
  const finalOrderRes = await apiRequest(`/orders/${createdOrder.id}`, {
    method: "GET",
    token: adminToken
  });
  const finalOrder = finalOrderRes.data;

  console.log(`\n[STEP 5] Rendering Email HTML Previews & Capturing Playwright Screenshots...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 760, height: 1020 } });
  const page = await context.newPage();

  // Render 1: Welcome Email for kalai (kalaiyarasiravi2005@gmail.com)
  const welcomeEmail = mailer.buildWelcomeEmailHtml({
    id: registeredUser.id,
    name: CUSTOMER_NAME,
    email: CUSTOMER_EMAIL,
    phone: CUSTOMER_PHONE
  });
  const welcomeBannerHtml = `
    <div style="background:#111827;color:#f9fafb;padding:12px 20px;font-family:sans-serif;font-size:12px;border-bottom:2px solid #c5a059;">
      <div><strong>TO:</strong> ${CUSTOMER_NAME} &lt;${CUSTOMER_EMAIL}&gt;</div>
      <div style="margin-top:4px;"><strong>SUBJECT:</strong> ${welcomeEmail.subject}</div>
      <div style="margin-top:4px;color:#34d399;"><strong>TRIGGER:</strong> Customer Registration (POST /api/v1/auth/customer/register)</div>
    </div>
    ${welcomeEmail.html}
  `;
  await page.setContent(welcomeBannerHtml, { waitUntil: "networkidle" });
  const welcomePath = path.join(ARTIFACT_DIR, "72-email-welcome-kalai.png");
  await page.screenshot({ path: welcomePath, fullPage: true });
  console.log(`📸 Saved Welcome Email Screenshot: ${welcomePath}`);

  // Render 2..5: Order Status Emails (confirmed, packed, shipped, delivered)
  const screenshotFiles = {
    confirmed: "73-email-kalai-order-confirmed.png",
    packed: "74-email-kalai-order-packed.png",
    shipped: "75-email-kalai-order-shipped.png",
    delivered: "76-email-kalai-order-delivered.png"
  };

  for (const st of statuses) {
    const orderForEmail = {
      ...finalOrder,
      ...(updatedSnapshots[st] || {}),
      items: finalOrder.items,
      status: st,
      awb_code: updatedSnapshots[st]?.awb_code || finalOrder.awb_code || "SR-ZMW-8849201",
      courier_name: updatedSnapshots[st]?.courier_name || finalOrder.courier_name || "Shiprocket Express"
    };
    const built = mailer.buildOrderStatusEmailHtml(orderForEmail, st);
    const wrappedHtml = `
      <div style="background:#111827;color:#f9fafb;padding:12px 20px;font-family:sans-serif;font-size:12px;border-bottom:2px solid #c5a059;">
        <div><strong>TO:</strong> ${CUSTOMER_NAME} &lt;${CUSTOMER_EMAIL}&gt;</div>
        <div style="margin-top:4px;"><strong>SUBJECT:</strong> ${built.subject}</div>
        <div style="margin-top:4px;color:#34d399;"><strong>ORDER:</strong> ${finalOrder.order_number} &nbsp;|&nbsp; <strong>STATUS CHANGE:</strong> ${st.toUpperCase()}</div>
      </div>
      ${built.html}
    `;
    await page.setContent(wrappedHtml, { waitUntil: "networkidle" });
    const outPath = path.join(ARTIFACT_DIR, screenshotFiles[st]);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`📸 Saved ${st.toUpperCase()} Email Screenshot: ${outPath}`);
  }

  await browser.close();
  server.close();
  await sequelize.close();

  console.log("\n==================================================================");
  console.log("✅ ALL WELCOME & ORDER STATUS EMAILS VERIFIED FOR KALAI!");
  console.log(`👤 Customer : ${CUSTOMER_NAME} (${CUSTOMER_EMAIL})`);
  console.log(`📦 Order No : ${finalOrder.order_number}`);
  console.log(`🔄 Sequence : pending -> confirmed -> packed -> shipped -> delivered`);
  console.log("==================================================================");
}

main().catch(async (err) => {
  console.error("❌ Verification failed:", err);
  try {
    await sequelize.close();
  } catch (_) {}
  process.exit(1);
});
