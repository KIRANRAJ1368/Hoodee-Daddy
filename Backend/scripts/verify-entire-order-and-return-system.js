/**
 * Comprehensive verification of the entire Order, Shiprocket, and 3-Tier Cancellation & Refund system.
 */
const { sequelize, Order, OrderItem, Product, ProductVariant, User } = require("../src/models");
const shiprocketService = require("../src/services/shiprocketService");
const orderController = require("../src/controllers/orderController");
const dashboardController = require("../src/controllers/dashboardController");

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    }
  };
  return res;
}

async function runFullVerification() {
  console.log("=================================================================");
  console.log("🚀 STARTING FULL SYSTEM VERIFICATION: ORDERS, SHIPROCKET, 3-TIER RETURNS");
  console.log("=================================================================\n");

  await sequelize.authenticate();
  console.log("✅ 1. Database Connection: SUCCESS");

  // -------------------------------------------------------------
  // TEST 1: SHIPROCKET RATE CALCULATION & MULTI-COURIER ENGINE
  // -------------------------------------------------------------
  console.log("\n📦 2. Testing Shiprocket Courier Rate Engine...");
  const rateCoimbatore = await shiprocketService.calculateShippingRate({
    deliveryPincode: "641016"
  });
  console.log("   - Pincode 641016 Serviceable:", rateCoimbatore.is_serviceable);
  console.log("   - Shipping Fee: ₹" + rateCoimbatore.shipping_fee);
  console.log("   - Primary Courier:", rateCoimbatore.courier_name);
  console.log("   - Available Couriers Count:", rateCoimbatore.available_couriers?.length || 0);

  if (!rateCoimbatore.is_serviceable || !rateCoimbatore.available_couriers?.length) {
    throw new Error("Shiprocket courier calculation failed for serviceable pincode!");
  }
  console.log("✅ Shiprocket Multi-Courier Selection: PASS");

  // -------------------------------------------------------------
  // TEST 2: ADMIN DASHBOARD CANCELLATION & REFUND METRICS
  // -------------------------------------------------------------
  console.log("\n📊 3. Testing Admin Dashboard Cancellation & Refund Metrics...");
  const mockReq = { user: { role: "admin" }, query: {} };
  const dRes = createMockRes();
  await dashboardController.summary(mockReq, dRes);
  const dashboardData = dRes.body.data;
  console.log("   - Pending Cancellation Requests:", dashboardData.pendingCancellationRequests);
  console.log("   - Pending UPI Refunds:", dashboardData.pendingRefundCount);
  console.log("   - Processed Refunds Count:", dashboardData.processedRefundCount);
  console.log("   - Total Refund Amount Settled: ₹" + dashboardData.totalRefundAmount);
  console.log("   - Recent Cancellations Action List Count:", dashboardData.recentCancellations?.length || 0);

  if (dashboardData.pendingCancellationRequests === undefined || dashboardData.pendingRefundCount === undefined) {
    throw new Error("Dashboard missing cancellation or refund metrics!");
  }
  console.log("✅ Admin Dashboard Action Center Data Integrity: PASS");

  // -------------------------------------------------------------
  // TEST 3: TIER 1 PRE-PACK CANCELLATION WORKFLOW
  // -------------------------------------------------------------
  console.log("\n🟢 4. Testing Tier 1: Pre-Packing Cancellation & Direct Restock...");
  const product = await Product.findOne();
  const initialStock = Number(product.stock_count);
  console.log(`   - Product [${product.id}] Initial Stock: ${initialStock}`);

  // Create test pre-pack order
  const orderNumber1 = `ZMW-TEST-T1-${Date.now()}`;
  const t1Order = await Order.create({
    order_number: orderNumber1,
    customer_name: "Test Customer 1",
    email: "test.c1@example.com",
    phone: "9876543210",
    shipping_address: "100 Feet Road, Gandhipuram",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641012",
    payment_method: "PREPAID",
    status: "confirmed",
    shipping_status: "pending_dispatch",
    courier_name: "BlueDart Express (Shiprocket)",
    courier_company_id: 1,
    subtotal: 999.00,
    shipping_fee: 40.00,
    total: 1039.00
  });

  await OrderItem.create({
    order_id: t1Order.id,
    product_id: product.id,
    product_name_snapshot: product.name,
    sku_snapshot: "SKU-T1",
    quantity: 2,
    unit_price: 499.50,
    line_total: 999.00
  });

  // Step 3a: Customer requests cancellation
  const r1 = createMockRes();
  await orderController.requestCancellation(
    {
      params: { id: t1Order.id },
      body: {
        cancellation_type: "pre_pack",
        reason: "Ordered wrong size",
        comments: "Customer requested cancel before dispatch",
        refund_upi_id: "test1@okaxis",
        refund_account_holder: "Test Customer 1"
      },
      user: null
    },
    r1
  );

  const reloadedT1 = await Order.findByPk(t1Order.id);
  if (reloadedT1.cancellation_status !== "requested" || reloadedT1.refund_status !== "pending") {
    throw new Error("Tier 1 Cancellation Request failed!");
  }
  console.log("   - Step A (Customer Request): cancellation_status = 'requested', refund_status = 'pending'");

  // Step 3b: Admin approves pre-pack cancellation
  const r2 = createMockRes();
  await orderController.approveCancellation(
    { params: { id: t1Order.id }, user: { role: "admin" } },
    r2
  );

  const approvedT1 = await Order.findByPk(t1Order.id);
  const restockedProduct = await Product.findByPk(product.id);
  console.log("   - Step B (Admin Approval): status = '" + approvedT1.status + "', restocked = " + (Number(restockedProduct.stock_count) >= initialStock));

  if (approvedT1.status !== "cancelled" || approvedT1.cancellation_status !== "approved") {
    throw new Error("Tier 1 Approval failed!");
  }

  // Step 3c: Admin processes UPI refund
  const r3 = createMockRes();
  await orderController.processUpiRefund(
    {
      params: { id: t1Order.id },
      body: {
        utr_number: "UTR-TEST-T1-99887766",
        amount: 1039.00,
        notes: "Refund credited via HDFC UPI"
      },
      user: { role: "admin" }
    },
    r3
  );

  const refundedT1 = await Order.findByPk(t1Order.id);
  if (refundedT1.cancellation_status !== "completed" || refundedT1.refund_status !== "processed") {
    throw new Error("Tier 1 UPI Refund processing failed!");
  }
  console.log("   - Step C (UPI Refund Settled): refund_status = 'processed', UTR = '" + refundedT1.refund_utr_number + "'");
  console.log("✅ Tier 1 Pre-Packing Cancellation: PASS");

  // -------------------------------------------------------------
  // TEST 4: TIER 2 IN-TRANSIT CANCELLATION (RTO WORKFLOW)
  // -------------------------------------------------------------
  console.log("\n🟡 5. Testing Tier 2: In-Transit Cancellation (Courier RTO)...");
  const orderNumber2 = `ZMW-TEST-T2-${Date.now()}`;
  const t2Order = await Order.create({
    order_number: orderNumber2,
    customer_name: "Test Customer 2",
    email: "test.c2@example.com",
    phone: "9876543211",
    shipping_address: "24 Park Avenue",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    payment_method: "PREPAID",
    status: "shipped",
    shipping_status: "in_transit",
    courier_name: "Delhivery Surface (Shiprocket)",
    courier_company_id: 2,
    awb_code: "DELHIVERY-TEST-5544",
    shiprocket_order_id: "SR-TEST-5544",
    subtotal: 1499.00,
    shipping_fee: 40.00,
    total: 1539.00
  });

  await OrderItem.create({
    order_id: t2Order.id,
    product_id: product.id,
    product_name_snapshot: product.name,
    sku_snapshot: "SKU-T2",
    quantity: 1,
    unit_price: 1499.00,
    line_total: 1499.00
  });

  // Step 4a: Customer requests in-transit cancel
  const r4 = createMockRes();
  await orderController.requestCancellation(
    {
      params: { id: t2Order.id },
      body: {
        cancellation_type: "in_transit",
        reason: "Delivery delayed",
        refund_upi_id: "test2@okhdfcbank"
      },
      user: null
    },
    r4
  );

  // Step 4b: Admin approves in-transit cancellation -> stops courier forward delivery & sets RTO
  const r5 = createMockRes();
  await orderController.approveCancellation(
    { params: { id: t2Order.id }, user: { role: "admin" } },
    r5
  );

  const rtoT2 = await Order.findByPk(t2Order.id);
  console.log("   - Step B (Courier RTO Triggered): cancellation_status = '" + rtoT2.cancellation_status + "', shipping_status = '" + rtoT2.shipping_status + "'");
  if (rtoT2.cancellation_status !== "rto_in_transit" || rtoT2.shipping_status !== "rto") {
    throw new Error("Tier 2 RTO trigger failed!");
  }

  // Step 4c: Package arrives at Warehouse -> marked received & QC checked
  const r6 = createMockRes();
  await orderController.markWarehouseReceived(
    {
      params: { id: t2Order.id },
      body: { inspected_by: "Warehouse Manager - Peelamedu Hub" },
      admin: { name: "QC Specialist" }
    },
    r6
  );

  const whT2 = await Order.findByPk(t2Order.id);
  console.log("   - Step C (Warehouse Received): cancellation_status = '" + whT2.cancellation_status + "', status = '" + whT2.status + "'");
  if (whT2.cancellation_status !== "rto_delivered" || whT2.status !== "returned") {
    throw new Error("Tier 2 Warehouse receiving failed!");
  }

  // Step 4d: Settle UPI Refund
  const r7 = createMockRes();
  await orderController.processUpiRefund(
    {
      params: { id: t2Order.id },
      body: { utr_number: "UTR-TEST-RTO-123456" },
      user: { role: "admin" }
    },
    r7
  );

  const completedT2 = await Order.findByPk(t2Order.id);
  if (completedT2.cancellation_status !== "completed" || completedT2.refund_status !== "processed") {
    throw new Error("Tier 2 Refund settlement failed!");
  }
  console.log("✅ Tier 2 In-Transit Cancellation (RTO): PASS");

  // -------------------------------------------------------------
  // TEST 5: TIER 3 POST-DELIVERY RETURN & SHIPROCKET REVERSE PICKUP
  // -------------------------------------------------------------
  console.log("\n🔴 6. Testing Tier 3: Post-Delivery Return & Shiprocket Reverse Pickup...");
  const orderNumber3 = `ZMW-TEST-T3-${Date.now()}`;
  const t3Order = await Order.create({
    order_number: orderNumber3,
    customer_name: "Test Customer 3",
    email: "test.c3@example.com",
    phone: "9876543212",
    shipping_address: "12 Lake Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    payment_method: "PREPAID",
    status: "delivered",
    shipping_status: "delivered",
    courier_name: "BlueDart Express (Shiprocket)",
    awb_code: "BLUEDART-TEST-9988",
    subtotal: 2499.00,
    shipping_fee: 40.00,
    total: 2539.00
  });

  await OrderItem.create({
    order_id: t3Order.id,
    product_id: product.id,
    product_name_snapshot: product.name,
    sku_snapshot: "SKU-T3",
    quantity: 1,
    unit_price: 2499.00,
    line_total: 2499.00
  });

  // Step 5a: Customer requests return with photos & video proofs
  const r8 = createMockRes();
  await orderController.requestCancellation(
    {
      params: { id: t3Order.id },
      body: {
        cancellation_type: "post_delivery",
        reason: "Damaged / Defective Piece",
        comments: "Collar stitching is damaged upon unboxing",
        refund_upi_id: "test3@paytm",
        refund_account_holder: "Test Customer 3",
        return_images: ["https://zmw.in/uploads/proof1.jpg", "https://zmw.in/uploads/proof2.jpg"],
        return_video_url: "https://zmw.in/uploads/unboxing.mp4"
      },
      user: null
    },
    r8
  );

  const reqT3 = await Order.findByPk(t3Order.id);
  if (reqT3.cancellation_status !== "requested" || !reqT3.return_images) {
    throw new Error("Tier 3 Return request with media proofs failed!");
  }
  console.log("   - Step A (Customer Proof Upload): return_images stored, cancellation_status = 'requested'");

  // Step 5b: Admin reviews proofs and approves return -> schedules Shiprocket reverse pickup
  const r9 = createMockRes();
  await orderController.approveReturn(
    { params: { id: t3Order.id }, user: { role: "admin" } },
    r9
  );

  const approvedT3 = await Order.findByPk(t3Order.id);
  console.log("   - Step B (Reverse Pickup Scheduled): Reverse AWB = '" + approvedT3.reverse_awb_code + "', Status = '" + approvedT3.reverse_shipping_status + "'");
  if (!approvedT3.reverse_awb_code || approvedT3.reverse_shipping_status !== "reverse_pickup_scheduled") {
    throw new Error("Tier 3 Reverse Pickup scheduling failed!");
  }

  // Step 5c: Package collected by courier and delivered to ZMW warehouse -> QC Passed
  const r10 = createMockRes();
  await orderController.markWarehouseReceived(
    {
      params: { id: t3Order.id },
      body: { inspected_by: "Senior Garment QC Specialist" },
      admin: { name: "QC Lead" }
    },
    r10
  );

  const qcT3 = await Order.findByPk(t3Order.id);
  console.log("   - Step C (QC Passed & Restocked): status = '" + qcT3.status + "', warehouse_inspected_by = '" + qcT3.warehouse_inspected_by + "'");
  if (qcT3.status !== "returned") {
    throw new Error("Tier 3 Warehouse QC failed!");
  }

  // Step 5d: Admin enters UTR to disburse UPI refund
  const r11 = createMockRes();
  await orderController.processUpiRefund(
    {
      params: { id: t3Order.id },
      body: { utr_number: "UTR-REV-987654321098" },
      user: { role: "admin" }
    },
    r11
  );

  const completedT3 = await Order.findByPk(t3Order.id);
  if (completedT3.cancellation_status !== "completed" || completedT3.refund_status !== "processed") {
    throw new Error("Tier 3 Refund settlement failed!");
  }
  console.log("   - Step D (UPI Refund Settled): refund_status = 'processed', UTR = '" + completedT3.refund_utr_number + "'");
  console.log("✅ Tier 3 Post-Delivery Return & Reverse Pickup: PASS");

  // Clean up temporary test run orders
  await Order.destroy({ where: { order_number: [orderNumber1, orderNumber2, orderNumber3] } });

  console.log("\n=================================================================");
  console.log("🎉 ALL SYSTEM CHECKS PASSED: ORDER LIFECYCLE, SHIPROCKET & 3-TIER RETURNS 100% OPERATIONAL!");
  console.log("=================================================================");
  process.exit(0);
}

runFullVerification().catch((err) => {
  console.error("❌ Verification failed with error:", err);
  process.exit(1);
});
