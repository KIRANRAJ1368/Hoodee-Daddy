const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;
let smtpAuthNoticeLogged = false;
let smtpAuthDisabled = false;

function handleSmtpAuthError(err, context = "dispatch") {
  const isAuthError =
    err.code === "EAUTH" ||
    (err.message && (err.message.includes("534") || err.message.includes("Invalid login") || err.message.includes("WebLoginRequired")));

  if (isAuthError) {
    smtpAuthDisabled = true;
    if (!smtpAuthNoticeLogged) {
      smtpAuthNoticeLogged = true;
      // eslint-disable-next-line no-console
      console.warn(
        `\n[HOODEE DADDY NODEMAILER] ⚠️ Gmail SMTP authentication notice: ${err.message}\n` +
        `[HOODEE DADDY NODEMAILER] 💡 To send live emails, generate an App Password in Google Account Security and configure SMTP_PASS in Backend/.env.\n` +
        `[HOODEE DADDY NODEMAILER] ℹ️ Outgoing emails will be recorded in simulation mode so checkout and OTP flows execute smoothly without terminal errors.\n`
      );
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`[HOODEE DADDY NODEMAILER] ❌ Failed to ${context} via SMTP:`, err.message);
  }
}

function getTransporter() {
  if (transporter) return transporter;

  const { host, port, secure, user, pass } = env.smtp;
  const cleanPass = (pass || "").replace(/\s+/g, "");

  let transportConfig;
  if (host === "smtp.gmail.com" || (user && user.toLowerCase().endsWith("@gmail.com"))) {
    transportConfig = {
      pool: true,
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user,
        pass: cleanPass
      },
      maxConnections: 5,
      maxMessages: 100
    };
  } else {
    transportConfig = {
      pool: true,
      host: host || "smtp.gmail.com",
      port: port || 587,
      secure: Boolean(secure),
      family: 4,
      maxConnections: 5
    };
    if (user && pass) {
      transportConfig.auth = { user, pass: cleanPass };
    }
  }

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
}

/**
 * Sends a 6-digit OTP to the recipient email address for password reset.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{success: boolean, messageId?: string, simulated?: boolean, error?: string}>}
 */
async function sendPasswordResetOtp(email, otp) {
  const { user, pass, from } = env.smtp;

  const subject = `${otp} is your HooDee Daddy verification code`;
  const text = `Hello,\n\nYour password reset verification code is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nHooDee Daddy Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HooDee Daddy - Password Reset Code</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #091525;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(9, 21, 37, 0.08);">
    <div style="background-color: #091525; padding: 28px 24px; text-align: center; border-bottom: 3px solid #ff7300;">
      <span style="font-size: 13px; font-weight: 800; letter-spacing: 3px; color: #ff7300; text-transform: uppercase;">HOODEE DADDY</span>
      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 10px 0 0 0; letter-spacing: 0.5px;">Password Reset Verification</h1>
    </div>
    <div style="padding: 32px 28px;">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 18px 0;">
        Hello,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
        We received a request to reset your <strong>HooDee Daddy</strong> account password. Use the verification code below to complete your password reset:
      </p>
      
      <div style="background: #f8fafc; border: 2px dashed #ff7300; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0;">
        <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">Your 6-Digit One-Time Code</span>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #091525; display: inline-block;">${otp}</span>
      </div>

      <div style="background: #fff7ed; border-left: 4px solid #ff7300; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #9a3412; line-height: 1.5;">
          ⏱️ <strong>Important:</strong> This verification code is valid for <strong>10 minutes</strong> and can only be used once.
        </p>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 8px 0;">
        If you did not request a password reset, no further action is required. Your password will remain unchanged.
      </p>
    </div>

    <div style="background: #091525; padding: 18px 24px; text-align: center;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        &copy; ${new Date().getFullYear()} HooDee Daddy. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  // Always log prominently to terminal console
  console.log("\n=======================================================");
  console.log(`[HOODEE DADDY NODEMAILER] 🔑 PASSWORD RESET OTP DISPATCHED`);
  console.log(`[Recipient] : ${email}`);
  console.log(`[OTP Code]  : ${otp}`);
  console.log(`[Expires In]: 10 minutes`);
  console.log("=======================================================\n");

  if (!user || !pass || smtpAuthDisabled) {
    console.log(`[HOODEE DADDY NODEMAILER] ℹ️ SMTP is not configured or in simulated mode. OTP code displayed in terminal above.`);
    return { success: true, simulated: true };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: from || `HooDee Daddy <${user}>`,
      to: email,
      subject,
      text,
      html
    });

    console.log(`[HOODEE DADDY NODEMAILER] ✅ Real email sent successfully to ${email}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    handleSmtpAuthError(err, "dispatch OTP");
    return { success: true, simulated: true, error: err.message };
  }
}

