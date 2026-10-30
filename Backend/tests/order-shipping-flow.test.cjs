const assert = require("assert");
const { Order, OrderItem, OrderStatusHistory, Product, ProductVariant, ProductSize, ProductColor, Category, User, Coupon, sequelize } = require("../src/models");
const orderController = require("../src/controllers/orderController");

async function runTests() {
  console.log("▶ Starting Order & Shipping Flow test suite...");

  // 1. Test Single-Attribute Variant Matching in calculateOrderFinancials
  console.log("Testing variant matching logic...");
  const cat = await Category.create({
    name: "Order Test Cat " + Date.now(),
    slug: "ord-cat-" + Date.now(),
    is_active: true
  });

  const testProduct = await Product.create({
    name: "Size-Only Test Product " + Date.now(),
    slug: "size-prod-" + Date.now(),
    sku: "SZ-" + Date.now(),
    category_id: cat.id,
    price: 499.0,
    is_active: true,
    in_stock: true,
    stock_count: 50
  });

  const testSize = await ProductSize.create({
    product_id: testProduct.id,
    label: "XL-" + Date.now(),
    sort_order: 1
  });

  // Variant with size only (color_id: null)
  const sizeVariant = await ProductVariant.create({
    product_id: testProduct.id,
    size_id: testSize.id,
    color_id: null,
    stock_count: 20,
    sales_count: 0
  });

  // Test creating a COD order with this size-only variant
  let createdOrderData = null;
  const mockReq = {
    user: null,
    body: {
      customer_name: "Test Customer",
      email: "order_test@example.com",
      phone: "9876543210",
      shipping_address: "123 Main Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641016",
      payment_method: "COD",
      items: [
        {
          product_id: testProduct.id,
          quantity: 2,
          size: testSize.label
        }
      ]
    }
  };

  const mockRes = {
    status: (code) => {
      mockRes.statusCode = code;
      return mockRes;
    },
    json: (payload) => {
      createdOrderData = payload.data;
      return mockRes;
    }
  };

  await orderController.create(mockReq, mockRes);
  assert.ok(createdOrderData, "Order should be created successfully for size-only variant");
  assert.equal(createdOrderData.items.length, 1, "Order should have 1 item");
  assert.equal(createdOrderData.items[0].size, testSize.label, "Item size should match variant");
  console.log("✔ Test 1 passed: Size-only variant successfully matched and order created");

  // Verify stock was deducted
  await sizeVariant.reload();
  assert.equal(sizeVariant.stock_count, 18, "Variant stock should be deducted by 2 (20 -> 18)");
  console.log("✔ Test 2 passed: Variant stock count properly deducted");

  // 2. Test Security: Guest cancellation without email must fail
  console.log("Testing cancellation security...");
  let cancelError = null;
  const mockCancelFailReq = {
    params: { id: createdOrderData.id },
    user: null,
    body: {
      reason: "Changed my mind"
      // no email provided
    }
  };
  try {
    await orderController.requestCancellation(mockCancelFailReq, mockRes);
  } catch (err) {
    cancelError = err;
  }
  assert.ok(cancelError, "Guest cancellation without email must throw error");
  assert.equal(cancelError.statusCode, 403, "Must return 403 Forbidden");
  console.log("✔ Test 3 passed: Guest cancellation without email blocked with 403 Forbidden");

  // 3. Test Security: Guest cancellation with correct email succeeds
  const mockCancelSuccessReq = {
    params: { id: createdOrderData.id },
    user: null,
    body: {
      reason: "Changed my mind",
      email: "order_test@example.com"
    }
  };
  let cancelResult = null;
  const mockCancelRes = {
    status: () => mockCancelRes,
    json: (p) => { cancelResult = p.data; return mockCancelRes; }
  };
  await orderController.requestCancellation(mockCancelSuccessReq, mockCancelRes);
  assert.ok(cancelResult, "Cancellation request should succeed with valid email");
  assert.equal(cancelResult.cancellation_status, "requested", "cancellation_status should be 'requested'");
  console.log("✔ Test 4 passed: Guest cancellation with matching email accepted");

  // 4. Test Pre-pack Approval: Restocks inventory and marks cancelled
  console.log("Testing admin pre-pack approval...");
  const mockApproveReq = {
    params: { id: createdOrderData.id },
    admin: { name: "Store Admin" }
  };
  let approveResult = null;
  const mockApproveRes = {
    status: () => mockApproveRes,
    json: (p) => { approveResult = p.data; return mockApproveRes; }
  };
  await orderController.approveCancellation(mockApproveReq, mockApproveRes);
  assert.equal(approveResult.status, "cancelled", "Order status must be 'cancelled'");
  assert.equal(approveResult.shipping_status, "cancelled", "Shipping status must be 'cancelled'");

  // Check inventory was restocked back to 20
  await sizeVariant.reload();
  assert.equal(sizeVariant.stock_count, 20, "Variant stock should be restored back to 20");
  console.log("✔ Test 5 passed: Pre-pack approval cancels order and restocks variant inventory");

  // 5. Test OrderStatusHistory entries
  const historyEntries = await OrderStatusHistory.findAll({
    where: { order_id: createdOrderData.id },
    order: [["id", "ASC"]]
  });
  assert.ok(historyEntries.length >= 2, "OrderStatusHistory should record initial placement, request, and approval");
  console.log("✔ Test 6 passed: OrderStatusHistory properly created across fulfillment & cancellation lifecycle");

  // Clean up test records
  await OrderItem.destroy({ where: { order_id: createdOrderData.id } });
  await OrderStatusHistory.destroy({ where: { order_id: createdOrderData.id } });
  await Order.destroy({ where: { id: createdOrderData.id } });
  await ProductVariant.destroy({ where: { id: sizeVariant.id } });
  await ProductSize.destroy({ where: { id: testSize.id } });
  await Product.destroy({ where: { id: testProduct.id } });
  await Category.destroy({ where: { id: cat.id } });

  console.log("🎉 All Order & Shipping Flow tests passed successfully!\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
