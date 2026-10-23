const { VisitorLead, AdminUser } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const mailer = require("../utils/mailer");
const env = require("../config/env");

/**
 * Public: Submit first-visit customer lead details (Phone & PIN Code)
 * Sends notification email to the configured admin email and saves to DB.
 */
async function submitLead(req, res) {
  const { phone, pincode, district, state } = req.body;

  const cleanPhone = String(phone || "").replace(/\D/g, "");
  const cleanPin = String(pincode || "").replace(/\D/g, "");

  if (!cleanPhone || cleanPhone.length < 10) {
    throw ApiError.badRequest("Please enter a valid 10-digit mobile number");
  }

  if (!cleanPin || cleanPin.length !== 6) {
    throw ApiError.badRequest("Please enter a valid 6-digit PIN code");
  }

  // Determine client IP and user agent
  const clientIp =
    (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0].trim() : null) ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";
  const userAgent = req.headers["user-agent"] || "";

  // Resolve district/state if omitted
  let resolvedDistrict = district ? String(district).trim() : "";
  let resolvedState = state ? String(state).trim() : "";

  if (!resolvedDistrict || !resolvedState) {
    try {
      const resp = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, { signal: AbortSignal.timeout(3500) });
      const data = await resp.json();
      if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        resolvedDistrict = resolvedDistrict || data[0].PostOffice[0].District || "";
        resolvedState = resolvedState || data[0].PostOffice[0].State || "";
      }
    } catch {
      // Fallback gracefully without throwing
    }
  }

  // Find the configured admin email
  let configuredAdminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || env.seedAdmin?.email || "adminzmw@gmail.com";
  try {
    const adminUser = await AdminUser.findOne({ order: [["id", "ASC"]] });
    if (adminUser?.email) {
      configuredAdminEmail = adminUser.email;
    }
  } catch {
    // Keep fallback
  }

  // Create lead in database
  const lead = await VisitorLead.create({
    phone: cleanPhone,
    pincode: cleanPin,
    district: resolvedDistrict || null,
    state: resolvedState || null,
    ip_address: clientIp.slice(0, 64),
    user_agent: userAgent ? userAgent.slice(0, 500) : null,
    email_sent: false,
    admin_email_sent_to: configuredAdminEmail
  });

  // Asynchronously dispatch email notification so API responds quickly
  mailer
    .sendFirstVisitLeadNotification(configuredAdminEmail, {
      phone: cleanPhone,
      pincode: cleanPin,
      district: resolvedDistrict,
      state: resolvedState,
      ip: clientIp,
      userAgent,
      submittedAt: lead.created_at || new Date()
    })
    .then(async (mailResult) => {
      if (mailResult && mailResult.success) {
        lead.email_sent = true;
        await lead.save();
      }
    })
    .catch((err) => {
      console.warn("[ZMW LEADS] Warning: Failed to dispatch lead notification email:", err.message);
    });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Thank you! Your details have been saved.",
    data: {
      id: lead.id,
      phone: cleanPhone,
      pincode: cleanPin,
      district: resolvedDistrict,
      state: resolvedState
    }
  });
}

/**
 * Public: Lookup postal PIN code location (District & State)
 */
async function lookupPincode(req, res) {
  const pin = String(req.params.pincode || "").replace(/\D/g, "");

  if (pin.length !== 6) {
    throw ApiError.badRequest("Invalid PIN code. Must be 6 digits.");
  }

  try {
    const resp = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(4500) });
    const data = await resp.json();

    if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const offices = data[0].PostOffice;
      return sendSuccess(res, {
        data: {
          pincode: pin,
          district: offices[0].District || "",
          state: offices[0].State || "",
          postOffices: offices.map((o) => ({
            name: o.Name,
            district: o.District,
            state: o.State,
            block: o.Block
          }))
        }
      });
    }

    return sendSuccess(res, {
      data: {
        pincode: pin,
        district: "",
        state: "",
        postOffices: [],
        not_found: true
      }
    });
  } catch (err) {
    throw ApiError.badRequest("Could not retrieve location details for this PIN code: " + err.message);
  }
}

/**
 * Admin: List captured visitor leads
 */
async function listLeads(req, res) {
  const leads = await VisitorLead.findAll({
    order: [["id", "DESC"]],
    limit: 100
  });

  return sendSuccess(res, { data: leads });
}

module.exports = {
  submitLead,
  lookupPincode,
  listLeads
};
