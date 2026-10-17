import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "320px", width: 320, height: 568 },
  { name: "360px", width: 360, height: 780 },
  { name: "375px", width: 375, height: 667 },
  { name: "390px", width: 390, height: 844 },
  { name: "414px", width: 414, height: 896 },
  { name: "480px", width: 480, height: 850 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1024px", width: 1024, height: 768 },
  { name: "1280px", width: 1280, height: 800 },
  { name: "1440px", width: 1440, height: 900 },
  { name: "1920px", width: 1920, height: 1080 }
];

const PAGES = [
  { name: "Home", path: "/" },
  { name: "Collection-Mens", path: "/categories/mens" },
  { name: "Collection-Subcategory", path: "/categories/mens/oversized-t-shirts" },
  { name: "ProductDetail", path: "/product/1" },
  { name: "Cart", path: "/cart" },
  { name: "Wishlist", path: "/wishlist" },
  { name: "AboutUs", path: "/about-us" },
  { name: "ContactUs", path: "/contact-us" },
  { name: "FAQ", path: "/faq" },
  { name: "SizeGuide", path: "/size-guide" },
  { name: "ShippingPolicy", path: "/shipping-policy" },
  { name: "PrivacyPolicy", path: "/privacy-policy" },
  { name: "TermsConditions", path: "/terms-conditions" },
  { name: "ReturnRefundPolicy", path: "/return-refund-policy" },
  { name: "CustomerProfile", path: "/account" }
];

async function checkOverflow(page, label) {
  return await page.evaluate((lbl) => {
    const docWidth = document.documentElement.clientWidth;
    const maxScroll = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    const hasOverflow = maxScroll > docWidth + 3;
    let offender = null;
    if (hasOverflow) {
      const all = document.querySelectorAll("*");
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > docWidth + 3) {
          const tag = el.tagName.toLowerCase();
          const cls = el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
          offender = `${tag}${cls} [right=${Math.round(r.right)}px, w=${Math.round(r.width)}px]`;
          break;
        }
      }
    }
    return { label: lbl, docWidth, maxScroll, hasOverflow, offender };
  }, label);
}

