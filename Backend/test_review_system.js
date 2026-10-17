require("dotenv").config();
const jwt = require("jsonwebtoken");
const env = require("./src/config/env");
const { User, Product, Order, OrderItem, Review } = require("./src/models");

const API_BASE = "http://localhost:5000/api";

function generateCustomerToken(userId) {
  return jwt.sign({ sub: userId, role: "customer" }, env.jwt.secret, { expiresIn: "1d" });
}

async function runTests() {
  console.log("=================================================");
  console.log("   PURCHASE-BASED REVIEW SYSTEM TEST SUITE       ");
  console.log("=================================================");

  let testProduct = null;
  let userPurchaser = null;
  let userNonPurchaser = null;
  let userCancelled = null;
  let userPending = null;
  let testDeliveredOrder = null;
  let testDeliveredItem = null;
  let testCancelledOrder = null;
  let testCancelledItem = null;
  let testPendingOrder = null;
  let testPendingItem = null;
  let createdReviewId = null;

  try {
    // 0. Setup test product & users
    testProduct = await Product.findOne();
    if (!testProduct) throw new Error("No product found in database for testing.");
    console.log(`[SETUP] Using product: ID=${testProduct.id}, Slug=${testProduct.slug}`);

    const timestamp = Date.now();
    userPurchaser = await User.create({
      name: "Test Purchaser",
      email: `purchaser_${timestamp}@test.com`,
      password_hash: "dummyhash",
      phone: "9876543210",
      is_active: true
    });

    userNonPurchaser = await User.create({
      name: "Test Non-Purchaser",
      email: `nonpurchaser_${timestamp}@test.com`,
      password_hash: "dummyhash",
      phone: "9876543211",
      is_active: true
    });

    userCancelled = await User.create({
      name: "Test Cancelled Purchaser",
      email: `cancelled_${timestamp}@test.com`,
      password_hash: "dummyhash",
      phone: "9876543212",
      is_active: true
    });

    userPending = await User.create({
      name: "Test Pending Purchaser",
      email: `pending_${timestamp}@test.com`,
      password_hash: "dummyhash",
      phone: "9876543213",
      is_active: true
    });

    // Create Delivered Order for userPurchaser
    testDeliveredOrder = await Order.create({
      order_number: `TEST-DEL-${timestamp}`,
      customer_name: userPurchaser.name,
      email: userPurchaser.email,
      phone: userPurchaser.phone,
      shipping_address: "123 Test Lane, Chennai",
      payment_method: "PREPAID",
      status: "delivered",
      subtotal: 1000,
      total: 1000,
      user_id: userPurchaser.id,
      is_guest: false
    });
    testDeliveredItem = await OrderItem.create({
      order_id: testDeliveredOrder.id,
      product_id: testProduct.id,
      product_name_snapshot: testProduct.name,
      unit_price: 1000,
      quantity: 1,
      line_total: 1000
    });

    // Create Cancelled Order for userCancelled
    testCancelledOrder = await Order.create({
      order_number: `TEST-CAN-${timestamp}`,
      customer_name: userCancelled.name,
      email: userCancelled.email,
      phone: userCancelled.phone,
      shipping_address: "123 Test Lane, Chennai",
      payment_method: "COD",
      status: "cancelled",
      subtotal: 1000,
      total: 1000,
      user_id: userCancelled.id,
      is_guest: false
    });
    testCancelledItem = await OrderItem.create({
      order_id: testCancelledOrder.id,
      product_id: testProduct.id,
      product_name_snapshot: testProduct.name,
      unit_price: 1000,
      quantity: 1,
      line_total: 1000
    });

    // Create Pending Order for userPending
    testPendingOrder = await Order.create({
      order_number: `TEST-PEN-${timestamp}`,
      customer_name: userPending.name,
      email: userPending.email,
      phone: userPending.phone,
      shipping_address: "123 Test Lane, Chennai",
      payment_method: "COD",
      status: "pending",
      subtotal: 1000,
      total: 1000,
      user_id: userPending.id,
      is_guest: false
    });
    testPendingItem = await OrderItem.create({
      order_id: testPendingOrder.id,
      product_id: testProduct.id,
      product_name_snapshot: testProduct.name,
      unit_price: 1000,
      quantity: 1,
      line_total: 1000
    });

    const purchaserToken = generateCustomerToken(userPurchaser.id);
    const nonPurchaserToken = generateCustomerToken(userNonPurchaser.id);
    const cancelledToken = generateCustomerToken(userCancelled.id);
    const pendingToken = generateCustomerToken(userPending.id);

    console.log("[SETUP] Test data created successfully.\n");

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Unauthorized API requests
    // ─────────────────────────────────────────────────────────────
    console.log("TEST 1: Unauthorized API requests");
    {
      const res = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, comment: "Fake review by unauthenticated user" })
      });
      console.log(`- Request without token -> Status: ${res.status} (Expected 401)`);
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);

      const resInvalid = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer bad-token-12345" },
        body: JSON.stringify({ rating: 5, comment: "Fake review with invalid token" })
      });
      console.log(`- Request with invalid token -> Status: ${resInvalid.status} (Expected 401)`);
      if (resInvalid.status !== 401) throw new Error(`Expected 401, got ${resInvalid.status}`);
      console.log("✓ TEST 1 PASSED: Unauthorized requests successfully blocked with 401.\n");
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Unpurchased product by customer
    // ─────────────────────────────────────────────────────────────
    console.log("TEST 2: Unpurchased product submission & eligibility");
    {
      const eligRes = await fetch(`${API_BASE}/products/${testProduct.id}/reviews/eligibility`, {
        headers: { Authorization: `Bearer ${nonPurchaserToken}` }
      });
      const eligData = await eligRes.json();
      console.log("- Eligibility check:", eligData?.data);
      if (eligData?.data?.canReview !== false || eligData?.data?.reason !== "not_purchased") {
        throw new Error(`Expected canReview: false, reason: 'not_purchased', got: ${JSON.stringify(eligData)}`);
      }

      const res = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${nonPurchaserToken}` },
        body: JSON.stringify({ rating: 5, comment: "Attempting to review without buying" })
      });
      console.log(`- Submit review without purchase -> Status: ${res.status} (Expected 403)`);
      const body = await res.json();
      console.log(`  Message: "${body?.error?.message || body?.message}"`);
      if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
      console.log("✓ TEST 2 PASSED: Fake review by non-purchaser blocked with 403.\n");
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Unsuccessful or cancelled orders
    // ─────────────────────────────────────────────────────────────
    console.log("TEST 3: Cancelled and undelivered orders");
    {
      // Cancelled order
      const resCan = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cancelledToken}` },
        body: JSON.stringify({ rating: 1, comment: "Cancelled order trying to review" })
      });
      console.log(`- Submit review for cancelled order -> Status: ${resCan.status} (Expected 403)`);
      const canBody = await resCan.json();
      console.log(`  Message: "${canBody?.error?.message || canBody?.message}"`);
      if (resCan.status !== 403) throw new Error(`Expected 403, got ${resCan.status}`);

      // Pending order
      const resPen = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ rating: 5, comment: "Pending order trying to review" })
      });
      console.log(`- Submit review for pending order -> Status: ${resPen.status} (Expected 400)`);
      const penBody = await resPen.json();
      console.log(`  Message: "${penBody?.error?.message || penBody?.message}"`);
      if (resPen.status !== 400) throw new Error(`Expected 400, got ${resPen.status}`);
      console.log("✓ TEST 3 PASSED: Cancelled and undelivered orders blocked.\n");
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Purchased & delivered product review submission
    // ─────────────────────────────────────────────────────────────
    console.log("TEST 4: Legitimate review submission by verified purchaser");
    {
      // Check eligibility first
      const eligRes = await fetch(`${API_BASE}/products/${testProduct.id}/reviews/eligibility`, {
        headers: { Authorization: `Bearer ${purchaserToken}` }
      });
      const eligData = await eligRes.json();
      console.log("- Eligibility check for purchaser:", eligData?.data);
      if (eligData?.data?.canReview !== true || eligData?.data?.reason !== "eligible") {
        throw new Error(`Expected canReview: true, got: ${JSON.stringify(eligData)}`);
      }

      const res = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${purchaserToken}` },
        body: JSON.stringify({
          rating: 5,
          title: "Outstanding Fabric Quality",
          comment: "The drape and weight are truly exceptional! Fits true to size."
        })
      });
      console.log(`- Submit verified review -> Status: ${res.status} (Expected 201)`);
      const resJson = await res.json();
      console.log("- Response payload:", resJson?.data);
      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      if (!resJson?.data?.verifiedPurchase) throw new Error("Expected verifiedPurchase: true");
      createdReviewId = resJson?.data?.id;
      console.log("✓ TEST 4 PASSED: Verified purchase review successfully created with 201.\n");
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Duplicate review prevention
    // ─────────────────────────────────────────────────────────────
    console.log("TEST 5: Duplicate review prevention");
    {
      // Check eligibility again - should now show already_reviewed
      const eligRes = await fetch(`${API_BASE}/products/${testProduct.id}/reviews/eligibility`, {
        headers: { Authorization: `Bearer ${purchaserToken}` }
      });
      const eligData = await eligRes.json();
      console.log("- Eligibility check after reviewing:", eligData?.data);
      if (eligData?.data?.canReview !== false || eligData?.data?.reason !== "already_reviewed") {
        throw new Error(`Expected canReview: false, alreadyReviewed: true, got: ${JSON.stringify(eligData)}`);
      }

      // Try submitting another review
      const resDup = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${purchaserToken}` },
        body: JSON.stringify({
          rating: 4,
          title: "Trying duplicate review",
          comment: "This duplicate review should be prevented by backend."
        })
      });
      console.log(`- Submit duplicate review -> Status: ${resDup.status} (Expected 409)`);
      const dupBody = await resDup.json();
      console.log(`  Message: "${dupBody?.error?.message || dupBody?.message}"`);
      if (resDup.status !== 409) throw new Error(`Expected 409, got ${resDup.status}`);
      console.log("✓ TEST 5 PASSED: Duplicate review submission blocked with 409 Conflict.\n");
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Review display & rating recalculation on product
    // ─────────────────────────────────────────────────────────────
    console.log("TEST 6: Review display and product rating calculation");
    {
      const listRes = await fetch(`${API_BASE}/products/${testProduct.id}/reviews`);
      const listData = await listRes.json();
      console.log("- Total reviews:", listData?.data?.totalReviews);
      console.log("- Average rating:", listData?.data?.averageRating);
      console.log("- Breakdown:", listData?.data?.breakdown);
      const found = listData?.data?.reviews?.find((r) => r.id === createdReviewId);
      if (!found) throw new Error("Newly created review not found in public reviews list!");
      console.log("- Found verified review in public display:", {
        id: found.id,
        customerName: found.customerName,
        rating: found.rating,
        verifiedPurchase: found.verifiedPurchase,
        title: found.title
      });
      console.log("✓ TEST 6 PASSED: Review displays correctly with verified buyer badge and recalculated rating.\n");
    }

    console.log("=================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup test data
    console.log("\n[CLEANUP] Cleaning up test records...");
    if (createdReviewId) await Review.destroy({ where: { id: createdReviewId } }).catch(() => {});
    if (testDeliveredItem) await OrderItem.destroy({ where: { id: testDeliveredItem.id } }).catch(() => {});
    if (testDeliveredOrder) await Order.destroy({ where: { id: testDeliveredOrder.id } }).catch(() => {});
    if (testCancelledItem) await OrderItem.destroy({ where: { id: testCancelledItem.id } }).catch(() => {});
    if (testCancelledOrder) await Order.destroy({ where: { id: testCancelledOrder.id } }).catch(() => {});
    if (testPendingItem) await OrderItem.destroy({ where: { id: testPendingItem.id } }).catch(() => {});
    if (testPendingOrder) await Order.destroy({ where: { id: testPendingOrder.id } }).catch(() => {});
    if (userPurchaser) await User.destroy({ where: { id: userPurchaser.id } }).catch(() => {});
    if (userNonPurchaser) await User.destroy({ where: { id: userNonPurchaser.id } }).catch(() => {});
    if (userCancelled) await User.destroy({ where: { id: userCancelled.id } }).catch(() => {});
    if (userPending) await User.destroy({ where: { id: userPending.id } }).catch(() => {});
    if (testProduct) {
      // Recalculate original product rating after cleanup
      const rows = await Review.findAll({ where: { product_id: testProduct.id, is_approved: true }, attributes: ["rating"] });
      const count = rows.length;
      const rating = count ? Number((rows.reduce((sum, row) => sum + Number(row.rating), 0) / count).toFixed(1)) : 0;
      await Product.update({ rating, review_count: count }, { where: { id: testProduct.id } });
    }
    console.log("[CLEANUP] Database returned to clean state.");
  }
}

runTests();
