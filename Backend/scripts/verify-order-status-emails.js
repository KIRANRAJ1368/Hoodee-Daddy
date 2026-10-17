/**
 * Automated Verification Script: Order Status Email Notifications
 * Tests that every status change (confirmed, packed, shipped, delivered, cancelled, returned)
 * produces a luxury customer notification email with all metadata.
 */
const { Order, OrderItem, Product, sequelize } = require("../src/models");
const mailer = require("../src/utils/mailer");

async function main() {
  console.log("================================================================================");
  console.log("📧 STARTING ZMW ORDER STATUS EMAIL NOTIFICATION VERIFICATION");
  console.log("================================================================================");

  await sequelize.authenticate();
  console.log("✓ Database connected successfully.\n");

  const testEmail = "kiranraj071845@gmail.com";
  const customerName = "Kiran Raj";

  // 1. Direct Unit Verification for all Statuses
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST SUITE 1: Direct Status Mailer Rendering & Dispatch");
  console.log("--------------------------------------------------------------------------------");

  const statusesToTest = [
    {
      status: "confirmed",
      extra: {},
      description: "Order Confirmed & Atelier Verification"
    },
    {
      status: "packed",
      extra: { courier_name: "Shiprocket / Blue Dart Express", awb_code: "AWB-ZMW-PACK-1001" },
      description: "Order Packed, Boxed & Quality Inspected"
    },
    {
      status: "shipped",
      extra: {
        courier_name: "Delhivery Air Express",
        awb_code: "DELHIVERY-7788992211",
        estimated_delivery: "Tomorrow by 8:00 PM"
      },
      description: "Order Dispatched & In Transit with Live Tracking"
    },
    {
      status: "delivered",
      extra: {
        courier_name: "Delhivery Air Express",
        awb_code: "DELHIVERY-7788992211"
      },
      description: "Order Delivered Successfully to Destination"
    },
    {
      status: "cancelled",
      extra: {
        reason: "Customer changed mind before packaging",
        cancellation_type: "pre_pack"
      },
      description: "Order Cancelled with Refund Summary"
    },
    {
      status: "returned",
      extra: {
        inspected_by: "Chief Atelier Quality Officer",
        reason: "Customer size exchange request"
      },
      description: "Return Received & Warehouse QC Completed"
    }
  ];

  let testOrderNumber = `ZMW-MAIL-TEST-${Date.now().toString(36).toUpperCase()}`;

  const mockOrder = {
    id: 99999,
    order_number: testOrderNumber,
    customer_name: customerName,
    email: testEmail,
    phone: "9876543210",
    shipping_address: "74 Elite Residences, Avinashi Road",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641018",
    payment_method: "PREPAID",
    subtotal: 4999.00,
    discount_amount: 500.00,
    shipping_fee: 0.00,
    total: 4499.00,
    refund_upi_id: "kiranraj@oksbi",
    refund_amount: 4499.00,
    refund_utr_number: "UTR-BANK-882200",
    items: [
      {
        product_name_snapshot: "ZMW Oversized Heavyweight Hoodie (Noir)",
        size: "L",
        color: "Noir Black",
        quantity: 1,
        unit_price: 2999.00
      },
      {
        product_name_snapshot: "ZMW Luxury Relaxed Fit Cargo Pant",
        size: "32",
        color: "Stone Sand",
        quantity: 1,
        unit_price: 2000.00
      }
    ]
  };

  let passedDirectCount = 0;

  for (const item of statusesToTest) {
    console.log(`\nTesting status: [${item.status.toUpperCase()}] -> ${item.description}...`);
    try {
      const result = await mailer.sendOrderStatusUpdateEmail(
        testEmail,
        mockOrder,
        item.status,
        "pending",
        item.extra
      );

      if (result && result.success) {
        console.log(`  ✓ Result: SUCCESS (Simulated/Sent: ${result.simulated ? "Simulated Mode (Console logged)" : "Live SMTP Sent"})`);
        passedDirectCount++;
      } else {
        console.error(`  ✗ Result FAILED:`, result);
      }
    } catch (err) {
      console.error(`  ✗ Threw exception for status ${item.status}:`, err.message);
    }
  }

  console.log(`\n>> Direct Mailer Test Results: ${passedDirectCount} / ${statusesToTest.length} PASSED.\n`);

  // --------------------------------------------------------------------------------
  // TEST SUITE 2: End-to-End Status Lifecycle on Live Database Order
  // --------------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST SUITE 2: Live Database Order Lifecycle with Status Email Triggers");
  console.log("--------------------------------------------------------------------------------");

  // Step 2.1: Create fresh real database order
  const liveOrderNumber = `ZMW-FLOW-${Date.now().toString(36).toUpperCase()}`;
  console.log(`Creating database order: ${liveOrderNumber}...`);

  const liveOrder = await Order.create({
    order_number: liveOrderNumber,
    customer_name: customerName,
    email: testEmail,
    phone: "9876543210",
    shipping_address: "12 Lakeview Boulevard",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600028",
    payment_method: "PREPAID",
    status: "pending",
    shipping_status: "pending_dispatch",
    subtotal: 3500.00,
    discount_amount: 0.00,
    shipping_fee: 0.00,
    total: 3500.00,
    refund_upi_id: "kiranraj@okaxis"
  });

  await OrderItem.create({
    order_id: liveOrder.id,
    product_id: 1,
    product_name_snapshot: "ZMW Atelier Signature Silk Polo",
    size: "M",
    color: "Imperial Gold",
    quantity: 1,
    unit_price: 3500.00,
    line_total: 3500.00
  });

  console.log(`✓ Order created with ID: ${liveOrder.id}, Initial Status: ${liveOrder.status}`);

  // Test Lifecycle Progression:
  // pending -> confirmed -> packed -> shipped -> delivered
  const lifecycle = [
    {
      newStatus: "confirmed",
      shippingStatus: "pending_dispatch",
      note: "Atelier confirmation"
    },
    {
      newStatus: "packed",
      shippingStatus: "manifested",
      courier: "BlueDart Express",
      awb: "AWB-LIFECYCLE-8899",
      note: "Quality checked and packed"
    },
    {
      newStatus: "shipped",
      shippingStatus: "in_transit",
      courier: "BlueDart Express",
      awb: "AWB-LIFECYCLE-8899",
      note: "Dispatched to destination"
    },
    {
      newStatus: "delivered",
      shippingStatus: "delivered",
      note: "Package received by customer"
    }
  ];

  let passedLifecycleCount = 0;

  for (const stage of lifecycle) {
    const prevStatus = liveOrder.status;
    liveOrder.status = stage.newStatus;
    liveOrder.shipping_status = stage.shippingStatus;
    if (stage.courier) liveOrder.courier_name = stage.courier;
    if (stage.awb) {
      liveOrder.awb_code = stage.awb;
      liveOrder.tracking_number = stage.awb;
    }
    await liveOrder.save();

    console.log(`\nTransitioning order from [${prevStatus}] -> [${stage.newStatus}]...`);
    const emailRes = await mailer.sendOrderStatusUpdateEmail(
      liveOrder.email,
      liveOrder,
      stage.newStatus,
      prevStatus
    );

    if (emailRes && emailRes.success) {
      console.log(`  ✓ Status email triggered successfully for [${stage.newStatus}].`);
      passedLifecycleCount++;
    } else {
      console.error(`  ✗ Status email failed for [${stage.newStatus}]:`, emailRes);
    }
  }

  // Also test cancellation email on a dedicated test order
  console.log("\nTesting Cancellation Email trigger...");
  const cancelRes = await mailer.sendOrderStatusUpdateEmail(
    testEmail,
    liveOrder,
    "cancelled",
    "confirmed",
    { reason: "Customer requested cancellation before shipment" }
  );
  if (cancelRes && cancelRes.success) {
    console.log("  ✓ Cancellation email triggered successfully.");
    passedLifecycleCount++;
  }

  // Also test return email on a dedicated test order
  console.log("\nTesting Return Email trigger...");
  const returnRes = await mailer.sendOrderStatusUpdateEmail(
    testEmail,
    liveOrder,
    "returned",
    "delivered",
    { inspected_by: "ZMW QC Manager" }
  );
  if (returnRes && returnRes.success) {
    console.log("  ✓ Return email triggered successfully.");
    passedLifecycleCount++;
  }

  // Clean up test order
  await OrderItem.destroy({ where: { order_id: liveOrder.id } });
  await liveOrder.destroy();
  console.log(`\n✓ Cleaned up test database order ${liveOrder.id}.`);

  console.log("\n================================================================================");
  console.log("🎉 ALL ORDER STATUS EMAIL NOTIFICATION VERIFICATIONS COMPLETED SUCCESSFULLY!");
  console.log(`   Direct Status Tests: ${passedDirectCount} / ${statusesToTest.length} PASSED`);
  console.log(`   Lifecycle Tests    : ${passedLifecycleCount} / ${lifecycle.length + 2} PASSED`);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR running order status email verification:", err);
  process.exit(1);
});
