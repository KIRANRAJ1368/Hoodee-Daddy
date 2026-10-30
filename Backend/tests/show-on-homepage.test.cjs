const assert = require("node:assert/strict");
const { sequelize, Product, Category } = require("../src/models");
const { serializeProduct } = require("../src/services/productSerializer");
const productController = require("../src/controllers/productController");

async function runTests() {
  console.log("▶ Starting Show on Home Page test suite...");

  // 1. Verify DB schema column exists and defaults to 0 / false
  const [cols] = await sequelize.query("SHOW COLUMNS FROM products LIKE 'show_on_homepage'");
  assert.equal(cols.length, 1, "products table must have show_on_homepage column");
  assert.equal(cols[0].Default, "0", "show_on_homepage must default to 0");
  console.log("✔ Test 1 passed: Database column show_on_homepage exists with default 0");

  // 2. Create a clean active category for testing
  const testCategory = await Category.create({
    name: "Test Cat " + Date.now(),
    slug: "test-cat-" + Date.now(),
    is_active: true,
    show_on_homepage: true
  });
  const categoryId = testCategory.id;

  // 3. Test Product creation with show_on_homepage
  const testProduct = await Product.create({
    name: "Homepage Test Product " + Date.now(),
    slug: "hp-test-" + Date.now(),
    sku: "HP-SKU-" + Date.now(),
    category_id: categoryId,
    price: 999.0,
    is_active: true,
    show_on_homepage: false
  });
  assert.equal(testProduct.show_on_homepage, false, "Initial show_on_homepage must be false");
  console.log("✔ Test 2 passed: Product created with show_on_homepage = false");

  // 4. Test Serializer
  const serialized = serializeProduct(testProduct);
  assert.equal(serialized.showOnHomepage, false, "Serializer must export showOnHomepage: false");
  console.log("✔ Test 3 passed: Serializer output includes showOnHomepage: false");

  // 5. Test toggleShowOnHomepage Controller method
  let toggleResult = null;
  const mockToggleReq = {
    params: { id: testProduct.id },
    body: { value: true }
  };
  const mockToggleRes = {
    status: () => mockToggleRes,
    json: (resData) => {
      toggleResult = resData;
      return mockToggleRes;
    }
  };

  await productController.toggleShowOnHomepage(mockToggleReq, mockToggleRes);
  assert.equal(toggleResult?.data?.show_on_homepage, true, "Controller must return show_on_homepage: true");

  await testProduct.reload();
  assert.equal(testProduct.show_on_homepage, true, "Product show_on_homepage in DB must be true after toggle controller call");
  console.log("✔ Test 4 passed: productController.toggleShowOnHomepage toggles and saves in DB");

  // 6. Test homepageController getHomePayload logic
  const mockReq = {};
  let payloadData = null;
  const mockRes = {
    status: () => mockRes,
    json: (result) => {
      payloadData = result.data;
      return mockRes;
    }
  };

  const homepageController = require("../src/controllers/homepageController");
  await homepageController.getHomePayload(mockReq, mockRes);
  assert.ok(payloadData, "getHomePayload must return data");

  const catEntry = payloadData.categories.find((c) => c.id === categoryId);
  assert.ok(catEntry, "Active category must be present in home payload");
  const foundTestProd = catEntry.products.find((p) => p.id === testProduct.id);
  assert.ok(foundTestProd, "Product with show_on_homepage: true MUST appear on homepage category products");
  console.log("✔ Test 5 passed: Checked product appears in homepage category products");

  // 7. Test unchecking product via controller: must disappear from homepage
  mockToggleReq.body.value = false;
  await productController.toggleShowOnHomepage(mockToggleReq, mockToggleRes);
  assert.equal(toggleResult?.data?.show_on_homepage, false, "Controller must return show_on_homepage: false");

  await homepageController.getHomePayload(mockReq, mockRes);
  const catEntryAfterUncheck = payloadData.categories.find((c) => c.id === categoryId);
  const foundTestProdAfterUncheck = catEntryAfterUncheck.products.find((p) => p.id === testProduct.id);
  assert.equal(foundTestProdAfterUncheck, undefined, "Unchecked product MUST NOT appear on homepage");
  console.log("✔ Test 6 passed: Unchecked product is removed from homepage category products");

  // 8. Test 4-product maximum limit
  // Create 6 products with show_on_homepage: true for a test category
  const testLimitCat = await Category.create({
    name: "Limit Test Cat " + Date.now(),
    slug: "limit-test-" + Date.now(),
    is_active: true,
    show_on_homepage: true
  });

  const createdProds = [];
  for (let i = 1; i <= 6; i++) {
    const p = await Product.create({
      name: `Limit Prod ${i} ` + Date.now(),
      slug: `limit-prod-${i}-` + Date.now(),
      sku: `LIMIT-${i}-` + Date.now(),
      category_id: testLimitCat.id,
      price: 499.0,
      is_active: true,
      show_on_homepage: true
    });
    createdProds.push(p);
  }

  await homepageController.getHomePayload(mockReq, mockRes);
  const limitCatEntry = payloadData.categories.find((c) => c.id === testLimitCat.id);
  assert.ok(limitCatEntry, "Limit test category must be in home payload");
  assert.equal(
    limitCatEntry.products.length,
    4,
    `Category must strictly contain at most 4 products on homepage even when 6 are checked (got ${limitCatEntry.products.length})`
  );
  console.log("✔ Test 7 passed: Strict 4-product maximum limit is enforced on homepage");

  // Cleanup test data
  for (const p of createdProds) {
    await p.destroy();
  }
  await testLimitCat.destroy();
  await testProduct.destroy();

  console.log("🎉 All Show on Home Page tests passed successfully!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
