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

const ADMIN_PAGES = [
  { name: "Login", path: "/login" },
  { name: "Dashboard", path: "/" },
  { name: "Categories", path: "/categories" },
  { name: "Subcategories", path: "/subcategories" },
  { name: "Products", path: "/products" },
  { name: "NewProduct", path: "/products/new" },
  { name: "Inventory", path: "/inventory" },
  { name: "Variants", path: "/variants" },
  { name: "Stock", path: "/stock" },
  { name: "Banners", path: "/banners" },
  { name: "OfferBanners", path: "/offer-banners" },
  { name: "Offers", path: "/offers" },
  { name: "HomepageSections", path: "/homepage-sections" },
  { name: "Orders", path: "/orders" },
  { name: "Shipping", path: "/shipping" },
  { name: "Customers", path: "/customers" },
  { name: "CustomerInquiries", path: "/contact" },
  { name: "Coupons", path: "/coupons" },
  { name: "Reports", path: "/reports" },
  { name: "Reviews", path: "/reviews" },
  { name: "SeoMeta", path: "/seo" },
  { name: "SeoSitemap", path: "/seo/sitemap" },
  { name: "SeoGeneral", path: "/seo/general" }
];

async function run() {
  console.log("=== STARTING ADMIN RESPONSIVENESS AUDIT ===");
  
  // Obtain Admin JWT token first
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "adminzmw@gmail.com", password: "Admin@2026" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) {
    console.error("Failed to authenticate admin:", loginData);
    process.exit(1);
  }
  console.log("Admin token obtained successfully.\n");

  const browser = await chromium.launch({ headless: true });
  const issues = [];
  let totalChecks = 0;
  let passCount = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    // Set token in localStorage
    await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });
    await page.evaluate((tok) => {
      localStorage.setItem("zmw_admin_token", tok);
    }, token);

    for (const p of ADMIN_PAGES) {
      totalChecks++;
      const url = `http://localhost:5173${p.path}`;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(600);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.clientWidth;
          const maxScroll = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
          const hasOverflow = maxScroll > docWidth + 3;
          let offendingElement = null;
          if (hasOverflow) {
            const all = document.querySelectorAll("*");
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > docWidth + 3) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
                offendingElement = `${tag}${cls} (right: ${Math.round(r.right)}px, w: ${Math.round(r.width)}px)`;
                break;
              }
            }
          }
          return { docWidth, maxScroll, hasOverflow, offendingElement };
        });

        if (overflow.hasOverflow) {
          console.log(`  ❌ OVERFLOW: ${p.name} (scroll=${overflow.maxScroll}px > viewport=${overflow.docWidth}px, diff=${overflow.maxScroll - overflow.docWidth}px)`);
          if (overflow.offendingElement) console.log(`      ↳ Offender: ${overflow.offendingElement}`);
          issues.push({ viewport: vp.name, page: p.name, ...overflow });
        } else {
          passCount++;
          console.log(`  ✅ OK: ${p.name} (${overflow.docWidth}px)`);
        }
      } catch (err) {
        console.log(`  ⚠️ ERROR: ${p.name}: ${err.message}`);
      }
    }

    // Also test Mobile Sidebar Drawer toggle on mobile/tablet (<1024px)
    if (vp.width < 1024) {
      try {
        await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
        await page.waitForTimeout(400);
        
        // Find hamburger button
        const toggleBtn = page.locator(".admin-menu-toggle");
        if (await toggleBtn.isVisible()) {
          await toggleBtn.click();
          await page.waitForTimeout(300);
          const sidebarOpen = await page.locator(".admin-sidebar.open").isVisible();
          const sidebarOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth + 3;
          });
          if (sidebarOpen && !sidebarOverflow) {
            console.log(`  ✅ Mobile Sidebar Toggle: Drawer opened cleanly without page overflow`);
          } else {
            console.log(`  ❌ Mobile Sidebar Toggle: open=${sidebarOpen}, overflow=${sidebarOverflow}`);
            issues.push({ viewport: vp.name, page: "SidebarDrawer", hasOverflow: sidebarOverflow });
          }
        }
      } catch (e) {
        console.log(`  ⚠️ Sidebar toggle error: ${e.message}`);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log(`\n==================================================`);
  console.log(`ADMIN AUDIT FINISHED: ${passCount}/${totalChecks} PASSED, ${issues.length} ISSUES FOUND`);
  if (issues.length > 0) {
    console.log("Issues details:", JSON.stringify(issues, null, 2));
  }
}

run().catch(console.error);
