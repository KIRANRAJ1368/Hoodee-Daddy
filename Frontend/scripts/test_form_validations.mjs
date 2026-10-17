import { chromium } from "playwright";

async function runTests() {
  console.log("==============================================================");
  console.log("   STARTING COMPREHENSIVE FORM VALIDATION AUDIT & TEST SUITE   ");
  console.log("==============================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Prevent offer popup from interrupting browser clicks
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("zmw_offer_modal_dismissed", "true");
    } catch (e) {}
  });

  const page = await context.newPage();

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failCount++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: CONTACT US FORM (/contact)
    // ----------------------------------------------------
    console.log("\n--- TEST SUITE 1: Contact Us Form (/contact) ---");
    await page.goto("http://localhost:3000/contact", { waitUntil: "networkidle" });

    // 1.1: Submit completely empty form
    const contactSubmitBtn = page.locator(".contact-submit-btn");
    await contactSubmitBtn.click();
    await page.waitForTimeout(300);

    const nameError = await page.locator(".contact-field-error").filter({ hasText: "Full Name is required" }).count();
    const emailError = await page.locator(".contact-field-error").filter({ hasText: "Email Address is required" }).count();
    const phoneRequiredError = await page.locator(".contact-field-error").filter({ hasText: "Phone number is required" }).count();
    const messageError = await page.locator(".contact-field-error").filter({ hasText: "Message is required" }).count();
    assert(nameError > 0, "Empty form displays 'Full Name is required.'");
    assert(emailError > 0, "Empty form displays 'Email Address is required.'");
    assert(phoneRequiredError > 0, "Empty form displays 'Phone number is required.'");
    assert(messageError > 0, "Empty form displays 'Message is required.'");

    // 1.2: Invalid email test
    await page.locator("#contact-name").fill("John Doe");
    await page.locator("#contact-email").fill("invalid-email-address");
    await page.locator("#contact-message").fill("This is an inquiry message.");
    await contactSubmitBtn.click();
    await page.waitForTimeout(300);

    const invalidEmailMsg = await page.locator(".contact-field-error").filter({ hasText: "valid email address" }).count();
    assert(invalidEmailMsg > 0, "Invalid email displays 'Please enter a valid email address.'");

    // 1.3: Phone rejection of letters & special characters
    const phoneInput = page.locator("#contact-phone");
    await phoneInput.fill("abc!@#98765xyz");
    const sanitizedVal = await phoneInput.inputValue();
    assert(sanitizedVal === "98765", `Phone input rejects letters and special characters (got '${sanitizedVal}')`);

    // 1.4: Phone with fewer than 10 digits
    await phoneInput.fill("987654321"); // 9 digits
    await page.locator("#contact-email").fill("john@example.com");
    await contactSubmitBtn.click();
    await page.waitForTimeout(300);

    const phoneDigitMsg = await page.locator(".contact-field-error").filter({ hasText: "Phone number must be exactly 10 digits" }).count();
    assert(phoneDigitMsg > 0, "9-digit phone displays 'Phone number must be exactly 10 digits.'");

    // 1.5: Phone with exactly 10 digits -> should be valid
    await phoneInput.fill("9876543210");
    await contactSubmitBtn.click();
    await page.waitForTimeout(1000);

    const successSummary = await page.locator(".customer-data-summary").count();
    assert(successSummary > 0, "Valid form submission succeeds and displays submission summary.");


    // ----------------------------------------------------
    // TEST SUITE 2: AUTH MODAL (SIGN IN, REGISTER, FORGOT)
    // ----------------------------------------------------
    console.log("\n--- TEST SUITE 2: Auth Modal (Sign In / Register / Forgot Password) ---");
    
    // Direct navigate to /register to trigger auth modal
    await page.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
    await page.waitForSelector(".auth-modal-container", { state: "visible", timeout: 5000 });

    const authSubmitBtn = page.locator(".auth-submit-btn, button[type='submit']").filter({ hasText: /create account|sign in/i }).first();

    // 2.1: Register empty submit
    await authSubmitBtn.click();
    await page.waitForTimeout(300);
    let authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("Please enter your full name"), "Registration with empty name shows 'Please enter your full name.'");

    // 2.2: Register phone cleaning & 10-digit validation
    await page.locator("#reg-name").fill("Alice Wonder");
    const regPhoneInput = page.locator("#reg-phone");
    await regPhoneInput.fill("abcDEF@#$99");
    const regPhoneVal = await regPhoneInput.inputValue();
    assert(regPhoneVal === "99", `Registration phone input filters non-digits (got '${regPhoneVal}')`);

    await regPhoneInput.fill("987654321"); // 9 digits
    await authSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("Phone number must be exactly 10 digits"), "9-digit phone shows 'Phone number must be exactly 10 digits.'");

    // 2.3: Register invalid email
    await regPhoneInput.fill("9876543210");
    await page.locator("#auth-email").fill("alice-not-email");
    await authSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("valid email address"), "Invalid email shows 'Please enter a valid email address.'");

    // 2.4: Register password length < 6
    await page.locator("#auth-email").fill("alice@example.com");
    await page.locator("#auth-password").fill("12345");
    await page.locator("#reg-confirmPassword").fill("12345");
    await authSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("at least 6 characters"), "Password < 6 chars shows 'Password must be at least 6 characters long.'");

    // 2.5: Register password mismatch
    await page.locator("#auth-password").fill("Secret123");
    await page.locator("#reg-confirmPassword").fill("Secret456");
    await authSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("do not match"), "Mismatched passwords show 'Passwords do not match.'");

    // 2.6: Sign In Form Validation
    const signInTabBtn = page.locator(".auth-tab-btn").filter({ hasText: "Sign In" });
    await signInTabBtn.click();
    await page.waitForTimeout(300);

    const loginSubmitBtn = page.locator("button[type='submit']").filter({ hasText: /sign in/i }).first();
    await loginSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("Email address is required"), "Sign In with empty email shows 'Email address is required.'");

    await page.locator("#auth-email").fill("invalid_email_format");
    await loginSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("valid email address"), "Sign In with invalid email format shows 'Please enter a valid email address.'");

    await page.locator("#auth-email").fill("user@example.com");
    await page.locator("#auth-password").fill("");
    await loginSubmitBtn.click();
    await page.waitForTimeout(300);
    authError = await page.locator(".auth-error-banner").textContent();
    assert(authError.includes("Password is required"), "Sign In with empty password shows 'Password is required.'");

    // 2.7: Forgot Password Validation
    const forgotLink = page.locator(".forgot-password-link");
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await page.waitForTimeout(300);

      const forgotBtn = page.locator("button[type='submit']").filter({ hasText: /send verification|continue/i }).first();
      await page.locator("#auth-email").fill("");
      await forgotBtn.click();
      await page.waitForTimeout(300);
      authError = await page.locator(".auth-error-banner").textContent();
      assert(authError.includes("Email address is required"), "Forgot password with empty email shows 'Email address is required.'");

      await page.locator("#auth-email").fill("bad-format");
      await forgotBtn.click();
      await page.waitForTimeout(300);
      authError = await page.locator(".auth-error-banner").textContent();
      assert(authError.includes("valid email address"), "Forgot password with invalid email shows 'Please enter a valid email address.'");
    }

    // Close Auth modal
    await page.locator(".auth-close-btn").click();
    await page.waitForTimeout(300);


    // ----------------------------------------------------
    // TEST SUITE 3: CHECKOUT VALIDATION
    // ----------------------------------------------------
    console.log("\n--- TEST SUITE 3: Checkout Page Flow Validations (/checkout) ---");
    // Register a genuine customer to obtain a valid JWT token
    const testEmail = `chk_test_${Date.now()}@example.com`;
    const regRes = await fetch("http://localhost:5000/api/auth/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Customer",
        email: testEmail,
        phone: "9876543210",
        password: "Password123!",
        confirmPassword: "Password123!"
      })
    });
    const regData = await regRes.json();
    const validToken = regData?.data?.token;
    const validUser = regData?.data?.user;

    // Add cart item and authenticated customer to localStorage so checkout opens in Step 2
    await page.evaluate(({ token, user }) => {
      const mockCartItem = [{
        id: 1,
        name: "Vintage Oversized T-Shirt",
        price: 999,
        originalPrice: 1499,
        discount: 33,
        quantity: 1,
        size: "M",
        color: "Black",
        sku: "MOCK-1-M-BLK"
      }];
      localStorage.setItem("zmw_cart", JSON.stringify(mockCartItem));
      localStorage.setItem("zmw_customer_token", token);
      localStorage.setItem("zmw_customer_user", JSON.stringify(user));
    }, { token: validToken, user: validUser });

    await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // 3.1: Step 2 Delivery Phone filtering
    const deliveryPhone = page.locator("#deliveryPhone");
    await deliveryPhone.fill("abcDEF@#$99");
    const deliveryPhoneVal = await deliveryPhone.inputValue();
    assert(deliveryPhoneVal === "99", `Checkout delivery phone input filters non-digits (got '${deliveryPhoneVal}')`);

    // 3.2: Step 2 Phone 9-digit validation on submit
    await deliveryPhone.fill("987654321"); // 9 digits
    const step2NextBtn = page.locator("button[type='submit']").filter({ hasText: /continue to payment/i }).first();
    await step2NextBtn.click();
    await page.waitForTimeout(300);
    const phoneErr = await page.locator(".cko-field-error").filter({ hasText: /10 digits/i }).count();
    assert(phoneErr > 0, "Checkout Step 2 displays 'Phone number must be exactly 10 digits.' for 9-digit input.");

    // 3.3: Step 2 Pincode filtering of non-digits
    const postalCode = page.locator("#postalCode");
    await postalCode.fill("abc123xyz");
    const pinVal = await postalCode.inputValue();
    assert(pinVal === "123", `Checkout PIN code filters non-digits (got '${pinVal}')`);

    // 3.4: Switch to Step 1 (Contact Information)
    const step1Tab = page.locator(".cko-step-tab").first();
    await step1Tab.click();
    await page.waitForTimeout(300);

    // 3.5: Step 1 Empty Email
    const step1NextBtn = page.locator(".cko-submit-step-btn, button[type='submit']").first();
    await page.locator("#email").fill("");
    await step1NextBtn.click();
    await page.waitForTimeout(300);
    let ckoEmailErr = await page.locator(".cko-field-error").filter({ hasText: /email/i }).count();
    assert(ckoEmailErr > 0, "Checkout Step 1 with empty email displays 'Email address is required.'");

    // 3.6: Step 1 Invalid Email
    await page.locator("#email").fill("invalid_checkout_email");
    await step1NextBtn.click();
    await page.waitForTimeout(300);
    let invalidEmailErr = await page.locator(".cko-field-error").filter({ hasText: /valid email/i }).count();
    assert(invalidEmailErr > 0, "Checkout Step 1 with invalid email format displays 'Please enter a valid email address.'");


    // ----------------------------------------------------
    // TEST SUITE 4: BACKEND DIRECT VALIDATOR TESTS (API LEVEL)
    // ----------------------------------------------------
    console.log("\n--- TEST SUITE 4: Backend API Validation Endpoints ---");

    // 4.1: Contact API with 9-digit phone
    const contactBadPhone = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        phone: "987654321", // 9 digits
        message: "Hello world"
      })
    });
    const contactBadPhoneRes = await contactBadPhone.json();
    assert(
      contactBadPhone.status === 400 && JSON.stringify(contactBadPhoneRes).includes("10 digits"),
      `Backend Contact API rejects 9-digit phone (Status 400: ${contactBadPhoneRes?.error?.details?.[0]?.message || contactBadPhoneRes?.message})`
    );

    // 4.1b: Contact API with missing phone
    const contactNoPhone = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "Hello world"
      })
    });
    const contactNoPhoneRes = await contactNoPhone.json();
    assert(
      contactNoPhone.status === 400 && JSON.stringify(contactNoPhoneRes).includes("Phone number is required"),
      `Backend Contact API rejects missing phone (Status 400: ${contactNoPhoneRes?.error?.details?.[0]?.message || contactNoPhoneRes?.message})`
    );

    // 4.2: Contact API with invalid email
    const contactBadEmail = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
        phone: "9876543210",
        message: "Hello world"
      })
    });
    const contactBadEmailRes = await contactBadEmail.json();
    assert(
      contactBadEmail.status === 400,
      `Backend Contact API rejects invalid email format (Status 400)`
    );

    // 4.3: Auth Customer Register API with invalid phone (non-10 digits)
    const regBadPhone = await fetch("http://localhost:5000/api/auth/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "unique" + Date.now() + "@example.com",
        phone: "987654321", // 9 digits
        password: "password123",
        confirmPassword: "password123"
      })
    });
    const regBadPhoneRes = await regBadPhone.json();
    assert(
      regBadPhone.status === 400 && JSON.stringify(regBadPhoneRes).includes("10 digits"),
      `Backend Register API rejects 9-digit phone (Status 400: ${regBadPhoneRes?.error?.details?.[0]?.message || regBadPhoneRes?.message})`
    );

    // 4.4: Auth Customer Register API with password mismatch
    const regMismatch = await fetch("http://localhost:5000/api/auth/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "unique" + Date.now() + "@example.com",
        phone: "9876543210",
        password: "password123",
        confirmPassword: "differentPassword"
      })
    });
    const regMismatchRes = await regMismatch.json();
    assert(
      regMismatch.status === 400 && JSON.stringify(regMismatchRes).toLowerCase().includes("match"),
      `Backend Register API rejects password mismatch (Status 400: ${regMismatchRes?.error?.details?.[0]?.message || regMismatchRes?.message})`
    );

    // 4.5: Auth Customer Register API with short password (< 6 chars)
    const regShortPw = await fetch("http://localhost:5000/api/auth/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "unique" + Date.now() + "@example.com",
        phone: "9876543210",
        password: "123",
        confirmPassword: "123"
      })
    });
    const regShortPwRes = await regShortPw.json();
    assert(
      regShortPw.status === 400 && JSON.stringify(regShortPwRes).includes("6 characters"),
      `Backend Register API rejects short password (Status 400)`
    );

    // 4.6: Auth Customer Login API with invalid email
    const loginBadEmail = await fetch("http://localhost:5000/api/auth/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "bad-email-format",
        password: "password123"
      })
    });
    assert(loginBadEmail.status === 400, "Backend Customer Login rejects invalid email format (Status 400)");

    // 4.7: Auth Customer Verify OTP with non-6-digit code
    const otpBad = await fetch("http://localhost:5000/api/auth/customer/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        otp: "123" // 3 digits
      })
    });
    const otpBadRes = await otpBad.json();
    assert(
      otpBad.status === 400 && JSON.stringify(otpBadRes).includes("6-digit"),
      `Backend Verify OTP rejects non-6-digit code (Status 400: ${otpBadRes?.error?.details?.[0]?.message || otpBadRes?.message})`
    );

    // 4.8: Order API with invalid phone (fewer than 10 digits)
    const orderBadData = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: "John Doe",
        email: "valid@example.com",
        phone: "12345", // invalid phone
        shipping_address: "123 Main Street",
        pincode: "600001",
        items: [{ product_id: 1, quantity: 1 }]
      })
    });
    const orderBadDataRes = await orderBadData.json();
    assert(
      orderBadData.status === 400 && JSON.stringify(orderBadDataRes).includes("10 digits"),
      `Backend Order API rejects short phone number (Status 400: ${orderBadDataRes?.error?.details?.[0]?.message || orderBadDataRes?.message})`
    );

    // 4.9: Order API with invalid pincode (fewer than 6 digits)
    const orderBadPin = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: "John Doe",
        email: "valid@example.com",
        phone: "9876543210",
        shipping_address: "123 Main Street",
        pincode: "123", // invalid pincode
        items: [{ product_id: 1, quantity: 1 }]
      })
    });
    const orderBadPinRes = await orderBadPin.json();
    assert(
      orderBadPin.status === 400 && JSON.stringify(orderBadPinRes).includes("6 digits"),
      `Backend Order API rejects non-6-digit PIN code (Status 400: ${orderBadPinRes?.error?.details?.[0]?.message || orderBadPinRes?.message})`
    );

    console.log(`\n==============================================================`);
    console.log(` AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED `);
    console.log(`==============================================================`);

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
  }
}

runTests();