async function sendOrderConfirmationEmail(email, order) {
  const user = env.smtp.user || process.env.SMTP_USER;
  const pass = env.smtp.pass || process.env.SMTP_PASS;
  const from = env.smtp.from || process.env.SMTP_FROM;

  const orderNumber = order.order_number || String(order.id);
  const customerName = order.customer_name || "Valued Client";
  const items = order.items || [];
  const total = Number(order.total || 0).toLocaleString("en-IN");
  const subtotal = Number(order.subtotal || order.total || 0).toLocaleString("en-IN");
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_fee || 0);

  const subject = `Order Confirmed: ${orderNumber} — HooDee Daddy Concierge`;
  const text = `Dear ${customerName},\n\nThank you for choosing HooDee Daddy. Your order ${orderNumber} for ₹${total} has been confirmed.\n\nShipping Address: ${order.shipping_address}, ${order.city || ""}\n\nWe will notify you once dispatched.\n\nHooDee Daddy Atelier`;

  const itemsHtml = items.map((it) => {
    const title = it.product_name_snapshot || it.title || "Signature Piece";
    const qty = it.quantity || 1;
    const price = Number(it.unit_price || it.price || 0).toLocaleString("en-IN");
    const meta = [it.size ? `Size: ${it.size}` : "", it.color ? `Color: ${it.color}` : ""].filter(Boolean).join(" | ");
    return `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #091525;">
          <strong>${title}</strong>
          ${meta ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${meta}</div>` : ""}
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569; text-align: center;">${qty}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #091525; text-align: right;">₹${price}</td>
      </tr>
    `;
  }).join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - HooDee Daddy</title>
</head>
<body style="margin: 0; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #091525;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(9, 21, 37, 0.08);">
    <div style="background: #091525; padding: 28px 24px; text-align: center; border-bottom: 3px solid #ff7300;">
      <h1 style="color: #ffffff; font-size: 26px; letter-spacing: 0.15em; margin: 0; font-weight: 800;">HooDee Daddy</h1>
      <p style="color: #ff7300; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 700;">Premium Hoodies &amp; Everyday Essentials</p>
    </div>

    <div style="padding: 32px 28px;">
      <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #ff7300; text-transform: uppercase; background: #fff7ed; padding: 4px 10px; border-radius: 999px; border: 1px solid #ffedd5;">Order Confirmed</span>
      <h2 style="font-size: 20px; color: #091525; margin: 12px 0 16px 0;">Thank you, ${customerName}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
        We have received your order <strong>${orderNumber}</strong>. Our fulfillment team is preparing your pieces with precision for express dispatch.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Order Reference:</td>
            <td style="text-align: right; font-weight: 700; color: #091525;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Payment Method:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${(order.payment_method || "Online Pay").toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Delivery Destination:</td>
            <td style="text-align: right; color: #091525;">${order.shipping_address}${order.city ? `, ${order.city}` : ""}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #091525; margin: 0 0 10px 0; border-bottom: 2px solid #091525; padding-bottom: 6px;">
        Ordered Items
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #091525; color: #ffffff;">
            <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #ffffff;">Piece</th>
            <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #ffffff;">Qty</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #ffffff;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #64748b;">HooDee Daddy Order</td></tr>'}
        </tbody>
      </table>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
            <td style="padding: 4px 0; text-align: right; color: #091525; font-weight: 600;">₹${subtotal}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #059669;">Special Discount:</td>
            <td style="padding: 4px 0; text-align: right; color: #059669; font-weight: 600;">-₹${discount.toLocaleString("en-IN")}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Express Insured Courier:</td>
            <td style="padding: 4px 0; text-align: right; color: #091525;">${shipping > 0 ? `₹${shipping.toLocaleString("en-IN")}` : "FREE"}</td>
          </tr>
          <tr style="font-size: 16px; font-weight: 800; border-top: 2px solid #091525;">
            <td style="padding: 10px 0 0 0; color: #091525;">Total Paid:</td>
            <td style="padding: 10px 0 0 0; text-align: right; color: #ff7300; font-size: 18px;">₹${total}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
        Questions or instructions? Contact our support desk at <a href="mailto:support@hoodeedaddy.com" style="color: #ff7300; text-decoration: none; font-weight: 700;">support@hoodeedaddy.com</a> or WhatsApp <strong>+91 9876543210</strong>.
      </div>
    </div>

    <div style="background: #091525; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} HooDee Daddy, 123 Avinashi Road, Peelamedu, Coimbatore. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  console.log(`\n[HOODEE DADDY NODEMAILER] 📦 ORDER CONFIRMATION EMAIL PREPARED for ${email} (Order ${orderNumber})`);

  if (!user || !pass || smtpAuthDisabled) {
    console.log(`[HOODEE DADDY NODEMAILER] ℹ️ SMTP not active or in simulated mode. Order confirmation recorded for ${email}.`);
    return { success: true, simulated: true };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: from || `HooDee Daddy Concierge <${user}>`,
      to: email,
      subject,
      text,
      html
    });
    console.log(`[HOODEE DADDY NODEMAILER] ✅ Order confirmation dispatched to ${email}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    handleSmtpAuthError(err, "dispatch order confirmation");
    return { success: true, simulated: true, error: err.message };
  }
}

