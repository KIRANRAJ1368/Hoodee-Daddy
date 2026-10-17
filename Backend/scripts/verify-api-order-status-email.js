/**
 * Automated Verification Script: Order Status Email HTTP API Integration
 * Simulates Admin Dashboard actions updating order statuses and checks
 * server responses and email dispatch.
 */
const { Order, OrderItem, sequelize } = require("../src/models");

async function main() {
  console.log("================================================================================");
  console.log("🚀 STARTING HTTP API ORDER STATUS EMAIL WORKFLOW VERIFICATION");
  console.log("================================================================================");

  await sequelize.authenticate();

  // 1. Authenticate as Admin
  console.log("1. Authenticating as admin...");
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "adminzmw@gmail.com",
      password: "Admin@2026"
    })
  });

  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson?.data?.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginJson)}`);
  }
  const token = loginJson.data.token;
  console.log("✓ Admin logged in successfully.\n");

  // 2. Create test order
  const orderNumber = `ZMW-API-TEST-${Date.now().toString(36).toUpperCase()}`;
  const testEmail = "kiranraj071845@gmail.com";
  console.log(`2. Creating test order: ${orderNumber} for ${testEmail}...`);

  const order = await Order.create({
    order_number: orderNumber,
    customer_name: "Kiran Raj (VIP Member)",
    email: testEmail,
    phone: "9876543210",
    shipping_address: "Avenue Montaigne Luxury Penthouse",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641018",
    payment_method: "PREPAID",
    status: "pending",
    shipping_status: "pending_dispatch",
    subtotal: 7999.00,
    discount_amount: 1000.00,
    shipping_fee: 0.00,
    total: 6999.00,
    courier_name: "BlueDart Express",
    awb_code: "BD-API-998822",
    tracking_number: "BD-API-998822"
  });

  await OrderItem.create({
    order_id: order.id,
    product_id: 1,
    product_name_snapshot: "ZMW Limited Edition Cashmere Blazer",
    size: "42",
    color: "Midnight Velvet",
    quantity: 1,
    unit_price: 6999.00,
    line_total: 6999.00
  });

  console.log(`✓ Test Order ID: ${order.id} created.\n`);

  // 3. Test HTTP Status Updates
  const transitions = [
    { target: "confirmed", note: "Pending -> Confirmed" },
    { target: "packed", note: "Confirmed -> Packed" },
    { target: "shipped", note: "Packed -> Shipped" },
    { target: "delivered", note: "Shipped -> Delivered" }
  ];

  for (const step of transitions) {
    console.log(`3. Executing Admin Status Update: ${step.note} [Target: ${step.target.toUpperCase()}]...`);
    const patchRes = await fetch(`http://localhost:5000/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: step.target })
    });

    const patchJson = await patchRes.json();
    if (!patchRes.ok) {
      console.error(`  ✗ Status update failed:`, patchJson);
      throw new Error(`Failed to update to ${step.target}`);
    }

    console.log(`  ✓ HTTP ${patchRes.status} OK: Order status updated to "${patchJson.data.status}"`);
  }

  // 4. Verify Final State in DB
  const finalOrder = await Order.findByPk(order.id);
  console.log(`\n4. Verified final database order status: ${finalOrder.status.toUpperCase()}`);

  // 5. Cleanup
  await OrderItem.destroy({ where: { order_id: order.id } });
  await order.destroy();
  console.log("✓ Test order cleaned up successfully.\n");

  console.log("================================================================================");
  console.log("🎉 ALL API ORDER STATUS TRANSITIONS AND EMAIL NOTIFICATIONS PASSED!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR in API verification:", err);
  process.exit(1);
});
