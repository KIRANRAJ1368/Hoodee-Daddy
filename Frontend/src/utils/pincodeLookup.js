import { storefrontApi } from "../services/storefrontApi";

const cache = new Map();

/**
 * Fast, reliable Indian postal PIN code lookup.
 * Queries postal API with in-memory caching and backend proxy fallback.
 *
 * @param {string} rawPin - 6-digit postal code
 * @returns {Promise<{success: boolean, district: string, state: string, postOffices: Array, error?: string}>}
 */
export async function lookupPincodeLocation(rawPin) {
  const pin = String(rawPin || "").replace(/\D/g, "");

  if (pin.length !== 6) {
    return { success: false, district: "", state: "", postOffices: [], error: "PIN code must be 6 digits" };
  }

  if (cache.has(pin)) {
    return cache.get(pin);
  }

  // Strategy 1: Fast direct fetch from Postal API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const result = await response.json();
      if (result?.[0]?.Status === "Success" && Array.isArray(result[0]?.PostOffice) && result[0].PostOffice.length > 0) {
        const offices = result[0].PostOffice;
        const entry = {
          success: true,
          district: offices[0].District || "",
          state: offices[0].State || "",
          postOffices: offices
        };
        cache.set(pin, entry);
        return entry;
      }
    }
  } catch {
    // Proceed to fallback
  }

  // Strategy 2: Backend proxy fallback
  try {
    const res = await storefrontApi.lookupPincode(pin);
    if (res && res.district) {
      const entry = {
        success: true,
        district: res.district,
        state: res.state,
        postOffices: res.postOffices || []
      };
      cache.set(pin, entry);
      return entry;
    }
  } catch {
    // Fallback failed
  }

  return {
    success: false,
    district: "",
    state: "",
    postOffices: [],
    error: "Location not found for this PIN code"
  };
}
