import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "C:\\Users\\KIRAN\\.gemini\\antigravity\\brain\\de0699db-1fa1-4de9-a41d-0878ae2d76ff";

async function runTests() {
  console.log("🚀 Starting Navbar & Subcategory Navigation Tests...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const dismissModal = async () => {
    try {
      const btn = page.locator(".offer-modal-close-btn");
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    } catch (e) {}
  };

  const results = [];

  try {
    // 1. Visit Home Page
    console.log("📍 Test 1: Home page loading & Navbar spacing check");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Dismiss offer modal if visible
    const modalCloseBtn = page.locator(".offer-modal-close-btn");
    if (await modalCloseBtn.isVisible().catch(() => false)) {
      await modalCloseBtn.click();
      await page.waitForTimeout(400);
    }

    // Measure spacing between category label and caret arrow
    const caretSpacingInfo = await page.evaluate(() => {
      const links = document.querySelectorAll(".nav-item.has-dropdown .nav-link");
      const info = [];
      links.forEach((link) => {
        const span = link.querySelector("span");
        const svg = link.querySelector(".nav-caret");
        if (span && svg) {
          const spanRect = span.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          const gap = svgRect.left - spanRect.right;
          info.push({
            name: span.textContent.trim(),
            gap: Math.round(gap),
            spanRight: spanRect.right,
            svgLeft: svgRect.left
          });
        }
      });
      return info;
    });
    console.log("Caret spacing per category:", caretSpacingInfo);
    const maxGap = Math.max(...caretSpacingInfo.map((c) => c.gap));
    const spacingPassed = maxGap <= 10 && maxGap >= 2;
    results.push({
      test: "Navbar Caret Spacing (Immediate beside label, <= 10px)",
      passed: spacingPassed,
      details: caretSpacingInfo
    });

    // 2. Hover Dropdown Test
    console.log("📍 Test 2: Hover over GIRLS dropdown");
    const girlsItem = page.locator(".nav-item.has-dropdown", { hasText: "Girls" }).first();
    await girlsItem.hover();
    await page.waitForTimeout(300);

    const dropdownVisible = await page.locator(".mega-dropdown").isVisible();
    console.log("Mega dropdown visible on hover:", dropdownVisible);

    // Hover into the dropdown panel itself
    await page.locator(".mega-dropdown").hover();
    await page.waitForTimeout(300);
    const dropdownStaysOpen = await page.locator(".mega-dropdown").isVisible();
    console.log("Mega dropdown stays open when hovered:", dropdownStaysOpen);

    // Screenshot of dropdown open
    const dropdownScreenshot = path.join(ARTIFACTS_DIR, "test_dropdown_hover.png");
    await page.screenshot({ path: dropdownScreenshot, fullPage: false });

    // Move mouse out to header logo and wait for close
    await page.locator(".brand-logo").hover();
    await page.waitForTimeout(400);
    const dropdownClosed = !(await page.locator(".mega-dropdown").isVisible());
    console.log("Mega dropdown closed after mouse leave:", dropdownClosed);

    results.push({
      test: "Category Dropdown Hover Open/Keep-Open/Close",
      passed: dropdownVisible && dropdownStaysOpen && dropdownClosed
    });

    // 3. Subcategory Click & Navigation: Cute Pastel Graphic Tees (Has 3 products)
    console.log("📍 Test 3: Navigate to Girls -> Cute Pastel Graphic Tees");
    await girlsItem.hover();
    await page.waitForTimeout(200);
    await page.locator('.mega-dropdown a:has-text("Cute Pastel Graphic Tees")').click();
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    console.log("Current URL after subcategory click:", currentUrl);
    const urlCorrect = currentUrl.includes("/categories/girls/cute-pastel-graphic-tees");

    // Check banner is HIDDEN
    const bannerPresent = await page.locator("#collection-hero").count();
    console.log("Banner present on subcategory page (should be 0):", bannerPresent);

    // Check subcategory trail header
    const trailText = await page.locator(".coll-subcat-trail").textContent().catch(() => "");
    console.log("Subcategory trail text:", trailText);
    const trailHasSubName = trailText.toLowerCase().includes("cute pastel graphic tees");

    // Check product count (should be exactly 3)
    const productCount = await page.locator(".product-card").count();
    console.log("Product count for Cute Pastel Graphic Tees:", productCount);

    const subcatScreenshot = path.join(ARTIFACTS_DIR, "test_subcategory_cute_pastel_tees.png");
    await page.screenshot({ path: subcatScreenshot, fullPage: false });

    results.push({
      test: "Subcategory Page: Banner Hidden & Exactly 3 Relevant Products Shown",
      passed: urlCorrect && bannerPresent === 0 && trailHasSubName && productCount === 3
    });

    // 3b. Empty Subcategory Page Test (e.g., query for an empty subcategory)
    console.log("📍 Test 3b: Empty subcategory test (No Products Found)");
    await page.goto("http://localhost:3000/categories/girls/empty-subcat-test", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await dismissModal();

    const emptyBannerCount = await page.locator("#collection-hero").count();
    const emptyTitle = await page.locator(".coll-empty-title").textContent().catch(() => "");
    const emptyProductCount = await page.locator(".product-card").count();
    console.log("Empty subcategory banner count (should be 0):", emptyBannerCount);
    console.log("Empty subcategory title:", emptyTitle);
    console.log("Empty subcategory product count (should be 0):", emptyProductCount);

    const emptyScreenshot = path.join(ARTIFACTS_DIR, "test_subcategory_empty_state.png");
    await page.screenshot({ path: emptyScreenshot, fullPage: false });

    results.push({
      test: "Empty Subcategory: Banner Hidden & 'No Products Found' Shown",
      passed: emptyBannerCount === 0 && emptyTitle === "No Products Found" && emptyProductCount === 0
    });

    // 4. Subcategory Click with Products: Tiered Floral Summer Dresses
    console.log("📍 Test 4: Navigate to Girls -> Tiered Floral Summer Dresses");
    // Click from the subcategory pill bar
    await page.locator('.coll-subcat-pill:has-text("Tiered Floral Summer Dresses")').click();
    await page.waitForTimeout(1000);

    const dressesUrl = page.url();
    console.log("Dresses URL:", dressesUrl);
    const dressesBannerCount = await page.locator("#collection-hero").count();
    const productCards = await page.locator(".product-card").count();
    console.log("Product cards count for Tiered Floral Summer Dresses:", productCards);

    const dressesScreenshot = path.join(ARTIFACTS_DIR, "test_subcategory_with_products.png");
    await page.screenshot({ path: dressesScreenshot, fullPage: false });

    results.push({
      test: "Subcategory Page: Banner Hidden & Exactly 3 Relevant Products Shown",
      passed: dressesBannerCount === 0 && productCards === 3
    });

    // 5. Main Category Page: Verify Banner IS Shown
    console.log("📍 Test 5: Navigate to main category /categories/girls");
    await page.goto("http://localhost:3000/categories/girls", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await dismissModal();

    const mainCatBannerVisible = await page.locator("#collection-hero").isVisible();
    console.log("Category banner visible on main category page:", mainCatBannerVisible);

    const mainCatScreenshot = path.join(ARTIFACTS_DIR, "test_main_category_banner_visible.png");
    await page.screenshot({ path: mainCatScreenshot, fullPage: false });

    results.push({
      test: "Main Category Page: Category Banner Visible",
      passed: mainCatBannerVisible
    });

    // 6. Mobile Responsiveness Test
    console.log("📍 Test 6: Mobile responsiveness (375x667)");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await dismissModal();

    // Open hamburger
    await page.locator(".hamburger-btn").click();
    await page.waitForTimeout(300);
    const drawerOpen = await page.locator(".mobile-nav-drawer.open").isVisible();
    console.log("Mobile drawer open:", drawerOpen);

    // Expand Girls
    const girlsExpandBtn = page.locator('.mobile-nav-expand-row:has-text("Girls") button');
    await girlsExpandBtn.click();
    await page.waitForTimeout(300);

    const subcatLinkMobile = page.locator('.mobile-nav-submenu a:has-text("Cute Pastel Graphic Tees")');
    const subcatVisibleOnMobile = await subcatLinkMobile.isVisible();
    console.log("Subcategory visible in mobile drawer:", subcatVisibleOnMobile);

    await subcatLinkMobile.click();
    await page.waitForTimeout(1000);

    const mobileUrl = page.url();
    console.log("Mobile navigation URL:", mobileUrl);
    const mobileBannerCount = await page.locator("#collection-hero").count();
    const mobileProductCount = await page.locator(".product-card").count();
    console.log("Mobile product count (should be 3):", mobileProductCount);

    const mobileScreenshot = path.join(ARTIFACTS_DIR, "test_mobile_subcategory_no_banner.png");
    await page.screenshot({ path: mobileScreenshot, fullPage: false });

    results.push({
      test: "Mobile Navigation: Subcategory Page Banner Hidden & Products Shown",
      passed: drawerOpen && subcatVisibleOnMobile && mobileBannerCount === 0 && mobileProductCount === 3
    });

    console.log("\n================ TEST SUMMARY ================");
    console.table(results);

    const allPassed = results.every((r) => r.passed);
    console.log(allPassed ? "🎉 ALL TESTS PASSED!" : "❌ SOME TESTS FAILED!");
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
  }
}

runTests();
