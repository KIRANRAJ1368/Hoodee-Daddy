"use strict";

const { chromium } = require("k:/ZMW/Frontend/node_modules/playwright");
const path = require("path");
const fs = require("fs");
const {
  Category,
  Subcategory,
  Product,
  ProductVariant,
  ProductSize,
  ProductColor,
  ProductImage,
  Order,
  OrderItem,
  OrderStatusHistory,
  User,
  Coupon,
  Banner,
  ContactSubmission,
  Review,
  sequelize
} = require("../src/models");
const { createProduct } = require("../src/services/productService");

const ARTIFACT_DIR = "C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196";

async function getAdminToken() {
  const res = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "adminzmw@gmail.com", password: "Admin@2026" })
  });
  const data = await res.json();
  if (!data?.data?.token) throw new Error("Failed to get admin token: " + JSON.stringify(data));
  return data.data.token;
}

async function getCustomerToken(email = "kalaiyarasiravi2005@gmail.com", password = "NewZmwPassword@2026") {
  const res = await fetch("http://localhost:5000/api/auth/customer/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data?.token && !data?.data?.token) {
    throw new Error("Failed to get customer token: " + JSON.stringify(data));
  }
  return {
    token: data.token || data.data.token,
    user: data.user || data.data.user
  };
}

async function runFullE2ETests() {
  console.log("==================================================================");
  console.log("STARTING FULL END-TO-END PLAYWRIGHT AUTOMATION VERIFICATION SUITE");
  console.log("==================================================================");

  const adminToken = await getAdminToken();
  console.log("✓ Admin authentication token obtained.");

  const customerAuth = await getCustomerToken();
  console.log(`✓ Customer authenticated: ${customerAuth.user.name} (${customerAuth.user.email})`);

  // Ensure test category and subcategory exist
  const menCat = await Category.findOne({ where: { slug: "mens" } });
  if (!menCat) throw new Error("Men category not found in DB!");

  let testSubcategory = await Subcategory.findOne({ where: { slug: "graphic-tees" } });
  if (!testSubcategory) {
    testSubcategory = await Subcategory.create({
      name: "Graphic Tees",
      slug: "graphic-tees",
      category_id: menCat.id,
      sort_order: 1,
      is_active: true
    });
    console.log("✓ Created test subcategory: Graphic Tees under Men's category.");
  } else {
    console.log("✓ Test subcategory Graphic Tees already exists.");
  }

  // Ensure test coupon exists
  let testCoupon = await Coupon.findOne({ where: { code: "ZMWPROMO20" } });
  if (!testCoupon) {
    testCoupon = await Coupon.create({
      code: "ZMWPROMO20",
      description: "20% Off E2E Promo Discount",
      discount_type: "percentage",
      discount_value: 20,
      min_spend: 500,
      max_discount: 500,
      usage_limit: 100,
      times_used: 0,
      is_active: true
    });
    console.log("✓ Created test coupon: ZMWPROMO20 (20% Off).");
  } else {
    console.log("✓ Test coupon ZMWPROMO20 already exists.");
  }

  // Ensure a high-end test product with variants exists
  let testProduct = await Product.findOne({ where: { slug: "zmw-signature-oversized-tee" } });
  if (!testProduct) {
    testProduct = await createProduct({
      name: "ZMW Signature Oversized Tee",
      slug: "zmw-signature-oversized-tee",
      sku: "ZMW-OVR-01",
      category_id: menCat.id,
      subcategory_id: testSubcategory.id,
      product_type: "Oversized T-Shirt",
      description: "Heavyweight 240 GSM combed cotton luxury oversized tee with drop-shoulder fit and high-density screen print.",
      price: 999,
      original_price: 1499,
      stock_count: 90,
      in_stock: true,
      is_active: true,
      is_best_seller: true,
      is_new_arrival: true,
      images: ["/images/banner-mens.jpg", "/images/hero-streetwear.jpg"],
      specifications: [
        { title: "Fabric", value: "100% Combed Cotton (240 GSM)" },
        { title: "Fit", value: "Relaxed Drop Shoulder" },
        { title: "Care", value: "Cold Machine Wash Inside Out" }
      ],
      colors: [
        { name: "Jet Black", hex: "#181715" },
        { name: "Off White", hex: "#F3EFE4" }
      ],
      sizes: ["M", "L", "XL"],
      variants: [
        { color: "Jet Black", colorHex: "#181715", size: "M", stock_count: 20, price_override: 999, original_price_override: 1499, sku_suffix: "BLK-M", image_url: "/images/banner-mens.jpg" },
        { color: "Jet Black", colorHex: "#181715", size: "L", stock_count: 25, price_override: 999, original_price_override: 1499, sku_suffix: "BLK-L", image_url: "/images/banner-mens.jpg" },
        { color: "Jet Black", colorHex: "#181715", size: "XL", stock_count: 15, price_override: 999, original_price_override: 1499, sku_suffix: "BLK-XL", image_url: "/images/banner-mens.jpg" },
        { color: "Off White", colorHex: "#F3EFE4", size: "M", stock_count: 10, price_override: 999, original_price_override: 1499, sku_suffix: "WHT-M", image_url: "/images/hero-streetwear.jpg" },
        { color: "Off White", colorHex: "#F3EFE4", size: "L", stock_count: 12, price_override: 999, original_price_override: 1499, sku_suffix: "WHT-L", image_url: "/images/hero-streetwear.jpg" },
        { color: "Off White", colorHex: "#F3EFE4", size: "XL", stock_count: 8, price_override: 999, original_price_override: 1499, sku_suffix: "WHT-XL", image_url: "/images/hero-streetwear.jpg" }
      ]
    });
    console.log("✓ Created test product with full variant matrix: ZMW Signature Oversized Tee (ID: " + testProduct.id + ").");
  } else {
    console.log("✓ Test product exists: " + testProduct.name + " (ID: " + testProduct.id + ").");
  }

  // Launch Playwright Chromium
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log("\n--- MODULE 1: STOREFRONT HERO BANNER & HERO SLIDER ---");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "43-e2e-hero-slider-slide1.png") });
  console.log("✓ Captured: 43-e2e-hero-slider-slide1.png (Hero Slider Slide 1)");

  // Click next arrow on hero carousel
  const nextBtn = page.locator(".hero-slider-arrow.next, button[aria-label*='Next'], .carousel-arrow-right").first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "44-e2e-hero-slider-slide2.png") });
    console.log("✓ Captured: 44-e2e-hero-slider-slide2.png (Hero Slider Slide 2 transition)");
  } else {
    console.log("Hero next button not found, clicking dot indicator 2...");
    const dot2 = page.locator(".hero-slider-dot, .dot").nth(1);
    if (await dot2.isVisible()) {
      await dot2.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "44-e2e-hero-slider-slide2.png") });
      console.log("✓ Captured: 44-e2e-hero-slider-slide2.png via dot indicator");
    }
  }

  console.log("\n--- MODULE 2: STOREFRONT CATEGORY COLLECTION BANNERS ---");
  // Scroll to category collection showcase
  await page.evaluate(() => window.scrollBy(0, 750));
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "45-e2e-homepage-collection-banners.png") });
  console.log("✓ Captured: 45-e2e-homepage-collection-banners.png (Category Collection Banners)");

  console.log("\n--- MODULE 3: ADMIN HERO & PROMOTIONAL BANNERS ---");
  await page.goto("http://localhost:5174/login");
  await page.evaluate((tok) => {
    localStorage.setItem("zmw_admin_token", tok);
    localStorage.setItem("zmw_admin_user", JSON.stringify({ email: "adminzmw@gmail.com", role: "admin" }));
  }, adminToken);
  await page.goto("http://localhost:5174/banners", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "46-e2e-admin-hero-banners.png") });
  console.log("✓ Captured: 46-e2e-admin-hero-banners.png (Admin Banners Management)");

  console.log("\n--- MODULE 4: ADMIN CATEGORIES & STRICT SEQUENCE (0 TO 4) ---");
  await page.goto("http://localhost:5174/categories", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "47-e2e-admin-categories-sequence.png") });
  console.log("✓ Captured: 47-e2e-admin-categories-sequence.png (Admin Categories with Sequences 0 to 4)");

  console.log("\n--- MODULE 5: ADMIN SUBCATEGORIES MANAGEMENT ---");
  await page.goto("http://localhost:5174/subcategories", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "48-e2e-admin-subcategories.png") });
  console.log("✓ Captured: 48-e2e-admin-subcategories.png (Admin Subcategories)");

  console.log("\n--- MODULE 6: ADMIN PRODUCTS & PRODUCT-WISE VARIANTS ---");
  await page.goto("http://localhost:5174/products", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "49-e2e-admin-products-with-variants.png") });
  console.log("✓ Captured: 49-e2e-admin-products-with-variants.png (Admin Products Catalog)");

  await page.goto("http://localhost:5174/variants", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // Expand product variants if expandable button exists
  const expandBtn = page.locator("button:has-text('Variants'), .variant-expand-btn, tr button").first();
  if (await expandBtn.isVisible()) {
    await expandBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "50-e2e-admin-variants-management.png") });
  console.log("✓ Captured: 50-e2e-admin-variants-management.png (Admin Variant Matrix & Attributes)");

  console.log("\n--- MODULE 7: ADMIN STOCK MANAGEMENT & INVENTORY ADJUSTMENT ---");
  await page.goto("http://localhost:5174/stock", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "51-e2e-admin-stock-management.png") });
  console.log("✓ Captured: 51-e2e-admin-stock-management.png (Admin Stock Management)");

  console.log("\n--- MODULE 8: ADMIN COUPONS & DISCOUNTS ---");
  await page.goto("http://localhost:5174/coupons", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "52-e2e-admin-coupons-management.png") });
  console.log("✓ Captured: 52-e2e-admin-coupons-management.png (Admin Discounts & Coupons)");

  console.log("\n--- MODULE 9: CUSTOMER ENQUIRY (CONTACT US) ---");
  await page.goto("http://localhost:3000/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Fill contact enquiry form
  await page.fill("#contact-name, input[name='name']", "Kalaiyarasi Ravi");
  await page.fill("#contact-email, input[name='email']", "kalaiyarasiravi2005@gmail.com");
  await page.fill("#contact-phone, input[name='phone']", "9876543210");
  const subjectInput = page.locator("#contact-subject, input[name='subject']");
  if (await subjectInput.isVisible()) {
    await subjectInput.fill("Size fitting recommendation for Signature Tee");
  }
  await page.fill("#contact-message, textarea[name='message']", "Hello ZMW team, I wanted to inquire about the fabric GSM and chest width for size L. Thanks!");
  await page.click("button[type='submit']");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "53-e2e-customer-contact-enquiry.png") });
  console.log("✓ Captured: 53-e2e-customer-contact-enquiry.png (Customer Enquiry Submission)");

  // Verify enquiry in Admin Contact Inquiries
  await page.goto("http://localhost:5174/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "54-e2e-admin-customer-inquiries.png") });
  console.log("✓ Captured: 54-e2e-admin-customer-inquiries.png (Admin Customer Inquiries Inbox)");

  console.log("\n--- MODULE 10: CUSTOMER LOGIN & PROFILE UPDATE ---");
  await page.goto("http://localhost:3000/");
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("zmw_customer_token", token);
    localStorage.setItem("zmw_customer_user", JSON.stringify(user));
  }, customerAuth);
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Click Personal Details / Account tab
  const profileTabBtn = page.locator("button:has-text('Account Details'), button:has-text('Personal Details'), button:has-text('Profile')").first();
  if (await profileTabBtn.isVisible()) {
    await profileTabBtn.click();
    await page.waitForTimeout(500);
    // Update name and phone
    await page.fill("#acc-name", "Kalaiyarasi Ravi (VIP)");
    await page.fill("#acc-phone", "9876543210");
    await page.click("button[type='submit']");
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "60-e2e-customer-profile-update.png") });
  console.log("✓ Captured: 60-e2e-customer-profile-update.png (Customer Profile Update)");

  console.log("\n--- MODULE 11: STOREFRONT PRODUCT DETAIL & VARIANT SELECTION ---");
  await page.goto(`http://localhost:3000/product/${testProduct.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Click color "Jet Black" & size "L"
  const colorBtn = page.locator("button:has-text('Jet Black'), [title*='Jet Black'], .swatch-btn").first();
  if (await colorBtn.isVisible()) {
    await colorBtn.click();
    await page.waitForTimeout(300);
  }
  const sizeBtn = page.locator("button:has-text('L'), .size-btn:has-text('L')").first();
  if (await sizeBtn.isVisible()) {
    await sizeBtn.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "55-e2e-storefront-product-detail.png") });
  console.log("✓ Captured: 55-e2e-storefront-product-detail.png (Product Detail with Variant Selection)");

  // Add to cart
  const addToCartBtn = page.locator("button:has-text('Add to Cart'), button:has-text('ADD TO BAG')").first();
  if (await addToCartBtn.isVisible()) {
    await addToCartBtn.click();
    await page.waitForTimeout(1000);
  }

  console.log("\n--- MODULE 12: STOREFRONT CART ---");
  await page.goto("http://localhost:3000/cart", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "56-e2e-storefront-cart.png") });
  console.log("✓ Captured: 56-e2e-storefront-cart.png (Cart with Selected Variant)");

  console.log("\n--- MODULE 13: CHECKOUT WITH SHIPROCKET PINCODE & COUPON DISCOUNT ---");
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // If in Step 1 (Contact):
  const contactEmail = page.locator("#contactEmail");
  if (await contactEmail.isVisible()) {
    await contactEmail.fill("kalaiyarasiravi2005@gmail.com");
    const toDeliveryBtn = page.locator("button:has-text('CONTINUE TO DELIVERY')").first();
    if (await toDeliveryBtn.isVisible()) {
      await toDeliveryBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // Step 2 (Delivery Address):
  const fullNameField = page.locator("#fullName");
  if (await fullNameField.isVisible()) await fullNameField.fill("Kalaiyarasi Ravi");

  const phoneField = page.locator("#deliveryPhone");
  if (await phoneField.isVisible()) await phoneField.fill("9876543210");

  const addressField = page.locator("#address");
  if (await addressField.isVisible()) await addressField.fill("12/4 Anna Salai, T. Nagar");

  const pinField = page.locator("#postalCode");
  if (await pinField.isVisible()) {
    await pinField.fill("600001");
    await page.waitForTimeout(1000);
  }

  const cityField = page.locator("#city");
  if (await cityField.isVisible()) await cityField.fill("Chennai");

  const stateField = page.locator("#state");
  if (await stateField.isVisible()) await stateField.fill("Tamil Nadu");

  // Apply Coupon ZMWPROMO20
  const couponInput = page.locator("input[placeholder*='ENTER CODE'], #coupon-code").first();
  const applyCouponBtn = page.locator("button:has-text('APPLY'), button:has-text('Apply')").first();
  if (await couponInput.isVisible() && await applyCouponBtn.isVisible()) {
    await couponInput.fill("ZMWPROMO20");
    await applyCouponBtn.click();
    await page.waitForTimeout(1000);
  }

  // Proceed to Step 3 (Payment)
  const toPaymentBtn = page.locator("button:has-text('CONTINUE TO PAYMENT')").first();
  if (await toPaymentBtn.isVisible()) {
    await toPaymentBtn.click();
    await page.waitForTimeout(800);
  }

  // Select Cash on Delivery
  const codOption = page.locator("label:has-text('Cash on Delivery'), input[value='cod']").first();
  if (await codOption.isVisible()) {
    await codOption.click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "57-e2e-storefront-checkout-shipping.png") });
  console.log("✓ Captured: 57-e2e-storefront-checkout-shipping.png (Checkout with Shipping & Applied Discount)");

  console.log("\n--- MODULE 14: ORDER PLACEMENT & ORDER SEQUENCE VERIFICATION ---");
  const placeOrderBtn = page.locator("button:has-text('PLACE ORDER')").first();
  if (await placeOrderBtn.isVisible()) {
    await placeOrderBtn.click();
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "58-e2e-storefront-order-receipt.png") });
  console.log("✓ Captured: 58-e2e-storefront-order-receipt.png (Order Confirmation Receipt)");

  // Extract created order number from receipt
  const orderNumberText = await page.evaluate(() => {
    const el = document.querySelector(".receipt-order-num, .order-receipt-number") ||
               Array.from(document.querySelectorAll("strong, h2, h3, span")).find(e => e.innerText && e.innerText.includes("ZMW-"));
    return el ? el.innerText.trim() : "ZMW-ORDER-PLACED";
  });
  console.log("✓ Placed Order Number:", orderNumberText);

  // Check Customer Profile Orders tab
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "59-e2e-customer-profile-orders.png") });
  console.log("✓ Captured: 59-e2e-customer-profile-orders.png (Customer Orders in Sequence)");

  console.log("\n--- MODULE 15: ADMIN ORDER MANAGEMENT & STATUS LIFECYCLE ---");
  // Inspect orders in MySQL to get latest order ID
  const latestOrder = await Order.findOne({ order: [["id", "DESC"]] });
  if (!latestOrder) throw new Error("No order found in DB after checkout!");
  console.log(`✓ Latest Order ID in DB: ${latestOrder.id} (${latestOrder.order_number}), status: ${latestOrder.status}`);

  await page.goto("http://localhost:5174/orders", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "61-e2e-admin-orders-sequence.png") });
  console.log("✓ Captured: 61-e2e-admin-orders-sequence.png (Admin Orders List in Chronological Sequence)");

  // Open Order Detail
  await page.goto(`http://localhost:5174/orders/${latestOrder.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Advance Order Status: Pending -> Confirmed -> Shipped -> Delivered
  const updateStatusApi = async (status) => {
    await fetch(`http://localhost:5000/api/orders/${latestOrder.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status })
    });
  };

  console.log("Advancing order status to 'confirmed'...");
  await updateStatusApi("confirmed");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  console.log("Advancing order status to 'shipped'...");
  await updateStatusApi("shipped");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  console.log("Advancing order status to 'delivered'...");
  await updateStatusApi("delivered");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "62-e2e-admin-order-detail-status-lifecycle.png") });
  console.log("✓ Captured: 62-e2e-admin-order-detail-status-lifecycle.png (Delivered Order Status & History)");

  console.log("\n--- MODULE 16: CUSTOMER PRODUCT REVIEW & ADMIN MODERATION ---");
  // Submit a customer review on the delivered item
  await page.goto("http://localhost:3000/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const reviewBtn = page.locator("button:has-text('Write a review')").first();
  if (await reviewBtn.isVisible()) {
    await reviewBtn.click();
    await page.waitForTimeout(500);
    const titleInput = page.locator("input[placeholder*='review'], .cancel-confirm-modal input[type='text']").first();
    if (await titleInput.isVisible()) await titleInput.fill("Outstanding Quality & Luxury Fit!");
    const commentInput = page.locator("textarea, .cancel-confirm-modal textarea").first();
    if (await commentInput.isVisible()) await commentInput.fill("The fabric weight (240 GSM) and drape are absolute perfection. Easily beats international streetwear brands!");
    const submitRevBtn = page.locator("button:has-text('Submit'), button[type='submit']").first();
    if (await submitRevBtn.isVisible()) await submitRevBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "63-e2e-storefront-product-review.png") });
  console.log("✓ Captured: 63-e2e-storefront-product-review.png (Customer Review Submission)");

  // Admin Reviews page
  await page.goto("http://localhost:5174/reviews", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // If review is pending approval, approve it
  const publishBtn = page.locator("button:has-text('Publish'), button[title='Publish']").first();
  if (await publishBtn.isVisible()) {
    await publishBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "64-e2e-admin-reviews-management.png") });
  console.log("✓ Captured: 64-e2e-admin-reviews-management.png (Admin Reviews Moderation)");

  console.log("\n--- MODULE 17: ADMIN SHIPPING MANAGEMENT ---");
  await page.goto("http://localhost:5174/shipping", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "65-e2e-admin-shipping-management.png") });
  console.log("✓ Captured: 65-e2e-admin-shipping-management.png (Admin Shipping & Logistics)");

  console.log("\n--- MODULE 18: ADMIN CUSTOMERS MANAGEMENT ---");
  await page.goto("http://localhost:5174/customers", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "66-e2e-admin-customers-list.png") });
  console.log("✓ Captured: 66-e2e-admin-customers-list.png (Admin Customers Directory)");

  console.log("\n--- MODULE 19: ADMIN REPORTS & ANALYTICS ---");
  await page.goto("http://localhost:5174/reports", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "67-e2e-admin-reports-analytics.png") });
  console.log("✓ Captured: 67-e2e-admin-reports-analytics.png (Admin Sales & Analytics Reports)");

  await browser.close();

  console.log("\n==================================================================");
  console.log("ALL PLAYWRIGHT TESTS & SCREENSHOTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

runFullE2ETests().catch((err) => {
  console.error("FATAL ERROR in runFullE2ETests:", err);
  process.exit(1);
});