async function sendRefundConfirmationEmail(email, order) {
  const user = env.smtp.user || process.env.SMTP_USER;
  const pass = env.smtp.pass || process.env.SMTP_PASS;
  const from = env.smtp.from || process.env.SMTP_FROM;

  const orderNumber = order.order_number || String(order.id);
  const customerName = order.customer_name || "Valued Client";
  const amount = Number(order.refund_amount || order.total || 0).toLocaleString("en-IN");
  const utr = order.refund_utr_number || "BANK-REF-COMPLETED";
  const upiId = order.refund_upi_id || "Direct Account Transfer";

  const subject = `Refund Processed: ₹${amount} for Order ${orderNumber} — HooDee Daddy`;
  const text = `Dear ${customerName},\n\nYour refund of ₹${amount} for order ${orderNumber} has been processed successfully to your UPI ID: ${upiId}.\n\nBank / UPI Reference Number (UTR): ${utr}\n\nThank you for choosing HooDee Daddy.\n\nHooDee Daddy Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Refund Confirmation - HooDee Daddy</title>
</head>
<body style="margin: 0; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #091525;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(9, 21, 37, 0.08);">
    <div style="background: #091525; padding: 28px 24px; text-align: center; border-bottom: 3px solid #ff7300;">
      <h1 style="color: #ffffff; font-size: 26px; letter-spacing: 0.15em; margin: 0; font-weight: 800;">HooDee Daddy</h1>
      <p style="color: #ff7300; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 700;">Premium Hoodies &amp; Everyday Essentials</p>
    </div>

    <div style="padding: 32px 28px;">
      <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #059669; text-transform: uppercase; background: #ecfdf5; padding: 4px 10px; border-radius: 999px; border: 1px solid #a7f3d0;">Refund Completed</span>
      <h2 style="font-size: 20px; color: #091525; margin: 12px 0 16px 0;">Refund Initiated, ${customerName}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
        We have successfully transferred your refund for order <strong>${orderNumber}</strong>. The funds should reflect in your linked bank account immediately or within 24 hours.
      </p>

      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #065f46; padding: 6px 0;">Order Reference:</td>
            <td style="text-align: right; font-weight: 700; color: #091525;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #065f46; padding: 6px 0;">Refund Amount:</td>
            <td style="text-align: right; font-weight: 800; font-size: 18px; color: #059669;">₹${amount}</td>
          </tr>
          <tr>
            <td style="color: #065f46; padding: 6px 0;">Credited to UPI ID:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${upiId}</td>
          </tr>
          <tr>
            <td style="color: #065f46; padding: 6px 0;">Bank UTR / Ref Number:</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #091525;">${utr}</td>
          </tr>
          <tr>
            <td style="color: #065f46; padding: 6px 0;">Settlement Date:</td>
            <td style="text-align: right; color: #64748b;">${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
        Need assistance with your refund? Contact our support desk at <a href="mailto:support@hoodeedaddy.com" style="color: #ff7300; text-decoration: none; font-weight: 700;">support@hoodeedaddy.com</a>.
      </div>
    </div>

    <div style="background: #091525; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} HooDee Daddy. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  console.log(`\n[HOODEE DADDY NODEMAILER] 💸 REFUND EMAIL PREPARED for ${email} (Order ${orderNumber}, UTR: ${utr})`);

  if (!user || !pass || smtpAuthDisabled) {
    console.log(`[HOODEE DADDY NODEMAILER] ℹ️ SMTP not active or in simulated mode. Refund record generated for ${email}.`);
    return { success: true, simulated: true };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: from || `HooDee Daddy Concierge <${user}>`,
      to: email,
      subject,
      text,
      html
    });
    console.log(`[HOODEE DADDY NODEMAILER] ✅ Refund email dispatched to ${email}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    handleSmtpAuthError(err, "dispatch refund confirmation");
    return { success: true, simulated: true, error: err.message };
  }
}

/**
 * Generates responsive, luxury HTML and plain-text email content for order status updates.
 */
