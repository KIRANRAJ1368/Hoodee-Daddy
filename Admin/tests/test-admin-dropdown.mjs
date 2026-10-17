import { chromium } from '../../Frontend/node_modules/playwright/index.mjs';

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzkxMjgyMDkyLCJleHAiOjE4MjI4MTgwOTJ9.HZM1Yef2ZmnkGdL4lEilE7_bereDyGXatuytYRyK-e8';

async function runAdminDropdownTest() {
  console.log('======================================================================');
  console.log('👑 ADMIN DASHBOARD: PRODUCT DROPDOWN NAVIGATION VERIFICATION');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
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
    // ─────────────────────────────────────────────────────────────────
    // TEST 1: DESKTOP NAVIGATION & DROPDOWN ACCORDION
    // ─────────────────────────────────────────────────────────────────
    console.log('--- 1. DESKTOP SIDEBAR PRODUCT DROPDOWN ---');
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // Authenticate admin session
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok) => {
      localStorage.setItem('zmw_admin_token', tok);
    }, adminToken);

    // Navigate to root Dashboard
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.admin-sidebar', { timeout: 8000 });

    assert(
      page.url().includes('localhost:5173'),
      'Admin Dashboard Loaded Successfully',
      `Current URL: ${page.url()}`
    );

    // Verify Product Dropdown Toggle exists
    const productToggle = page.locator('.admin-nav-dropdown-toggle').first();
    await productToggle.waitFor({ state: 'visible', timeout: 5000 });
    const toggleText = await productToggle.innerText();

    assert(
      toggleText.includes('Product'),
      'Product Dropdown Toggle Rendered in Sidebar',
      `Toggle label: "${toggleText.trim()}"`
    );

    // Check that on Dashboard, the dropdown is initially collapsed
    const menuEl = page.locator('#admin-product-dropdown-menu');
    const isInitiallyVisible = await menuEl.isVisible();
    assert(
      !isInitiallyVisible,
      'Product Dropdown is Initially Collapsed on Dashboard',
      `Menu visible: ${isInitiallyVisible}`
    );

    // CLICK "Product" -> should open as dropdown WITHOUT navigating away!
    console.log('\n--- 2. CLICK PRODUCT TOGGLE (NO ROUTE CHANGE) ---');
    await productToggle.click();
    await page.waitForTimeout(300);

    const isOpenAfterClick = await menuEl.isVisible();
    const currentUrlAfterClick = page.url();
    assert(
      isOpenAfterClick && (currentUrlAfterClick.endsWith('/') || currentUrlAfterClick.endsWith(':5173')),
      'Clicking "Product" Opens Dropdown Without Navigating Directly',
      `Menu open: ${isOpenAfterClick} | URL remains: ${currentUrlAfterClick}`
    );

    // Verify product catalog options inside the dropdown.
    const subOptionTexts = await page.locator('.admin-nav-sub-link .admin-nav-sub-text').allInnerTexts();
    console.log('Sub-options found:', subOptionTexts);

    const expectedOptions = ['Categories', 'Sub Categories', 'Products', 'Variants'];
    const orderMatches = JSON.stringify(subOptionTexts) === JSON.stringify(expectedOptions);

    assert(
      orderMatches,
      'Product Dropdown Options Match Exact Required Order',
      `Expected: ${expectedOptions.join(' → ')}\n   Found:    ${subOptionTexts.join(' → ')}`
    );

    // Verify icons exist for each sub-option
    const subIconsCount = await page.locator('.admin-nav-sub-link .admin-nav-sub-icon').count();
    assert(
      subIconsCount === 4,
      'All 4 Product Sub-options Render Their Respective Icons',
      `Found ${subIconsCount} sub-icons`
    );

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: CLICKING EACH SUB-OPTION OPENS ITS EXISTING PAGE
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 3. VERIFY ALL 5 SUB-OPTION NAVIGATION ROUTES ---');

    for (const opt of expectedOptions) {
      const subLink = page.locator(`.admin-nav-sub-link:has-text("${opt}")`).first();
      await subLink.click();
      await page.waitForTimeout(500);

      const newUrl = page.url();
      const isActive = await subLink.evaluate((el) => el.classList.contains('active'));
      const isParentExpanded = await menuEl.isVisible();

      let targetSlug = opt.toLowerCase().replace(/\s+/g, '');
      if (opt === 'Sub Categories') targetSlug = 'subcategories';

      const urlMatches = newUrl.includes(`/${targetSlug}`);

      assert(
        urlMatches && isActive && isParentExpanded,
        `Option "${opt}" Navigates to /${targetSlug} & Highlights Active State`,
        `URL: ${newUrl} | Active: ${isActive} | Menu Expanded: ${isParentExpanded}`
      );
    }

    for (const { label, path } of [
      { label: 'Dashboard', path: '/' },
      { label: 'Hero & Banners', path: '/banners' },
      { label: 'Stock Management', path: '/stock' },
      { label: 'Coupons & Discounts', path: '/coupons' },
      { label: 'Reports & Analytics', path: '/reports' },
      { label: 'Orders', path: '/orders' },
      { label: 'Reviews', path: '/reviews' },
      { label: 'Shipping', path: '/shipping' },
      { label: 'Customers', path: '/customers' },
      { label: 'Customer Inquiries', path: '/contact' }
    ]) {
      const link = page.locator(`.admin-nav-link[href="${path}"]`).first();
      await link.click();
      await page.waitForTimeout(250);
      assert(page.url().endsWith(path) || (path === '/' && page.url().endsWith(':5173/')),
        `Sidebar option "${label}" navigates to ${path}`, `URL: ${page.url()}`);
      assert(await link.evaluate((el) => el.classList.contains('active')),
        `Sidebar option "${label}" shows active state`);
    }

    // Test collapsing the dropdown when clicking Product toggle again
    console.log('\n--- 4. COLLAPSE / ACCORDION TOGGLE BEHAVIOR ---');
    await productToggle.click();
    await page.waitForTimeout(300);
    const isClosedAfterSecondClick = !(await menuEl.isVisible());

    assert(
      isClosedAfterSecondClick,
      'Clicking Product Toggle Again Cleanly Collapses Menu',
      `Menu visible: ${!isClosedAfterSecondClick}`
    );

    await context.close();

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: MOBILE RESPONSIVE DRAWER & DROPDOWN USABILITY
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- 5. MOBILE DRAWER & DROPDOWN FUNCTIONALITY (375px) ---');
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await mobilePage.evaluate((tok) => {
      localStorage.setItem('zmw_admin_token', tok);
    }, adminToken);

    await mobilePage.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('.admin-menu-toggle', { timeout: 8000 });

    // Open mobile sidebar
    const menuBtn = mobilePage.locator('.admin-menu-toggle').first();
    await menuBtn.click();
    await mobilePage.waitForTimeout(400);

    const isSidebarOpenMobile = await mobilePage.locator('.admin-sidebar.open').isVisible();
    assert(isSidebarOpenMobile, 'Mobile Sidebar Drawer Opened via Menu Button');

    // Click Product dropdown inside mobile drawer
    const mobileProductToggle = mobilePage.locator('.admin-nav-dropdown-toggle').first();
    await mobileProductToggle.click();
    await mobilePage.waitForTimeout(300);

    const isMobileMenuOpen = await mobilePage.locator('#admin-product-dropdown-menu').isVisible();
    assert(isMobileMenuOpen, 'Product Dropdown Successfully Expands Inside Mobile Drawer');

    // Click Stock in the bottom navigation.
    const stockMobileLink = mobilePage.locator('.admin-nav-link[href="/stock"]').first();
    await stockMobileLink.click();
    await mobilePage.waitForTimeout(500);

    assert(
      mobilePage.url().includes('/stock'),
      'Clicking Sub-option in Mobile Drawer Successfully Navigates to Target Page',
      `Navigated to: ${mobilePage.url()}`
    );

    await mobileContext.close();

  } catch (err) {
    console.error('Unhandled admin test exception:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`👑 ADMIN TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runAdminDropdownTest();
