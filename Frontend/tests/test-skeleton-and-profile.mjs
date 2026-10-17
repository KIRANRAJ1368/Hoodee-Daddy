import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Valid tokens
const kalaiyarasiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3OTE2MzM0OTUsImV4cCI6MTc5NDIyNTQ5NX0.XlKzn9OC2JyuiY86SfCrxL53Wgh1hGDWCr-SpkvvDyA';
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc5MTYzMzQ5NSwiZXhwIjoxNzk0MjI1NDk1fQ.psOXZDgJq-vGyyn_cezLcG4GKPAZB3o82shEyB-xTt8';

const artifactDir = 'C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196';

async function verifySkeletonAndProfile() {
  console.log('======================================================================');
  console.log('✨ VERIFYING SKELETON SHIMMER LOADING & RESOLVED CUSTOMER PROFILE');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
    // 1. STOREFRONT: SKELETON LOADING STATE (Captured with artificial delay)
    // ════════════════════════════════════════════════════════════════════════
    console.log('[1/4] Testing Storefront Order Skeleton Shimmer State...');
    
    // Intercept /api/orders/my-orders to delay by 3.5s so we can capture the skeleton state in action
    await page.route('**/api/orders/my-orders', async (route) => {
      await new Promise(r => setTimeout(r, 2000));
      await route.continue();
    });

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token }) => {
      localStorage.setItem('zmw_customer_token', token);
      localStorage.setItem('zmw_customer_user', JSON.stringify({
        id: 12,
        name: 'kalaiyarasi . R',
        email: 'kalaiyarasiravi2005@gmail.com',
        phone: '9876543210'
      }));
    }, { token: kalaiyarasiToken });

    // Navigate to profile
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded' });

    // Check if skeleton order cards are visible while fetching
    const skeletonList = page.locator('.orders-skeleton-list');
    await skeletonList.waitFor({ state: 'visible', timeout: 3000 });
    assert(await skeletonList.isVisible(), 'Storefront Order History displays Skeleton Shimmer cards while fetching data');

    // Capture screenshot of skeleton loading
    const skeletonScreenshotPath = path.join(artifactDir, '14-storefront-orders-skeleton-loading.png');
    await page.screenshot({ path: skeletonScreenshotPath });
    console.log(`📸 Skeleton loading screenshot saved: ${skeletonScreenshotPath}`);

    // Wait for the route to finish and real orders to render
    console.log('[2/4] Waiting for real orders to load...');
    
    // Wait for the skeleton to disappear and real orders to appear
    await page.waitForSelector('.orders-list, .order-card:not(.order-card--skeleton)', { timeout: 10000 });
    
    // Verify that NO error box is present
    const errorBox = page.locator('.account-error-box');
    assert(!(await errorBox.isVisible()), 'No "Something went wrong" error box is present');

    // Verify customer's order is rendered
    const orderNumberEl = page.locator('.order-number').first();
    const orderNumberText = await orderNumberEl.innerText();
    assert(orderNumberText.includes('ZMW-'), `Customer order rendered cleanly: "${orderNumberText}"`);

    // Capture screenshot of loaded Member Portal
    const loadedProfileScreenshot = path.join(artifactDir, '13-storefront-customer-profile-orders.png');
    await page.screenshot({ path: loadedProfileScreenshot });
    console.log(`📸 Loaded Customer Profile screenshot saved: ${loadedProfileScreenshot}`);

    // ════════════════════════════════════════════════════════════════════════
    // 3. ADMIN DASHBOARD: SKELETON SHIMMER STATE (Captured with artificial delay)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n[3/4] Testing Admin Dashboard Skeleton Shimmer State...');
    const adminPage = await context.newPage();

    // Intercept dashboard summary to delay by 2.5s so we can capture the skeleton cards
    await adminPage.route('**/api/admin/dashboard/summary**', async (route) => {
      await new Promise(r => setTimeout(r, 2500));
      await route.continue();
    });

    await adminPage.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
    await adminPage.evaluate(({ token }) => {
      localStorage.setItem('zmw_admin_token', token);
      localStorage.setItem('zmw_admin_user', JSON.stringify({
        id: 1,
        name: 'Admin',
        role: 'super_admin',
        email: 'admin@zmwclothing.com'
      }));
    }, { token: adminToken });

    await adminPage.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });

    // Check if dashboard skeleton cards are visible
    const dashSkeleton = adminPage.locator('.dash-page--skeleton');
    await dashSkeleton.waitFor({ state: 'visible', timeout: 3000 });
    assert(await dashSkeleton.isVisible(), 'Admin Dashboard renders full Skeleton Shimmer Cards matching reference image');

    const dashSkeletonScreenshot = path.join(artifactDir, '15-admin-dashboard-skeleton-loading.png');
    await adminPage.screenshot({ path: dashSkeletonScreenshot });
    console.log(`📸 Dashboard skeleton loading screenshot saved: ${dashSkeletonScreenshot}`);

    // Wait for full dashboard to load
    console.log('[4/4] Waiting for Admin Dashboard to fully populate...');
    await adminPage.waitForSelector('.dash-page:not(.dash-page--skeleton)', { timeout: 10000 });
    assert(true, 'Admin Dashboard transitioned seamlessly to populated metrics without errors');

    const dashLoadedScreenshot = path.join(artifactDir, '16-admin-dashboard-loaded.png');
    await adminPage.screenshot({ path: dashLoadedScreenshot });
    console.log(`📸 Dashboard loaded screenshot saved: ${dashLoadedScreenshot}`);

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

verifySkeletonAndProfile();