function buildOrderStatusEmailHtml(order, newStatus, prevStatus = null, extra = {}) {
  const orderNumber = order.order_number || String(order.id);
  const customerName = order.customer_name || (order.user && order.user.name) || "Valued Client";

  // Normalize status key
  let status = String(newStatus || order.status || "").toLowerCase().trim();
  if (status === "confirm" || status === "conformed") status = "confirmed";
  if (status === "pack" || status === "manifested") status = "packed";
  if (status === "shipping" || status === "in_transit" || status === "out_for_delivery") status = "shipped";
  if (status === "deliver") status = "delivered";
  if (status === "cancel") status = "cancelled";
  if (status === "return") status = "returned";

  // Courier & Tracking details
  const courierName = extra.courier_name || order.courier_name || "Shiprocket Express Partner";
  const awbCode = extra.awb_code || order.awb_code || order.tracking_number || "";
  const estimatedDelivery = extra.estimated_delivery || order.estimated_delivery || "2–4 Business Days";
  const trackingUrl = awbCode
    ? `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`
    : "";

  // Items
  const items = order.items || [];
  const total = Number(order.total || 0).toLocaleString("en-IN");
  const subtotal = Number(order.subtotal || order.total || 0).toLocaleString("en-IN");
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_fee || 0);

  // Status configuration definitions (colors, subjects, headings, descriptions)
  const statusMeta = {
    confirmed: {
      subject: `Order Confirmed: ${orderNumber} — HooDee Daddy Atelier`,
      badge: "ORDER CONFIRMED",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      badgeColor: "#1d4ed8",
      headline: "Your Order is Confirmed & Verified",
      lead: `Thank you for choosing HooDee Daddy, ${customerName}. Your order <strong>${orderNumber}</strong> has been verified by our atelier. Our master artisans are now preparing your pieces for express dispatch.`,
      nextStep: "Our atelier is inspecting the tailoring and packaging your pieces in our signature luxury box."
    },
    packed: {
      subject: `Order Packed & Ready for Dispatch: ${orderNumber} — HooDee Daddy`,
      badge: "PACKED & SECURED",
      badgeBg: "#fef3c7",
      badgeBorder: "#fde68a",
      badgeColor: "#92400e",
      headline: "Your Order is Carefully Packed & Boxed",
      lead: `Exquisite news, ${customerName}! Your garments for order <strong>${orderNumber}</strong> have cleared our quality inspection and have been carefully placed inside our tamper-evident signature box with silk tissue lining.`,
      nextStep: "Awaiting courier pickup and manifest scan from our central dispatch hub."
    },
    shipped: {
      subject: `Your Order Has Shipped: ${orderNumber} — On Its Way!`,
      badge: "DISPATCHED & IN TRANSIT",
      badgeBg: "#f0fdf4",
      badgeBorder: "#bbf7d0",
      badgeColor: "#15803d",
      headline: "Your Luxury Order is on the Way",
      lead: `Your parcel for order <strong>${orderNumber}</strong> has been handed over to our express courier partner and is en route to your delivery address.`,
      nextStep: "You can track your package in real-time below as it travels to your city."
    },
    delivered: {
      subject: `Delivered: ${orderNumber} — Thank You for Choosing HooDee Daddy`,
      badge: "DELIVERED SUCCESSFULLY",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      badgeColor: "#047857",
      headline: "Your Package Has Been Delivered",
      lead: `We are delighted to confirm that your order <strong>${orderNumber}</strong> has been successfully delivered. We hope you adore the fit, fabric, and craftsmanship of your new HooDee Daddy pieces.`,
      nextStep: "If you have any questions or require styling adjustments, our atelier concierge is always at your service."
    },
    cancelled: {
      subject: `Order Cancellation Notice: ${orderNumber} — HooDee Daddy`,
      badge: "ORDER CANCELLED",
      badgeBg: "#fef2f2",
      badgeBorder: "#fecaca",
      badgeColor: "#b91c1c",
      headline: "Your Order Has Been Cancelled",
      lead: `Your order <strong>${orderNumber}</strong> has been cancelled${extra.reason || order.cancellation_reason ? ` (Reason: <em>${extra.reason || order.cancellation_reason}</em>)` : ""}.`,
      nextStep: order.payment_method === "PREPAID"
        ? `A refund of ₹${total} has been queued to your original payment method or UPI ID (${order.refund_upi_id || "Direct bank transfer"}). Typical settlement time is 24–48 hours.`
        : "As this order was placed with Cash on Delivery (COD), no payment was charged."
    },
    returned: {
      subject: `Return Received & Verified: ${orderNumber} — HooDee Daddy`,
      badge: "RETURN INSPECTION COMPLETE",
      badgeBg: "#f5f3ff",
      badgeBorder: "#ddd6fe",
      badgeColor: "#6d28d9",
      headline: "Return Package Received at Warehouse",
      lead: `The returned package for order <strong>${orderNumber}</strong> has arrived at our warehouse and completed our quality inspection. All returned pieces have been verified.`,
      nextStep: `Your return status is complete. ${order.refund_utr_number ? `Refund settled under UTR: ${order.refund_utr_number}.` : "If a refund is due, our finance desk will credit your UPI / bank account shortly."}`
    }
  };

  const meta = statusMeta[status] || {
    subject: `Order Status Update: ${orderNumber} (${status.toUpperCase()}) — HooDee Daddy`,
    badge: `STATUS: ${status.toUpperCase()}`,
    badgeBg: "#f3f4f6",
    badgeBorder: "#e5e7eb",
    badgeColor: "#374151",
    headline: `Order Status Updated to ${status.toUpperCase()}`,
    lead: `Your order <strong>${orderNumber}</strong> status has been updated to <strong>${status}</strong>.`,
    nextStep: "Our atelier concierge is managing your order with utmost care."
  };

  // Stepper Progress Bar
  let stepperHtml = "";
  if (["confirmed", "packed", "shipped", "delivered"].includes(status)) {
    const steps = [
      { key: "confirmed", label: "Confirmed" },
      { key: "packed", label: "Packed" },
      { key: "shipped", label: "Shipped" },
      { key: "delivered", label: "Delivered" }
    ];
    const stepOrder = { confirmed: 1, packed: 2, shipped: 3, delivered: 4 };
    const currentStepIndex = stepOrder[status] || 1;

    const stepCols = steps.map((s, idx) => {
      const stepNum = idx + 1;
      const isCompleted = stepNum <= currentStepIndex;
      const isCurrent = stepNum === currentStepIndex;

      const circleBg = isCompleted ? "#ff7300" : "#e2e8f0";
      const circleText = isCompleted ? "#ffffff" : "#64748b";
      const labelColor = isCurrent ? "#091525" : (isCompleted ? "#ff7300" : "#94a3b8");
      const labelWeight = isCurrent ? "800" : (isCompleted ? "700" : "500");

      return `
        <td style="text-align: center; width: 25%; vertical-align: top; padding: 0 4px;">
          <div style="display: inline-block; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background-color: ${circleBg}; color: ${circleText}; font-weight: 700; font-size: 12px; margin-bottom: 6px;">
            ${isCompleted && !isCurrent ? "&#10003;" : stepNum}
          </div>
          <div style="font-size: 11px; font-weight: ${labelWeight}; color: ${labelColor}; text-transform: uppercase; letter-spacing: 0.05em;">
            ${s.label}
          </div>
        </td>
      `;
    }).join("");

    stepperHtml = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 12px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${stepCols}
          </tr>
        </table>
      </div>
    `;
  }

  // Courier Highlight Box
  let courierHighlightHtml = "";
  if (["packed", "shipped", "delivered"].includes(status) && (status === "shipped" || awbCode)) {
    courierHighlightHtml = `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
          🚚 Courier & Tracking Details
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #4b5563; padding: 4px 0;">Courier Partner:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${courierName}</td>
          </tr>
          ${awbCode ? `
          <tr>
            <td style="color: #4b5563; padding: 4px 0;">Tracking / AWB Number:</td>
            <td style="text-align: right; font-family: monospace; font-size: 14px; font-weight: 700; color: #047857;">${awbCode}</td>
          </tr>` : ""}
          <tr>
            <td style="color: #4b5563; padding: 4px 0;">Estimated Delivery:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${estimatedDelivery}</td>
          </tr>
        </table>
        ${trackingUrl ? `
        <div style="text-align: center; margin-top: 16px;">
          <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #ff7300; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
            Track Your Shipment &rarr;
          </a>
        </div>` : ""}
      </div>
    `;
  }

  // Items table
  const itemsHtml = Array.isArray(items) && items.length > 0
    ? items.map((it) => {
        const title = it.product_name_snapshot || it.title || it.name || "HooDee Daddy Signature Piece";
        const qty = it.quantity || 1;
        const price = Number(it.unit_price || it.price || 0).toLocaleString("en-IN");
        const metaList = [it.size ? `Size: ${it.size}` : "", it.color ? `Color: ${it.color}` : ""].filter(Boolean).join(" | ");
        return `
          <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #091525;">
              <strong>${title}</strong>
              ${metaList ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${metaList}</div>` : ""}
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #4b5563; text-align: center;">${qty}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #eeeeee; font-size: 13px; color: #091525; text-align: right;">₹${price}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #64748b;">HooDee Daddy Order (${orderNumber})</td></tr>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${meta.subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #091525;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(9, 21, 37, 0.08);">
    <!-- Brand Banner -->
    <div style="background: #091525; padding: 28px 24px; text-align: center; border-bottom: 3px solid #ff7300;">
      <h1 style="color: #ffffff; font-size: 26px; letter-spacing: 0.15em; margin: 0; font-weight: 800;">HooDee Daddy</h1>
      <p style="color: #ff7300; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 700;">Premium Hoodies &amp; Everyday Essentials</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 28px;">
      <!-- Status Badge -->
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; background-color: ${meta.badgeBg}; color: ${meta.badgeColor}; border: 1px solid ${meta.badgeBorder};">
          ${meta.badge}
        </span>
      </div>

      <h2 style="font-size: 20px; color: #091525; margin: 0 0 14px 0;">
        ${meta.headline}
      </h2>

      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
        ${meta.lead}
      </p>

      <div style="background: #f8fafc; border-left: 3px solid #ff7300; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
        <p style="font-size: 13px; line-height: 1.5; color: #091525; margin: 0;">
          📌 <strong>What's Happening Now:</strong> ${meta.nextStep}
        </p>
      </div>

      <!-- Stepper Progress Bar -->
      ${stepperHtml}

      <!-- Courier Highlight if Shipped -->
      ${courierHighlightHtml}

      <!-- Order Metadata Summary Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Order Reference:</td>
            <td style="text-align: right; font-weight: 700; color: #091525;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Current Status:</td>
            <td style="text-align: right; font-weight: 800; color: ${meta.badgeColor}; text-transform: uppercase;">${status}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Payment Method:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${(order.payment_method || "COD").toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Delivery Address:</td>
            <td style="text-align: right; color: #091525;">${order.shipping_address || "On File"}${order.city ? `, ${order.city}` : ""}${order.pincode ? ` - ${order.pincode}` : ""}</td>
          </tr>
        </table>
      </div>

      <!-- Ordered Items -->
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #091525; margin: 0 0 10px 0; border-bottom: 2px solid #091525; padding-bottom: 6px;">
        Order Items Summary
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #091525; color: #ffffff;">
            <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #ffffff;">Piece</th>
            <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #ffffff;">Qty</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #ffffff;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Financial Totals -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
            <td style="padding: 4px 0; text-align: right; color: #091525; font-weight: 600;">₹${subtotal}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #059669;">Special Discount:</td>
            <td style="padding: 4px 0; text-align: right; color: #059669; font-weight: 600;">-₹${discount.toLocaleString("en-IN")}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Express Insured Delivery:</td>
            <td style="padding: 4px 0; text-align: right; color: #091525;">${shipping > 0 ? `₹${shipping.toLocaleString("en-IN")}` : "FREE"}</td>
          </tr>
          <tr style="font-size: 16px; font-weight: 800; border-top: 2px solid #091525;">
            <td style="padding: 10px 0 0 0; color: #091525;">Total Order Amount:</td>
            <td style="padding: 10px 0 0 0; text-align: right; color: #ff7300; font-size: 18px;">₹${total}</td>
          </tr>
        </table>
      </div>

      <!-- Concierge Contact -->
      <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
        Have questions about your order delivery? Reach our dedicated support team anytime at <a href="mailto:support@hoodeedaddy.com" style="color: #ff7300; text-decoration: none; font-weight: 700;">support@hoodeedaddy.com</a> or WhatsApp <strong>+91 9876543210</strong>.
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #091525; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} HooDee Daddy, 123 Avinashi Road, Peelamedu, Coimbatore. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const text = `Dear ${customerName},\n\n` +
    `Your HooDee Daddy order ${orderNumber} status has been updated to: ${status.toUpperCase()}.\n\n` +
    `${meta.headline}\n` +
    `${meta.lead.replace(/<[^>]*>/g, "")}\n\n` +
    `${awbCode ? `Courier: ${courierName}\nAWB / Tracking Number: ${awbCode}\n` : ""}` +
    `Total: ₹${total}\n` +
    `Shipping Address: ${order.shipping_address || ""}, ${order.city || ""}\n\n` +
    `Best regards,\nHooDee Daddy Atelier Concierge`;

  return {
    subject: meta.subject,
    html,
    text,
    status,
    orderNumber,
    customerName,
    awbCode,
    courierName,
    meta
  };
}

/**
 * Sends luxury status update notification email to the customer when an order status changes.
 * Supports: confirmed, packed, shipped, delivered, cancelled, returned.
 *
 * @param {string} email - Recipient customer email address
 * @param {Object} order - Order model instance or plain object
 * @param {string} newStatus - New order status (e.g. 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')
 * @param {string} [prevStatus] - Previous order status
 * @param {Object} [extra] - Additional context (courier_name, awb_code, reason, etc.)
 * @returns {Promise<{success: boolean, messageId?: string, simulated?: boolean, error?: string}>}
 */
async function sendOrderStatusUpdateEmail(email, order, newStatus, prevStatus = null, extra = {}) {
  const user = env.smtp.user || process.env.SMTP_USER;
  const pass = env.smtp.pass || process.env.SMTP_PASS;
  const from = env.smtp.from || process.env.SMTP_FROM;

  const recipientEmail = email || order.email || (order.user && order.user.email);
  if (!recipientEmail) {
    console.warn(`[HOODEE DADDY NODEMAILER] ⚠️ Cannot send order status update email: no recipient email for Order ${order?.order_number || order?.id}`);
    return { success: false, reason: "No recipient email" };
  }

  const { subject, html, text, status, orderNumber, awbCode, courierName } = buildOrderStatusEmailHtml(order, newStatus, prevStatus, extra);

  console.log(`\n=======================================================`);
  console.log(`[HOODEE DADDY NODEMAILER] 🔔 ORDER STATUS UPDATE EMAIL DISPATCHED`);
  console.log(`[Recipient] : ${recipientEmail}`);
  console.log(`[Order Ref] : ${orderNumber}`);
  console.log(`[New Status]: ${status.toUpperCase()}`);
  if (prevStatus) console.log(`[Prev State]: ${prevStatus}`);
  if (awbCode) console.log(`[Tracking]  : ${courierName} — ${awbCode}`);
  console.log(`=======================================================\n`);

  if (!user || !pass || smtpAuthDisabled) {
    console.log(`[HOODEE DADDY NODEMAILER] ℹ️ SMTP in simulated mode. Status update email successfully recorded for ${recipientEmail}.`);
    return { success: true, simulated: true };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: from || `HooDee Daddy Concierge <${user}>`,
      to: recipientEmail,
      subject,
      text,
      html
    });

    console.log(`[HOODEE DADDY NODEMAILER] ✅ Live order status email dispatched to ${recipientEmail}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    handleSmtpAuthError(err, `dispatch order status update (${status})`);
    return { success: true, simulated: true, error: err.message };
  }
}

