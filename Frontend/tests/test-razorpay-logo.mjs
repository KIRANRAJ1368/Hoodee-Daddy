import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Valid 30-day token for User id 1
const customerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc5MTYzMTk5MSwiZXhwIjoxNzk0MjIzOTkxfQ.ZlCcAHaF1rRJkFTZ9ofFi1A0bgAbE39XjVsb48afjrQ';

async function testRazorpayLogo() {
  console.log('======================================================================');
  console.log('🎨 VERIFICATION: ZMW BRAND LOGO IN RAZORPAY CHECKOUT MODAL');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
    // 1. Prime browser with authenticated user and cart item
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token }) => {
      localStorage.setItem('zmw_customer_token', token);
      localStorage.setItem('zmw_customer_user', JSON.stringify({
        id: 1,
        name: 'Kiran Raj',
        email: 'cust1790685978652@example.com',
        phone: '9876543210'
      }));
      localStorage.setItem('zmw_cart', JSON.stringify([
        {
          id: 1,
          productId: 1,
          name: 'Printed Round Neck T-Shirt - Jet Black & Off White',
          price: 500,
          quantity: 1,
          size: 'M',
          color: 'Black',
          image: '/images/products/printed-tshirt.jpg'
        }
      ]));
    }, { token: customerToken });

    // 3. Navigate to Checkout
    console.log('Navigating to http://localhost:3000/checkout...');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.cko-page', { timeout: 8000 });
    assert(true, 'Checkout page loaded successfully for authenticated customer');

    // 4. Fill Address in Step 2
    console.log('Completing delivery address...');
    await page.locator('.cko-page input[name="address"]').fill('102 Avinashi Road, Peelamedu');
    await page.locator('.cko-page input[name="city"]').fill('Coimbatore');
    await page.locator('.cko-page input[name="state"]').fill('Tamil Nadu');

    const calcPromise = page.waitForResponse(
      resp => resp.url().includes('/api/shipping/calculate') && resp.status() === 200
    );
    await page.locator('.cko-page input[name="postalCode"]').fill('641004');
    await calcPromise;
    await page.waitForTimeout(600);
    assert(true, 'Live Shiprocket shipping rate calculated successfully for PIN 641004');

    // Continue to Step 3: Payment
    await page.locator('button:has-text("CONTINUE TO PAYMENT")').first().click();
    await page.waitForTimeout(800);

    // Save screenshot of checkout payment step
    const artifactDir = 'C:/Users/Kalaiyarasi/.gemini/antigravity/brain/9d394afc-c95b-46b3-ad03-c609aca7d196';
    const paymentStepScreenshot = path.join(artifactDir, '11-checkout-payment-step.png');
    await page.screenshot({ path: paymentStepScreenshot, fullPage: false });
    console.log(`📸 Payment step screenshot saved: ${paymentStepScreenshot}`);

    // Verify Payment Method cards
    await page.waitForSelector('.cko-pm-card', { timeout: 5000 });
    const rzpPayBtn = page.locator('button:has-text("PAY WITH RAZORPAY")').first();
    assert(await rzpPayBtn.isVisible(), 'Razorpay payment option and Pay button are visible');

    // Hook window.Razorpay to intercept the options passed
    await page.evaluate(() => {
      window.__capturedRazorpayOptions = null;
      const OriginalRazorpay = window.Razorpay;
      if (OriginalRazorpay) {
        window.Razorpay = function (options) {
          window.__capturedRazorpayOptions = options;
          const inst = new OriginalRazorpay(options);
          return inst;
        };
        Object.assign(window.Razorpay, OriginalRazorpay);
      }
    });

    // 5. Trigger Razorpay checkout
    console.log('\n🚀 Clicking "PAY WITH RAZORPAY"...');
    await rzpPayBtn.click();
    await page.waitForTimeout(2500);

    const capturedOptions = await page.evaluate(() => window.__capturedRazorpayOptions);
    assert(capturedOptions !== null, 'Razorpay instance created by Checkout component');

    if (capturedOptions) {
      console.log('\n📋 Inspected Razorpay Options:');
      console.log(`   - Name: "${capturedOptions.name}"`);
      console.log(`   - Description: "${capturedOptions.description}"`);
      console.log(`   - Currency: "${capturedOptions.currency}"`);
      console.log(`   - Amount: ${capturedOptions.amount} paise (₹${capturedOptions.amount / 100})`);
      console.log(`   - Theme Color: "${capturedOptions.theme?.color}"`);
      console.log(`   - Image Type: ${capturedOptions.image?.startsWith('data:') ? 'Base64 Data URI' : capturedOptions.image}`);
      console.log(`   - Image Length: ${capturedOptions.image?.length} chars`);

      assert(
        capturedOptions.image && capturedOptions.image.startsWith('data:image/png;base64,'),
        'Image is configured as Base64 Data URI (data:image/png;base64,...)',
        `Length: ${capturedOptions.image?.length} chars`
      );

      assert(
        !capturedOptions.image.includes('favicon-48x48.png'),
        'Broken favicon URL (/favicon-48x48.png) is completely removed',
        'Verified removed'
      );

      // Verify the base64 content is a genuine PNG
      const base64Data = capturedOptions.image.replace(/^data:image\/png;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      const isPng = imgBuffer.length > 8 &&
        imgBuffer[0] === 0x89 &&
        imgBuffer[1] === 0x50 && // P
        imgBuffer[2] === 0x4E && // N
        imgBuffer[3] === 0x47;   // G

      assert(isPng, 'Base64 decodes to authentic binary PNG file', `Buffer size: ${imgBuffer.length} bytes`);

      // Read PNG IHDR dimensions (192x192)
      const width = imgBuffer.readUInt32BE(16);
      const height = imgBuffer.readUInt32BE(20);
      assert(width === 192 && height === 192, `PNG dimensions match high-res square logo: ${width}x${height}px`);

      // Write decoded image to artifact dir for direct visual confirmation
      const logoDecodedPath = path.join(artifactDir, '12-razorpay-logo-decoded.png');
      fs.writeFileSync(logoDecodedPath, imgBuffer);
      console.log(`🖼️ Decoded logo saved to: ${logoDecodedPath}`);
    }

    // Wait for Razorpay modal iframe to render
    console.log('Waiting for Razorpay modal render...');
    await page.waitForTimeout(3000);

    const rzpIframe = page.locator('iframe.razorpay-checkout-frame');
    const iframeVisible = await rzpIframe.isVisible().catch(() => false);
    console.log(`🖼️ Razorpay Checkout iframe visible in DOM: ${iframeVisible}`);

    // Capture screenshot of screen with modal
    const modalScreenshot = path.join(artifactDir, '10-checkout-razorpay-logo.png');
    await page.screenshot({ path: modalScreenshot, fullPage: false });
    console.log(`📸 Modal screen screenshot captured: ${modalScreenshot}`);

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

testRazorpayLogo();
