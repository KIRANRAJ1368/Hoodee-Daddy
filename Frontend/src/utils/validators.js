/**
 * Centralized Form Validation Utilities for ZMW
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{10}$/;
export const PINCODE_REGEX = /^\d{6}$/;

/**
 * Validate standard email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate strictly 10-digit mobile number
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Filter and restrict phone input to digits only (max 10 digits)
 * @param {string} value
 * @returns {string}
 */
export function cleanPhoneInput(value) {
  if (!value) return "";
  return String(value).replace(/\D/g, "").slice(0, 10);
}

/**
 * Validate Indian PIN code (strictly 6 digits)
 * @param {string} pincode
 * @returns {boolean}
 */
export function isValidPincode(pincode) {
  if (!pincode || typeof pincode !== "string") return false;
  return PINCODE_REGEX.test(pincode.trim());
}

/**
 * Filter and restrict pincode input to digits only (max 6 digits)
 * @param {string} value
 * @returns {string}
 */
export function cleanPincodeInput(value) {
  if (!value) return "";
  return String(value).replace(/\D/g, "").slice(0, 6);
}

/**
 * Check if string is non-empty after trimming
 * @param {string} val
 * @param {number} minLen
 * @returns {boolean}
 */
export function isNonEmpty(val, minLen = 1) {
  if (!val || typeof val !== "string") return false;
  return val.trim().length >= minLen;
}

/**
 * Validate password length
 * @param {string} password
 * @param {number} minLen
 * @returns {boolean}
 */
export function isValidPassword(password, minLen = 6) {
  if (!password || typeof password !== "string") return false;
  return password.length >= minLen;
}