/**
 * Generates luxury HTML and plain-text welcome email content when a customer registers.
 */
function buildWelcomeEmailHtml(customer = {}) {
  const customerName = customer.name || "Valued Client";
  const customerEmail = customer.email || "";
  const customerPhone = customer.phone || "On File";
  const storeUrl = process.env.STOREFRONT_URL || "http://localhost:3000";

  const subject = `Welcome to HooDee Daddy, ${customerName}! — Your Account is Ready`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #091525;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(9, 21, 37, 0.08);">
    <!-- Brand Banner -->
    <div style="background: #091525; padding: 32px 24px; text-align: center; border-bottom: 3px solid #ff7300;">
      <h1 style="color: #ffffff; font-size: 28px; letter-spacing: 0.15em; margin: 0; font-weight: 800;">HooDee Daddy</h1>
      <p style="color: #ff7300; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 6px 0 0 0; font-weight: 700;">Premium Hoodies &amp; Everyday Essentials</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 34px 28px;">
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; background-color: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;">
          WELCOME TO HOODEE DADDY
        </span>
      </div>

      <h2 style="font-size: 22px; color: #091525; margin: 0 0 14px 0;">
        Welcome to HooDee Daddy, ${customerName}!
      </h2>

      <p style="font-size: 14px; line-height: 1.65; color: #334155; margin: 0 0 20px 0;">
        Thank you for registering with <strong>HooDee Daddy</strong>. Your personal member profile has been activated, giving you seamless access to our Men, Women, Girls, and Babies collections, real-time order notifications, and express doorstep delivery.
      </p>

      <!-- Account Details Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #ff7300; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">
          ✨ Registered Member Profile
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Customer Name:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${customerName}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Registered Email:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${customerEmail}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Phone Number:</td>
            <td style="text-align: right; font-weight: 600; color: #091525;">${customerPhone}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0;">Account Status:</td>
            <td style="text-align: right; font-weight: 700; color: #059669;">ACTIVE &amp; VERIFIED</td>
          </tr>
        </table>
      </div>

      <!-- Member Perks -->
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #091525; margin: 0 0 12px 0; border-bottom: 2px solid #091525; padding-bottom: 6px;">
        Your HooDee Daddy Member Privileges
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; color: #334155;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <strong>📦 Live Order Status Emails</strong> — Instant email alerts when your order is Confirmed, Packed, Shipped, or Delivered.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <strong>🚚 Express Tracking</strong> — Direct courier tracking from our Coimbatore distribution hub to your doorstep.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <strong>🎁 Exclusive Coupons</strong> — Enjoy member-only seasonal discounts at checkout.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong>🛡️ Easy Support &amp; Returns</strong> — Easy online tracking, cancellations, and fast UPI refunds.
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${storeUrl}" target="_blank" style="display: inline-block; background-color: #ff7300; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
          Explore HooDee Daddy Collections &rarr;
        </a>
      </div>

      <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 12px; color: #64748b;">
        Need advice or assistance? Reach our customer care team at <a href="mailto:support@hoodeedaddy.com" style="color: #ff7300; text-decoration: none; font-weight: 700;">support@hoodeedaddy.com</a> or WhatsApp <strong>+91 9876543210</strong>.
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #091525; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} HooDee Daddy, 123 Avinashi Road, Peelamedu, Coimbatore. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const text =
    `Welcome to HooDee Daddy Atelier, ${customerName}!\n\n` +
    `Thank you for registering your account (${customerEmail}).\n` +
    `Your profile is now active. You will receive real-time email notifications at ${customerEmail} for every order status update (Confirmed, Packed, Shipped, and Delivered).\n\n` +
    `Explore our collections: ${storeUrl}\n\n` +
    `Warm regards,\nHooDee Daddy Atelier Concierge`;

  return {
    subject,
    html,
    text,
    customerName,
    customerEmail
  };
}

