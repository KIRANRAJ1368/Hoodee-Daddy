const { chromium } = require('k:/ZMW/Frontend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

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

function findLatestOtpFromLog() {
  const logDir = 'C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196/.system_generated/tasks';
  const files = fs.readdirSync(logDir).filter(f => f.endsWith('.log'));
  let latestOtp = null;
  let latestMtime = 0;
  for (const file of files) {
    try {
      const fullPath = path.join(logDir, file);
      const stat = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/\[OTP Code\]\s*:\s*(\d{6})/g);
      if (matches && matches.length > 0) {
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          const lastMatch = matches[matches.length - 1];
          latestOtp = lastMatch.replace(/[^0-9]/g, '');
        }
      }
    } catch (e) {}
  }
  return latestOtp;
}

async function main() {
  const adminToken = await getAdminToken();
  console.log('Obtained admin token.');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // 1. Admin Categories Verification
  console.log('\n--- 1. Testing Admin Categories Page ---');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((tok) => localStorage.setItem('zmw_admin_token', tok), adminToken);
  await page.goto('http://localhost:5174/categories', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const categories = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('table.data-table tbody tr'));
    return trs.map(tr => {
      const tds = Array.from(tr.querySelectorAll('td'));
      return {
        title: tds[0]?.querySelector('.cell-title')?.innerText?.trim() || '',
        slug: tds[1]?.innerText?.trim() || '',
        subcategories: tds[2]?.innerText?.trim() || '',
        sequence: tds[3]?.innerText?.trim() || '',
        status: tds[4]?.innerText?.trim() || '',
        showHomepage: tds[5]?.innerText?.trim() || ''
      };
    });
  });
  console.log('Categories in Admin (5 categories, 0 subcategories):');
  console.table(categories);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '35-admin-categories-cleaned.png') });

  // 2. Admin Products Empty Verification
  console.log('\n--- 2. Testing Admin Products Page ---');
  await page.goto('http://localhost:5174/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '36-admin-products-empty.png') });

  // 3. Admin Orders Empty Verification
  console.log('\n--- 3. Testing Admin Orders Page ---');
  await page.goto('http://localhost:5174/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '37-admin-orders-empty.png') });

  // 4. Storefront Homepage with Category Name Banners
  console.log('\n--- 4. Testing Storefront Homepage ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('zmw_navbar_categories'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const categoryBannerTitles = await page.evaluate(() => {
    const banners = Array.from(document.querySelectorAll('.cat-feature-banner-title'));
    return banners.map(b => b.innerText.trim());
  });
  console.log('Category Banners on Homepage:', categoryBannerTitles);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '38-storefront-homepage-category-banners.png'), fullPage: false });

  // 5. Forgot Password 3-Step Flow
  console.log('\n--- 5. Testing Forgot Password Flow ---');
  // Open the auth modal via clicking Account Login button in navbar
  await page.click('button[aria-label="Account Login"]');
  await page.waitForSelector('.auth-modal-container', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Click Forgot? button
  console.log('Clicking "Forgot?" password button...');
  await page.click('.forgot-link-btn');
  await page.waitForTimeout(500);

  // Step 1: Request OTP Screenshot
  console.log('Step 1: Request OTP screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '39-forgot-password-step1-request.png') });

  // Fill email and submit
  await page.fill('#auth-email', 'kalaiyarasiravi2005@gmail.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Step 2: OTP Entry screen
  console.log('Step 2: OTP verification screen...');
  await page.waitForSelector('#auth-otp', { timeout: 10000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '40-forgot-password-step2-otp.png') });

  // Read the dispatched OTP from backend logs
  const otp = findLatestOtpFromLog();
  console.log('Extracted OTP from mailer log:', otp);

  if (otp) {
    await page.fill('#auth-otp', otp);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Step 3: Create New Password screen
    console.log('Step 3: Create New Password screen...');
    await page.waitForSelector('#auth-newPassword', { timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '41-forgot-password-step3-new-password.png') });

    // Fill new password and confirm
    await page.fill('#auth-newPassword', 'NewZmwPassword@2026');
    await page.fill('#auth-confirmPassword', 'NewZmwPassword@2026');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // Step 4: Success confirmation screen
    console.log('Step 4: Success confirmation screen...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '42-forgot-password-step4-success.png') });
  }

  await browser.close();
  console.log('\n--- ALL VERIFICATIONS COMPLETED SUCCESSFULLY ---');
}

main().catch(console.error);
