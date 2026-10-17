import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "mobile_320", width: 320, height: 568 },
  { name: "mobile_360", width: 360, height: 780 },
  { name: "mobile_375", width: 375, height: 667 },
  { name: "mobile_390", width: 390, height: 844 },
  { name: "mobile_414", width: 414, height: 896 },
  { name: "mobile_480", width: 480, height: 850 },
  { name: "tablet_768", width: 768, height: 1024 },
  { name: "tablet_1024", width: 1024, height: 768 },
  { name: "desktop_1280", width: 1280, height: 800 },
  { name: "desktop_1440", width: 1440, height: 900 },
  { name: "desktop_1920", width: 1920, height: 1080 }
];

const PAGES = [
  { name: "Home", path: "/" },
  { name: "Collection", path: "/collection?category=mens" },
  { name: "ProductDetail", path: "/product/1" },
  { name: "Cart", path: "/cart" },
  { name: "Checkout", path: "/checkout" },
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

const issues = [];
let okCount = 0;
let failCount = 0;

async function runAudit() {
  console.log("=== FULL RESPONSIVE AUDIT — All 9 Viewports ===");
  console.log(`Viewports: ${VIEWPORTS.map(v => v.width + 'px').join(', ')}\n`);
  
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}×${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      const url = `http://localhost:3000${p.path}`;
      const consoleErrors = [];
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(800);

        const check = await page.evaluate(() => {
          const docWidth = document.documentElement.clientWidth;
          const bodyScroll = document.body.scrollWidth;
          const docScroll = document.documentElement.scrollWidth;
          const maxScroll = Math.max(bodyScroll, docScroll);
          const hasOverflow = maxScroll > docWidth + 3;

          const offenders = [];
          if (hasOverflow) {
            const all = document.querySelectorAll("*");
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > docWidth + 3) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className && typeof el.className === "string"
                  ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
                  : "";
                offenders.push({
                  selector: `${tag}${cls}`,
                  right: Math.round(r.right),
                  width: Math.round(r.width)
                });
                if (offenders.length >= 5) break;
              }
            }
          }

          return { docWidth, maxScroll, hasOverflow, offenders };
        });

        if (check.hasOverflow) {
          failCount++;
          const icon = "❌ OVERFLOW";
          console.log(`  ${icon} ${p.name.padEnd(22)} (viewport=${check.docWidth}px, scroll=${check.maxScroll}px, excess=${check.maxScroll - check.docWidth}px)`);
          check.offenders.forEach(o => {
            console.log(`    ↳ ${o.selector} [right=${o.right}px, width=${o.width}px]`);
          });
          issues.push({ viewport: vp.name, width: vp.width, page: p.name, ...check });
        } else {
          okCount++;
          console.log(`  ✅ OK       ${p.name.padEnd(22)} (viewport=${check.docWidth}px, scroll=${check.maxScroll}px)`);
        }

        if (consoleErrors.length > 0) {
          console.log(`    ⚠️ JS Errors: ${consoleErrors.slice(0, 2).join('; ')}`);
        }
      } catch (e) {
        console.error(`  💥 ERROR    ${p.name}: ${e.message}`);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log("\n" + "=".repeat(60));
  console.log(`AUDIT COMPLETE: ${okCount} OK, ${failCount} OVERFLOW ISSUES`);
  
  if (issues.length > 0) {
    console.log("\n📋 OVERFLOW ISSUES SUMMARY:");
    issues.forEach(i => {
      console.log(`  [${i.viewport}] ${i.page}: scroll=${i.maxScroll}px (excess=${i.maxScroll - i.docWidth}px)`);
      i.offenders.forEach(o => console.log(`    ↳ ${o.selector}`));
    });
  } else {
    console.log("\n✅ ALL PAGES PASS on ALL VIEWPORTS — Zero horizontal overflow detected!");
  }
}

runAudit().catch(console.error);
