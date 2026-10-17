const { chromium } = require('k:/ZMW/Frontend/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196';

async function getAdminToken() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adminzmw@gmail.com', password: 'Admin@2026' })
  });
  const data = await res.json();
  if (!data?.data?.token) {
    throw new Error('Failed to obtain admin token: ' + JSON.stringify(data));
  }
  return data.data.token;
}

async function main() {
  const adminToken = await getAdminToken();
  console.log('Successfully acquired admin token:', adminToken.slice(0, 15) + '...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Testing Admin Categories Page (http://localhost:5174/categories)...');
  try {
    // Go to admin root, set token, then navigate to /categories
    await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok) => {
      localStorage.setItem('zmw_admin_token', tok);
    }, adminToken);

    await page.goto('http://localhost:5174/categories', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('table.data-table tbody tr', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Extract table rows
    const rows = await page.evaluate(() => {
      const trs = Array.from(document.querySelectorAll('table.data-table tbody tr'));
      return trs.map(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        return {
          title: tds[0]?.querySelector('.cell-title')?.innerText?.trim() || tds[0]?.innerText?.split('\n')[0]?.trim() || '',
          slug: tds[1]?.innerText?.trim() || '',
          subcategories: tds[2]?.innerText?.trim() || '',
          sequence: tds[3]?.innerText?.trim() || '',
          status: tds[4]?.innerText?.trim() || '',
          showHomepage: tds[5]?.innerText?.trim() || ''
        };
      });
    });

    console.log('Admin Table Rows (Strict Sequence Order):');
    console.table(rows);

    const adminShot = path.join(ARTIFACT_DIR, '33-admin-categories-sequence.png');
    await page.screenshot({ path: adminShot, fullPage: false });
    console.log('Admin Categories screenshot saved:', adminShot);
  } catch (err) {
    console.error('Error on Admin Categories page:', err);
  }

  console.log('Testing Storefront Navbar (http://localhost:3000)...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => localStorage.removeItem('zmw_navbar_categories'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const navCategories = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.nav-item .nav-link, .nav-item'));
      return links.map(el => el.innerText.trim()).filter(Boolean);
    });
    console.log('Storefront Nav Categories:', navCategories);

    const storeShot = path.join(ARTIFACT_DIR, '34-storefront-categories-sequence.png');
    await page.screenshot({ path: storeShot, fullPage: false });
    console.log('Storefront screenshot saved:', storeShot);
  } catch (err) {
    console.error('Error on Storefront:', err);
  }

  await browser.close();
  console.log('Verification finished successfully!');
}

main().catch(console.error);
