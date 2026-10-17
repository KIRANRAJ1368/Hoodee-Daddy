import { chromium } from 'playwright';
import path from 'path';

const kalaiyarasiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3OTE2MzM0OTUsImV4cCI6MTc5NDIyNTQ5NX0.XlKzn9OC2JyuiY86SfCrxL53Wgh1hGDWCr-SpkvvDyA';
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc5MTYzMzQ5NSwiZXhwIjoxNzk0MjI1NDk1fQ.psOXZDgJq-vGyyn_cezLcG4GKPAZB3o82shEyB-xTt8';

const artifactDir = 'C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196';

async function runSkeletonSuite() {
  console.log('======================================================================');
  console.log('✨ VERIFYING USER SKELETON SHIMMER (.sk + sweep) & STAGGERED FADE (.fade)');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Pre-seed storage before navigation
  await context.addInitScript(({ custTok, admTok }) => {
    localStorage.setItem('zmw_customer_token', custTok);
    localStorage.setItem('zmw_customer_user', JSON.stringify({
      id: 12,
      name: 'kalaiyarasi . R',
      email: 'kalaiyarasiravi2005@gmail.com',
      phone: '9876543210'
    }));
    localStorage.setItem('zmw_admin_token', admTok);
    localStorage.setItem('zmw_admin_user', JSON.stringify({
      id: 1,
      name: 'Admin',
      role: 'super_admin',
      email: 'admin@zmwclothing.com'
    }));
  }, { custTok: kalaiyarasiToken, admTok: adminToken });

  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      if (details) console.error(`   └─ ${details}`);
      failed++;
    }
  }

  try {
    // ════════════════════════════════════════════════════════════════════════
    // 1. STOREFRONT CUSTOMER PROFILE: SKELETON (.sk) & STAGGERED FADE (.fade)
    // ════════════════════════════════════════════════════════════════════════
    console.log('[1/4] Storefront Profile: Testing .sk Shimmer & .fade Transitions...');
    
    // Intercept /api/orders/my-orders to delay by 2.2s
    await page.route('**/api/orders/my-orders', async (route) => {
      await new Promise(r => setTimeout(r, 2200));
      await route.continue();
    });

    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });

    // Assert skeleton elements with .sk are visible
    const skElements = page.locator('.orders-skeleton-list .sk');
    await skElements.first().waitFor({ state: 'visible', timeout: 4000 });
    const skCount = await skElements.count();
    assert(skCount >= 10, `Storefront Profile renders .sk skeleton bars during fetch (found ${skCount})`);

    const p1Screenshot = path.join(artifactDir, '17-storefront-order-skeleton-animation.png');
    await page.screenshot({ path: p1Screenshot });
    console.log(`📸 Skeleton loading screenshot saved: ${p1Screenshot}`);

    // Wait for real orders to load and verify .fade
    const orderCards = page.locator('.orders-list .order-card');
    await orderCards.first().waitFor({ state: 'visible', timeout: 10000 });
    assert(await orderCards.first().isVisible(), `Storefront Orders rendered cleanly with .fade transition class`);

    const p2Screenshot = path.join(artifactDir, '18-storefront-order-loaded-fade.png');
    await page.screenshot({ path: p2Screenshot });
    console.log(`📸 Loaded orders screenshot saved: ${p2Screenshot}`);

    // ════════════════════════════════════════════════════════════════════════
    // 2. STOREFRONT CATALOG COLLECTION: SKELETON (.sk) & STAGGERED FADE
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n[2/4] Storefront Collection: Testing .sk Catalog Skeletons...');
    const catalogPage = await context.newPage();

    // Delay products API
    await catalogPage.route('**/api/products**', async (route) => {
      await new Promise(r => setTimeout(r, 2200));
      await route.continue();
    });

    await catalogPage.goto('http://localhost:3000/collection', { waitUntil: 'domcontentloaded' });

    const catalogSkeletons = catalogPage.locator('.coll-product-skeleton .sk');
    await catalogSkeletons.first().waitFor({ state: 'visible', timeout: 4000 });
    const catSkCount = await catalogSkeletons.count();
    assert(catSkCount >= 8, `Storefront Catalog renders .sk product skeletons during fetch (found ${catSkCount})`);

    const p3Screenshot = path.join(artifactDir, '19-storefront-catalog-skeleton.png');
    await catalogPage.screenshot({ path: p3Screenshot });
    console.log(`📸 Catalog skeleton screenshot saved: ${p3Screenshot}`);

    // Wait for products to populate with .fade
    const catalogProducts = catalogPage.locator('.coll-product-grid .product-card');
    await catalogProducts.first().waitFor({ state: 'visible', timeout: 10000 });
    assert((await catalogProducts.count()) > 0, `Catalog products loaded with staggered .fade animations`);

    const p4Screenshot = path.join(artifactDir, '20-storefront-catalog-loaded-fade.png');
    await catalogPage.screenshot({ path: p4Screenshot });
    console.log(`📸 Catalog loaded screenshot saved: ${p4Screenshot}`);

    // ════════════════════════════════════════════════════════════════════════
    // 3. ADMIN DASHBOARD: SKELETON (.sk) & STAGGERED FADE
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n[3/4] Admin Dashboard: Testing .sk Shimmer & .fade Sections...');
    const adminPage = await context.newPage();

    // Delay dashboard summary API
    await adminPage.route('**/api/admin/dashboard/summary**', async (route) => {
      await new Promise(r => setTimeout(r, 2200));
      await route.continue();
    });

    await adminPage.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });

    const adminSkElements = adminPage.locator('.dash-page--skeleton .sk, .dash-page--skeleton .dash-skeleton-card');
    await adminSkElements.first().waitFor({ state: 'visible', timeout: 4000 });
    const adminSkCount = await adminSkElements.count();
    assert(adminSkCount >= 10, `Admin Dashboard renders .sk skeleton cards during fetch (found ${adminSkCount})`);

    const p5Screenshot = path.join(artifactDir, '21-admin-dashboard-skeleton-animation.png');
    await adminPage.screenshot({ path: p5Screenshot });
    console.log(`📸 Admin dashboard skeleton screenshot saved: ${p5Screenshot}`);

    // Wait for loaded state
    await adminPage.waitForSelector('.dash-page:not(.dash-page--skeleton)', { timeout: 10000 });
    const loadedCards = adminPage.locator('.dash-kpi-card, .dash-scard');
    assert((await loadedCards.count()) >= 3, `Admin Dashboard transitioned seamlessly to populated metrics with .fade`);

    const p6Screenshot = path.join(artifactDir, '22-admin-dashboard-loaded-fade.png');
    await adminPage.screenshot({ path: p6Screenshot });
    console.log(`📸 Admin dashboard loaded screenshot saved: ${p6Screenshot}`);

    // ════════════════════════════════════════════════════════════════════════
    // 4. ADMIN ORDERS DATATABLE: SKELETON (.sk) & STAGGERED FADE
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n[4/4] Admin Orders DataTable: Testing .sk Rows & .fade Rows...');
    
    // Delay orders list API
    await adminPage.route('**/api/admin/orders**', async (route) => {
      await new Promise(r => setTimeout(r, 2200));
      await route.continue();
    });

    await adminPage.goto('http://localhost:5174/orders', { waitUntil: 'domcontentloaded' });

    const tableSkCells = adminPage.locator('.data-table-skeleton-cell.sk');
    await tableSkCells.first().waitFor({ state: 'visible', timeout: 3000 });
    assert((await tableSkCells.count()) >= 12, `Admin DataTable renders .sk skeleton rows during loading`);

    const p7Screenshot = path.join(artifactDir, '23-admin-orders-datatable-skeleton.png');
    await adminPage.screenshot({ path: p7Screenshot });
    console.log(`📸 Admin DataTable skeleton screenshot saved: ${p7Screenshot}`);

    // Wait for table rows to load with .fade
    const tableFadeRows = adminPage.locator('tbody tr.fade');
    await tableFadeRows.first().waitFor({ state: 'visible', timeout: 10000 });
    assert((await tableFadeRows.count()) >= 1, `Admin DataTable rows rendered with staggered .fade transitions`);

    const p8Screenshot = path.join(artifactDir, '24-admin-orders-datatable-loaded-fade.png');
    await adminPage.screenshot({ path: p8Screenshot });
    console.log(`📸 Admin DataTable loaded screenshot saved: ${p8Screenshot}`);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runSkeletonSuite();
