const assert = require("node:assert/strict");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { sequelize, Announcement } = require("../src/models");
const jwt = require("jsonwebtoken");
const env = require("../src/config/env");
const app = require("../src/app");

async function runVerification() {
  console.log("=======================================================");
  console.log("🚀 STARTING ANNOUNCEMENT SYSTEM VERIFICATION");
  console.log("=======================================================\n");

  await sequelize.authenticate();
  console.log("✅ Database authenticated");

  // Start app on ephemeral port for testing
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✅ Test server running on ${baseUrl}`);

  try {
    // Generate Admin JWT Token for testing (payload requires `sub` for admin lookup)
    const token = jwt.sign(
      { sub: 1, email: "adminzmw@gmail.com", role: "superadmin" },
      env.jwt.secret,
      { expiresIn: "1h" }
    );

    // 1. Test Public Endpoint: GET /api/announcements/active
    console.log("1. Testing GET /api/announcements/active...");
    const publicRes = await fetch(`${baseUrl}/api/announcements/active`);
    assert.equal(publicRes.status, 200, "Public endpoint must return 200");
    const publicData = await publicRes.json();
    assert.ok(publicData.success, "Public endpoint must return success: true");
    console.log("   ✅ Public active announcement response:", publicData.data?.activeAnnouncement?.message);

    // 2. Test Admin Endpoint: GET /api/announcements
    console.log("2. Testing GET /api/announcements with admin auth...");
    const listRes = await fetch(`${baseUrl}/api/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(listRes.status, 200, "List endpoint must return 200");
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.data), "List response data must be an array");
    console.log(`   ✅ Admin list retrieved: ${listData.data.length} announcement(s)`);

    // 3. Test Admin Endpoint: POST /api/announcements
    console.log("3. Testing POST /api/announcements (Create)...");
    const createPayload = {
      message: "⚡ TEST PROMO: FLAT 30% OFF ON HOODIES & SWEATSHIRTS",
      link_url: "/collection?category=mens",
      bg_color: "#DC2626",
      text_color: "#FFFFFF",
      is_active: true,
      sort_order: 1
    };

    const createRes = await fetch(`${baseUrl}/api/announcements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(createPayload)
    });
    assert.equal(createRes.status, 201, "Create endpoint must return 201");
    const createData = await createRes.json();
    assert.ok(createData.data.id, "Created announcement must have an id");
    assert.equal(createData.data.message, createPayload.message);
    assert.equal(createData.data.bg_color, "#DC2626");
    const createdId = createData.data.id;
    console.log(`   ✅ Created announcement with ID ${createdId}`);

    // 4. Test Admin Endpoint: PUT /api/announcements/:id (Update)
    console.log(`4. Testing PUT /api/announcements/${createdId} (Update)...`);
    const updatePayload = {
      message: "⚡ UPDATED PROMO: BUY 2 GET 1 FREE | ALL TEES",
      link_url: "/collection",
      bg_color: "#B91C1C",
      text_color: "#FEF08A",
      sort_order: 2
    };

    const updateRes = await fetch(`${baseUrl}/api/announcements/${createdId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatePayload)
    });
    assert.equal(updateRes.status, 200, "Update endpoint must return 200");
    const updateData = await updateRes.json();
    assert.equal(updateData.data.message, updatePayload.message);
    assert.equal(updateData.data.bg_color, "#B91C1C");
    assert.equal(updateData.data.text_color, "#FEF08A");
    console.log(`   ✅ Updated announcement ID ${createdId}`);

    // 5. Test Admin Endpoint: PATCH /api/announcements/:id/toggle (Enable/Disable)
    console.log(`5. Testing PATCH /api/announcements/${createdId}/toggle (Toggle)...`);
    const toggleRes = await fetch(`${baseUrl}/api/announcements/${createdId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(toggleRes.status, 200, "Toggle endpoint must return 200");
    const toggleData = await toggleRes.json();
    assert.equal(toggleData.data.is_active, false, "Status should be toggled to false");
    console.log(`   ✅ Toggled status to is_active: false`);

    // Toggle back to active
    const toggleBackRes = await fetch(`${baseUrl}/api/announcements/${createdId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(toggleBackRes.status, 200);
    const toggleBackData = await toggleBackRes.json();
    assert.equal(toggleBackData.data.is_active, true, "Status should be toggled back to true");
    console.log(`   ✅ Toggled status back to is_active: true`);

    // 6. Test Admin Endpoint: DELETE /api/announcements/:id (Delete)
    console.log(`6. Testing DELETE /api/announcements/${createdId} (Delete)...`);
    const delRes = await fetch(`${baseUrl}/api/announcements/${createdId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(delRes.status, 200, "Delete endpoint must return 200");
    const checkDeleted = await Announcement.findByPk(createdId);
    assert.equal(checkDeleted, null, "Deleted announcement must no longer exist in DB");
    console.log(`   ✅ Deleted announcement ID ${createdId} confirmed removed from DB`);

    // 7. Verify Homepage Payload includes activeAnnouncement
    console.log("7. Testing GET /api/home returns activeAnnouncement...");
    const homeRes = await fetch(`${baseUrl}/api/home`);
    assert.equal(homeRes.status, 200, "Home endpoint must return 200");
    const homeData = await homeRes.json();
    assert.ok("activeAnnouncement" in homeData.data, "Home payload must contain activeAnnouncement field");
    console.log("   ✅ Home payload contains activeAnnouncement:", Boolean(homeData.data.activeAnnouncement));

    console.log("\n=======================================================");
    console.log("🎉 ALL ANNOUNCEMENT SYSTEM TESTS PASSED SUCCESSFULLY!");
    console.log("=======================================================\n");
  } finally {
    server.close();
  }

  process.exit(0);
}

runVerification().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
