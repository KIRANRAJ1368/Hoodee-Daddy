/**
 * Seeds test orders specifically for verifying the Dashboard & OrdersPage Cancellation & Refund visibility.
 */
const { Order, OrderItem, Product, sequelize } = require("../src/models");

async function seed() {
  await sequelize.authenticate();
  console.log("Connected to database for dashboard test seeding...");

  const product = await Product.findOne();
  const productId = product ? product.id : 1;
  const productName = product ? product.name : "Luxury Oversized T-Shirt";

  // Clean up any previous test orders with PW prefix
  await Order.destroy({ where: { order_number: { [sequelize.Sequelize.Op.like]: "ZMW-PW-%" } } });

  const now = new Date();

  // 1. Pre-Pack Cancellation Request
  const o1 = await Order.create({
    order_number: `ZMW-PW-T1-${Date.now().toString(36).toUpperCase()}`,
    customer_name: "Aarav Patel",
    email: "aarav.patel@example.com",
    phone: "9876543210",
    shipping_address: "Flat 402, Lotus Towers, MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    payment_method: "PREPAID",
    status: "confirmed",
    shipping_status: "pending_dispatch",
    courier_name: "BlueDart Express (Shiprocket)",
    courier_company_id: 1,
    subtotal: 1249.00,
    shipping_fee: 50.00,
    total: 1299.00,
    cancellation_type: "pre_pack",
    cancellation_status: "requested",
    cancellation_reason: "Ordered wrong size by mistake",
    cancellation_comments: "Please cancel before dispatch and refund to UPI",
    refund_upi_id: "aarav@okaxis",
    refund_account_holder: "Aarav Patel",
    refund_status: "pending",
    refund_amount: 1299.00,
    created_at: now,
    updated_at: now
  });

  await OrderItem.create({
    order_id: o1.id,
    product_id: productId,
    product_name_snapshot: productName,
    sku_snapshot: "ZMW-PW-01",
    quantity: 1,
    unit_price: 1249.00,
    line_total: 1249.00
  });

  // 2. In-Transit Cancellation Request (AWB already assigned)
  const o2 = await Order.create({
    order_number: `ZMW-PW-T2-${Date.now().toString(36).toUpperCase()}`,
    customer_name: "Pooja Hegde",
    email: "pooja.hegde@example.com",
    phone: "9812345678",
    shipping_address: "Villa 12, Palm Meadows",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560066",
    payment_method: "PREPAID",
    status: "shipped",
    shipping_status: "in_transit",
    courier_name: "Delhivery Surface (Shiprocket)",
    courier_company_id: 2,
    awb_code: "DELHIVERY-PW-98214",
    shipment_id: "SHP-PW-98214",
    subtotal: 1849.00,
    shipping_fee: 50.00,
    total: 1899.00,
    cancellation_type: "in_transit",
    cancellation_status: "requested",
    cancellation_reason: "Delivery delayed beyond event date",
    cancellation_comments: "Please stop delivery and initiate return to origin",
    refund_upi_id: "pooja@okhdfcbank",
    refund_account_holder: "Pooja Hegde",
    refund_status: "pending",
    refund_amount: 1899.00,
    created_at: now,
    updated_at: now
  });

  await OrderItem.create({
    order_id: o2.id,
    product_id: productId,
    product_name_snapshot: productName,
    sku_snapshot: "ZMW-PW-02",
    quantity: 1,
    unit_price: 1849.00,
    line_total: 1849.00
  });

  // 3. Post-Delivery Return Request with Photos & Video Proof
  const o3 = await Order.create({
    order_number: `ZMW-PW-T3-${Date.now().toString(36).toUpperCase()}`,
    customer_name: "Vikram Seth",
    email: "vikram.seth@example.com",
    phone: "9765432109",
    shipping_address: "A-24, Vasant Vihar",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110057",
    payment_method: "PREPAID",
    status: "delivered",
    shipping_status: "delivered",
    courier_name: "BlueDart Express (Shiprocket)",
    awb_code: "BLUEDART-PW-77112",
    subtotal: 2449.00,
    shipping_fee: 50.00,
    total: 2499.00,
    cancellation_type: "post_delivery",
    cancellation_status: "requested",
    cancellation_reason: "Damaged / Defective Stitching Piece",
    cancellation_comments: "Collar stitching is frayed, photo and video attached for review",
    return_images: ["/uploads/returns/proof-front.jpg", "/uploads/returns/proof-tag.jpg"],
    return_video_url: "/uploads/returns/unboxing-defect.mp4",
    refund_upi_id: "vikram@paytm",
    refund_account_holder: "Vikram Seth",
    refund_status: "pending",
    refund_amount: 2499.00,
    created_at: now,
    updated_at: now
  });

  await OrderItem.create({
    order_id: o3.id,
    product_id: productId,
    product_name_snapshot: productName,
    sku_snapshot: "ZMW-PW-03",
    quantity: 1,
    unit_price: 2449.00,
    line_total: 2449.00
  });

  // 4. Warehouse Received RTO awaiting final refund payout
  const o4 = await Order.create({
    order_number: `ZMW-PW-RTO-${Date.now().toString(36).toUpperCase()}`,
    customer_name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    phone: "9988776655",
    shipping_address: "Plot 88, Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    payment_method: "PREPAID",
    status: "cancelled",
    shipping_status: "rto",
    courier_name: "Shadowfax Express",
    awb_code: "SHADOWFAX-PW-11223",
    subtotal: 949.00,
    shipping_fee: 50.00,
    total: 999.00,
    cancellation_type: "in_transit",
    cancellation_status: "rto_delivered",
    cancellation_reason: "Customer rejected at doorstep",
    warehouse_received_at: now,
    warehouse_inspected_by: "Warehouse Manager (Sarah)",
    refund_upi_id: "sneha@okicici",
    refund_account_holder: "Sneha Reddy",
    refund_status: "pending",
    refund_amount: 999.00,
    created_at: now,
    updated_at: now
  });

  await OrderItem.create({
    order_id: o4.id,
    product_id: productId,
    product_name_snapshot: productName,
    sku_snapshot: "ZMW-PW-04",
    quantity: 1,
    unit_price: 949.00,
    line_total: 949.00
  });

  console.log("✓ Seeded 4 Playwright test orders:");
  console.log(`  1. Pre-Pack Request: ${o1.order_number} (ID: ${o1.id})`);
  console.log(`  2. In-Transit Request: ${o2.order_number} (ID: ${o2.id})`);
  console.log(`  3. Post-Delivery Return: ${o3.order_number} (ID: ${o3.id})`);
  console.log(`  4. RTO Delivered / Refund Due: ${o4.order_number} (ID: ${o4.id})`);

  return {
    order1: o1.id,
    order2: o2.id,
    order3: o3.id,
    order4: o4.id,
    order1Num: o1.order_number,
    order2Num: o2.order_number,
    order3Num: o3.order_number,
    order4Num: o4.order_number
  };
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}

module.exports = { seed };