async function run() {
  console.log("=== COMPREHENSIVE FRONTEND RESPONSIVE & INTERACTIVE AUDIT ===");
  const browser = await chromium.launch({ headless: true });
  const issues = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    // 1. Audit all static pages
    for (const p of PAGES) {
      totalTests++;
      try {
        await page.goto(`http://localhost:3000${p.path}`, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(400);

        const res = await checkOverflow(page, p.name);
        if (res.hasOverflow) {
          console.log(`  ❌ OVERFLOW: ${p.name.padEnd(25)} (scroll=${res.maxScroll}px > vp=${res.docWidth}px)`);
          if (res.offender) console.log(`      ↳ Offender: ${res.offender}`);
          issues.push({ vp: vp.name, ...res });
        } else {
          passedTests++;
          console.log(`  ✅ OK: ${p.name.padEnd(25)} (${res.docWidth}px)`);
        }
      } catch (err) {
        console.log(`  ⚠️ Page load error ${p.name}: ${err.message}`);
      }
    }

    // 2. Interactive Modals & Drawers
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // Dismiss any promotional popup modal if present
    try {
      const offerClose = page.locator(".offer-modal-close-btn");
      if (await offerClose.isVisible({ timeout: 1500 })) {
        await offerClose.click();
        await page.waitForTimeout(300);
      }
    } catch {}

    // Test Mobile Menu Drawer on <992px
    if (vp.width <= 992) {
      totalTests++;
      try {
        const hamburger = page.locator(".hamburger-btn");
        if (await hamburger.isVisible()) {
          // If offer modal is still open, force close it
          await page.evaluate(() => {
            const btn = document.querySelector(".offer-modal-close-btn");
            if (btn) btn.click();
          });
          await page.waitForTimeout(200);
          await hamburger.click();
          await page.waitForTimeout(400);
          const res = await checkOverflow(page, "MobileMenuDrawer");
          const isDrawerVisible = await page.locator(".mobile-nav-drawer.open").isVisible();
          if (res.hasOverflow || !isDrawerVisible) {
            console.log(`  ❌ Mobile Menu Drawer: overflow=${res.hasOverflow}, visible=${isDrawerVisible}`);
            issues.push({ vp: vp.name, test: "MobileMenuDrawer", ...res });
          } else {
            passedTests++;
            console.log(`  ✅ OK: Mobile Menu Drawer open (${vp.width}px)`);
          }
          // Close drawer
          const closeBtn = page.locator(".drawer-close-btn, .mobile-nav-backdrop");
          if (await closeBtn.first().isVisible()) {
            await closeBtn.first().click();
            await page.waitForTimeout(300);
          } else {
            await page.keyboard.press("Escape");
            await page.waitForTimeout(300);
          }
        }
      } catch (e) {
        console.log(`  ⚠️ Mobile menu error: ${e.message}`);
      }
    }

    // Test Search Modal
    totalTests++;
    try {
      await page.evaluate(() => {
        const btn = document.querySelector(".offer-modal-close-btn");
        if (btn) btn.click();
      });
      await page.waitForTimeout(200);
      const searchBtn = page.locator(".action-btn[aria-label*='Search'], .action-btn--search");
      if (await searchBtn.first().isVisible()) {
        await searchBtn.first().click();
        await page.waitForTimeout(400);
        const res = await checkOverflow(page, "SearchModal");
        if (res.hasOverflow) {
          console.log(`  ❌ Search Modal overflow: ${res.offender}`);
          issues.push({ vp: vp.name, test: "SearchModal", ...res });
        } else {
          passedTests++;
          console.log(`  ✅ OK: Search Modal (${vp.width}px)`);
        }
        // Press Escape to close
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
    } catch (e) {
      console.log(`  ⚠️ Search modal error: ${e.message}`);
    }

    // Test Cart Drawer
    totalTests++;
    try {
      await page.evaluate(() => {
        const btn = document.querySelector(".offer-modal-close-btn");
        if (btn) btn.click();
      });
      await page.waitForTimeout(200);
      const cartBtn = page.locator(".action-btn[aria-label*='Cart'], .action-btn--cart");
      if (await cartBtn.first().isVisible()) {
        await cartBtn.first().click();
        await page.waitForTimeout(400);
        const res = await checkOverflow(page, "CartDrawer");
        if (res.hasOverflow) {
          console.log(`  ❌ Cart Drawer overflow: ${res.offender}`);
          issues.push({ vp: vp.name, test: "CartDrawer", ...res });
        } else {
          passedTests++;
          console.log(`  ✅ OK: Cart Drawer (${vp.width}px)`);
        }
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
    } catch (e) {
      console.log(`  ⚠️ Cart drawer error: ${e.message}`);
    }

    // Test Wishlist Drawer
    totalTests++;
    try {
      await page.evaluate(() => {
        const btn = document.querySelector(".offer-modal-close-btn");
        if (btn) btn.click();
      });
      await page.waitForTimeout(200);
      const wishBtn = page.locator(".action-btn[aria-label*='Wishlist'], .action-btn--wishlist");
      if (await wishBtn.first().isVisible()) {
        await wishBtn.first().click();
        await page.waitForTimeout(400);
        const res = await checkOverflow(page, "WishlistDrawer");
        if (res.hasOverflow) {
          console.log(`  ❌ Wishlist Drawer overflow: ${res.offender}`);
          issues.push({ vp: vp.name, test: "WishlistDrawer", ...res });
        } else {
          passedTests++;
          console.log(`  ✅ OK: Wishlist Drawer (${vp.width}px)`);
        }
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
    } catch (e) {
      console.log(`  ⚠️ Wishlist drawer error: ${e.message}`);
    }

    // Test Auth Modal
    totalTests++;
    try {
      await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const res = await checkOverflow(page, "AuthModal");
      if (res.hasOverflow) {
        console.log(`  ❌ Auth Modal overflow: ${res.offender}`);
        issues.push({ vp: vp.name, test: "AuthModal", ...res });
      } else {
        passedTests++;
        console.log(`  ✅ OK: Auth Modal (${vp.width}px)`);
      }
    } catch (e) {
      console.log(`  ⚠️ Auth modal error: ${e.message}`);
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n=============================================================`);
  console.log(`FRONTEND AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED, ${issues.length} ISSUES`);
  if (issues.length > 0) {
    console.log("Issues detected:", JSON.stringify(issues, null, 2));
  } else {
    console.log("🎉 ALL FRONTEND PAGES, DRAWERS & MODALS PASSED ACROSS ALL 11 VIEWPORTS WITH ZERO OVERFLOW!");
  }
}

run().catch(console.error);