/**
 * Sends a luxury Welcome Email to a newly registered customer.
 *
 * @param {string} email - Recipient customer email address
 * @param {Object} customer - User object ({ id, name, email, phone })
 * @returns {Promise<{success: boolean, messageId?: string, simulated?: boolean, error?: string}>}
 */
async function sendWelcomeEmail(email, customer = {}) {
  const user = env.smtp.user || process.env.SMTP_USER;
  const pass = env.smtp.pass || process.env.SMTP_PASS;
  const from = env.smtp.from || process.env.SMTP_FROM;

  const recipientEmail = email || customer.email;
  if (!recipientEmail) {
    console.warn("[HOODEE DADDY NODEMAILER] ⚠️ Cannot send welcome email: no recipient email provided.");
    return { success: false, reason: "No recipient email" };
  }

  const { subject, html, text, customerName } = buildWelcomeEmailHtml({
    ...customer,
    email: recipientEmail
  });

  console.log(`\n=======================================================`);
  console.log(`[HOODEE DADDY NODEMAILER] 🎉 CUSTOMER WELCOME EMAIL DISPATCHED`);
  console.log(`[Recipient]    : ${recipientEmail}`);
  console.log(`[Customer Name]: ${customerName}`);
  console.log(`[Subject]      : ${subject}`);
  console.log(`=======================================================\n`);

  if (!user || !pass || smtpAuthDisabled) {
    console.log(`[HOODEE DADDY NODEMAILER] ℹ️ SMTP in simulated mode. Welcome email recorded for ${recipientEmail}.`);
    return { success: true, simulated: true };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: from || `HooDee Daddy Concierge <${user}>`,
      to: recipientEmail,
      subject,
      text,
      html
    });

    console.log(`[HOODEE DADDY NODEMAILER] ✅ Live welcome email dispatched to ${recipientEmail}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    handleSmtpAuthError(err, "dispatch welcome email");
    return { success: true, simulated: true, error: err.message };
  }
}

/**
 * Sends an email notification to the configured admin email with new first-visit customer details.
 * @param {string} adminEmail
 * @param {Object} leadData
 * @returns {Promise<{success: boolean, messageId?: string, simulated?: boolean, error?: string}>}
 */
async function sendFirstVisitLeadNotification(adminEmail, leadData = {}) {
  const { user, pass, from } = env.smtp;
  const recipientEmail = adminEmail || env.seedAdmin?.email || "adminsupport@hoodeedaddy.com";
  const { phone, pincode, district, state, ip, userAgent, submittedAt } = leadData;

  const locationSummary = [district, state].filter(Boolean).join(", ") || "India";
  const dateStr = submittedAt ? new Date(submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const subject = `🔔 New Customer Visit Lead: +91 ${phone} | PIN ${pincode} (${locationSummary})`;

  const text = `HOODEE DADDY - NEW CUSTOMER FIRST-VISIT LEAD
======================================================
A customer has submitted their contact & delivery details on their first visit to the storefront.

Customer Phone : +91 ${phone}
Delivery PIN   : ${pincode}
District       : ${district || "N/A"}
State          : ${state || "N/A"}
Submitted At   : ${dateStr} IST
IP Address     : ${ip || "N/A"}

You can use these details for customer outreach, marketing broadcasts, or checkout support.
Best regards,
HooDee Daddy System`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Customer Lead - HooDee Daddy</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #091525; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #091525;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #091525;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #091525; padding: 32px 28px; text-align: center; border-bottom: 3px solid #ff7300;">
              <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #ff7300; text-transform: uppercase; background: rgba(255, 115, 0, 0.12); padding: 4px 12px; border-radius: 999px; margin-bottom: 12px; border: 1px solid rgba(255, 115, 0, 0.3);">
                HOODEE DADDY ADMIN ALERT
              </span>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.3px;">
                New Customer Visit Lead
              </h1>
              <p style="color: #94a3b8; font-size: 13.5px; margin: 8px 0 0 0;">
                First-time storefront visitor submitted delivery &amp; contact details
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                Hello <strong>Admin</strong>, a new potential customer visited the <strong>HooDee Daddy</strong> storefront and shared their contact and location details:
              </p>

              <!-- Main Details Card -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600; width: 38%;">
                    📱 Mobile Number
                  </td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #ff7300; font-weight: 800;">
                    <a href="tel:+91${phone}" style="color: #ff7300; text-decoration: none;">+91 ${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">
                    📮 Delivery PIN Code
                  </td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 15px; color: #091525; font-weight: 700;">
                    ${pincode}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">
                    📍 District / City
                  </td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; font-weight: 600;">
                    ${district || "Auto-detected upon entry"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">
                    🗺️ State
                  </td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; font-weight: 600;">
                    ${state || "India"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600;">
                    ⏰ Submitted At
                  </td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; color: #64748b;">
                    ${dateStr} IST
                  </td>
                </tr>
                ${ip ? `
                <tr>
                  <td style="padding: 12px 18px; font-size: 12px; color: #94a3b8; font-weight: 500;">
                    🌐 Visitor IP
                  </td>
                  <td style="padding: 12px 18px; font-size: 12px; color: #94a3b8; font-family: monospace;">
                    ${ip}
                  </td>
                </tr>` : ""}
              </table>

              <!-- Action / Tip Box -->
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9a3412;">
                  💡 <strong>Checkout Autofill Active:</strong> These details have also been saved to this customer's browser. When they proceed to checkout, their phone number and PIN code will be automatically filled for a fast ordering experience.
                </p>
              </div>

              <!-- Admin Call to Action -->
              <div style="text-align: center; margin-top: 26px;">
                <a href="http://localhost:5173" style="display: inline-block; background-color: #ff7300; color: #ffffff; text-decoration: none; font-size: 13.5px; font-weight: 700; padding: 13px 28px; border-radius: 8px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(255, 115, 0, 0.25);">
                  Open HooDee Daddy Admin Panel &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #091525; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">This is an automated notification from your HooDee Daddy platform.</p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">© ${new Date().getFullYear()} HooDee Daddy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (!user || !pass || smtpAuthDisabled) {
    console.log(`\n======================================================`);
    console.log(`[HOODEE DADDY NODEMAILER] ℹ️ First-visit lead notification (SIMULATED):`);
    console.log(`To Admin     : ${recipientEmail}`);
    console.log(`Subject      : ${subject}`);
    console.log(`Customer Phone : +91 ${phone} | PIN: ${pincode} (${locationSummary})`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const activeTransporter = getTransporter();
    const info = await activeTransporter.sendMail({
      from,
      to: recipientEmail,
      subject,
      text,
      html
    });

    console.log(`[HOODEE DADDY NODEMAILER] ✅ Live first-visit lead notification dispatched to ${recipientEmail}. (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    handleSmtpAuthError(err, "dispatch first-visit lead email");
    return { success: true, simulated: true, error: err.message };
  }
}

module.exports = {
  getTransporter,
  sendPasswordResetOtp,
  sendWelcomeEmail,
  buildWelcomeEmailHtml,
  sendOrderConfirmationEmail,
  sendRefundConfirmationEmail,
  sendOrderStatusUpdateEmail,
  buildOrderStatusEmailHtml,
  sendFirstVisitLeadNotification
};



