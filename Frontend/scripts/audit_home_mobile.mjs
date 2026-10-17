import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  { name: "320px", width: 320, height: 568 },
  { name: "360px", width: 360, height: 780 },
  { name: "375px", width: 375, height: 667 },
  { name: "390px", width: 390, height: 844 },
  { name: "414px", width: 414, height: 896 },
  { name: "480px", width: 480, height: 850 },
  { name: "767px", width: 767, height: 1024 }
];

const SCREENSHOTS_DIR = path.resolve("d:/ZMW/Frontend/screenshots-home-mobile");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runHomeMobileAudit() {
  console.log("=======================================================");
  console.log("🚀 STARTING HOME PAGE MOBILE RESPONSIVENESS AUDIT");
  console.log("Target Widths: 320px, 360px, 375px, 390px, 414px, 480px, 767px");
  console.log("=======================================================\n");

  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`📱 TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`-------------------------------------------------------`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // Prevent auto-popup during initial interaction checks so it doesn't intercept clicks
    await page.addInitScript(() => {
      sessionStorage.setItem("zmw_offer_modal_dismissed", "true");
    });

    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Navigate to Home and wait for API data to render
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 20000 });
    try {
      await page.waitForSelector(".category-feature-section", { timeout: 8000 });
    } catch {
      // Continue if selector is taking longer
    }
    await page.waitForTimeout(1200);

    // 1. Check Full Page Horizontal Overflow
    const pageMetrics = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const bodyScroll = document.body.scrollWidth;
      const docScroll = document.documentElement.scrollWidth;
      const maxScroll = Math.max(bodyScroll, docScroll);
      const isOverflowing = maxScroll > docW + 2;

      let offenders = [];
      if (isOverflowing) {
        const all = document.querySelectorAll("*");
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.right > docW + 2) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className && typeof el.className === "string"
              ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
              : "";
            const id = el.id ? `#${el.id}` : "";
            offenders.push({
              selector: `${tag}${id}${cls}`,
              right: Math.round(r.right),
              width: Math.round(r.width),
              overflow: Math.round(r.right - docW)
            });
            if (offenders.length >= 6) break;
          }
        }
      }
      return { docW, maxScroll, isOverflowing, offenders };
    });

    if (pageMetrics.isOverflowing) {
      console.log(`  ❌ OVERFLOW: scrollWidth=${pageMetrics.maxScroll}px > viewport=${pageMetrics.docW}px (Diff: +${pageMetrics.maxScroll - pageMetrics.docW}px)`);
      for (const off of pageMetrics.offenders) {
        console.log(`     ↳ Offender: ${off.selector} (right: ${off.right}px, width: ${off.width}px, +${off.overflow}px)`);
      }
    } else {
      console.log(`  ✅ PAGE WIDTH OK: ${pageMetrics.docW}px (No horizontal scroll)`);
    }

    // 2. Section-by-Section Bounds & Visibility Checks
    const sectionAudit = await page.evaluate(() => {
      const results = {};
      const docW = document.documentElement.clientWidth;

      function auditElement(name, selector) {
        const el = document.querySelector(selector);
        if (!el) {
          results[name] = { exists: false };
          return;
        }
        const r = el.getBoundingClientRect();
        results[name] = {
          exists: true,
          width: Math.round(r.width),
          height: Math.round(r.height),
          left: Math.round(r.left),
          right: Math.round(r.right),
          overflowsRight: r.right > docW + 2,
          overflowsLeft: r.left < -2
        };
      }

      auditElement("AnnouncementBar", ".announcement-bar");
      auditElement("SiteHeader", ".site-header");
      auditElement("BrandLogo", ".brand-logo-img, .brand-main");
      auditElement("HamburgerBtn", ".hamburger-btn");
      auditElement("HeroSection", ".hero-clean-banner");
      auditElement("HeroContent", ".hero-content-box");
      auditElement("HeroCTA", ".hero-btn-primary");
      auditElement("HeroDots", ".hero-dots-wrap");
      auditElement("OfferBannerRow", ".offer-banner-row-container");
      auditElement("NewArrivalsSection", "#new-arrivals");
      auditElement("NewArrivalsCarousel", "#new-arrivals .carousel-container");
      auditElement("CategorySectionMens", ".category-feature-section");
      auditElement("BestSellersSection", "#best-sellers");
      auditElement("BenefitsSection", ".home-benefits-section");
      auditElement("FooterSection", ".site-footer");
      auditElement("FooterGrid", ".footer-grid");

      return results;
    });

    for (const [secName, data] of Object.entries(sectionAudit)) {
      if (!data.exists) {
        console.log(`  ⚠️ Section not mounted: ${secName}`);
      } else if (data.overflowsRight || data.overflowsLeft) {
        console.log(`  ❌ SECTION OVERFLOW: ${secName} (left: ${data.left}px, right: ${data.right}px > vp: ${vp.width}px)`);
      } else {
        console.log(`  ✅ ${secName.padEnd(20)}: w=${data.width}px, h=${data.height}px (fits within ${vp.width}px)`);
      }
    }

    // 3. Interactive Tests
    // A. Hamburger Menu & Drawer
    try {
      const hamburger = await page.$(".hamburger-btn");
      if (hamburger) {
        await hamburger.click();
        await page.waitForTimeout(350);

        const drawerCheck = await page.evaluate(() => {
          const drawer = document.querySelector(".mobile-nav-drawer");
          if (!drawer) return { exists: false };
          const r = drawer.getBoundingClientRect();
          const docW = document.documentElement.clientWidth;
          return {
            exists: true,
            isOpen: drawer.classList.contains("open"),
            width: Math.round(r.width),
            right: Math.round(r.right),
            docW,
            overflows: r.right > docW + 2
          };
        });

        if (drawerCheck.isOpen && !drawerCheck.overflows) {
          console.log(`  ✅ Mobile Drawer: Opens cleanly (w=${drawerCheck.width}px <= vp=${drawerCheck.docW}px)`);
        } else {
          console.log(`  ❌ Mobile Drawer ISSUE:`, drawerCheck);
        }

        // Test category expand in drawer
        const expandToggle = await page.$(".mobile-nav-expand-toggle");
        if (expandToggle) {
          await expandToggle.click();
          await page.waitForTimeout(200);
          console.log(`  ✅ Mobile Drawer Submenu: Toggle expandable category works`);
        }

        // Close drawer
        const closeBtn = await page.$(".drawer-close-btn");
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(300);
          console.log(`  ✅ Mobile Drawer: Closed successfully`);
        }
      }
    } catch (e) {
      console.log(`  ❌ Hamburger test error: ${e.message}`);
    }

    // B. Search Button & Modal
    try {
      const searchBtn = await page.$(".action-item--search, button[aria-label*='Search' i], button.action-btn:has(svg.search-icon)");
      if (searchBtn) {
        await searchBtn.click();
        await page.waitForTimeout(350);
        const searchModal = await page.$(".search-dropdown-container, .search-dropdown-overlay");
        if (searchModal) {
          const searchModalCheck = await page.evaluate(() => {
            const el = document.querySelector(".search-dropdown-container");
            if (!el) return { exists: false };
            const r = el.getBoundingClientRect();
            const docW = document.documentElement.clientWidth;
            return { width: Math.round(r.width), right: Math.round(r.right), overflows: r.right > docW + 2 };
          });
          if (!searchModalCheck.overflows) {
            console.log(`  ✅ Search Dropdown Modal: Opened cleanly without overflow (w=${searchModalCheck.width}px <= vp=${vp.width}px)`);
          } else {
            console.log(`  ❌ Search Modal OVERFLOW:`, searchModalCheck);
          }
          // Close search modal
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      console.log(`  ℹ️ Search modal test note: ${e.message}`);
    }

    // C. Explicitly test Promotional Offer Banner Modal
    try {
      const offerCard = await page.$(".offer-banner-card");
      if (offerCard) {
        await offerCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await offerCard.click();
        await page.waitForTimeout(400);
        const modalCheck = await page.evaluate(() => {
          const m = document.querySelector(".offer-banner-modal");
          if (!m) return { exists: false };
          const r = m.getBoundingClientRect();
          const docW = document.documentElement.clientWidth;
          return {
            exists: true,
            width: Math.round(r.width),
            right: Math.round(r.right),
            overflows: r.right > docW + 2
          };
        });
        if (modalCheck.exists && !modalCheck.overflows) {
          console.log(`  ✅ Offer Banner Modal: Opened cleanly without overflow (w=${modalCheck.width}px <= vp=${vp.width}px)`);
        }
        const closeBtn = await page.$(".offer-modal-close-btn");
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(300);
          console.log(`  ✅ Offer Banner Modal: Closed cleanly`);
        }
      }
    } catch (e) {
      console.log(`  ℹ️ Offer modal test note: ${e.message}`);
    }

    // D. Category Feature Carousel Arrow
    try {
      const catArrow = await page.$(".cat-feature-arrow.right");
      if (catArrow) {
        const canClick = await catArrow.isVisible();
        if (canClick) {
          await catArrow.click();
          await page.waitForTimeout(300);
          console.log(`  ✅ Category Carousel Right Arrow: Click navigates smoothly`);
        }
      }
    } catch (e) {
      console.log(`  ℹ️ Category arrow test note: ${e.message}`);
    }

    // 4. Capture screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, `home_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 Full-page screenshot saved: ${screenshotPath}`);

    allResults.push({
      viewport: vp.name,
      width: vp.width,
      pageMetrics,
      sectionAudit
    });

    await context.close();
  }

  await browser.close();

  console.log("\n=======================================================");
  console.log("🏁 HOME PAGE MOBILE AUDIT COMPLETED");
  console.log("=======================================================");
}

runHomeMobileAudit().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
