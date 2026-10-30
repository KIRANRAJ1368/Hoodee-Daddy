/**
 * Age-based size presets for HooDee Daddy.
 * - Babies: 0–2 Months, 2–4 Months, 4–6 Months, 6–8 Months, 8–10 Months, 10–12 Months, 12–18 Months, 18–24 Months.
 * - Boys / Girls / Kids: 2–4 Years, 4–6 Years, 6–8 Years, 8–10 Years, 10–12 Years, 12–14 Years, 14–16 Years.
 */

export const BABIES_AGE_PRESETS = [
  "0–2 Months",
  "2–4 Months",
  "4–6 Months",
  "6–8 Months",
  "8–10 Months",
  "10–12 Months",
  "12–18 Months",
  "18–24 Months"
];

export const KIDS_AGE_PRESETS = [
  "2–4 Years",
  "4–6 Years",
  "6–8 Years",
  "8–10 Years",
  "10–12 Years",
  "12–14 Years",
  "14–16 Years"
];

/**
 * Normalizes an age string (standardizes hyphens, dashes, spaces, and case)
 * e.g. "2-4" -> "2-4", "2–4 Years" -> "2-4years", "0 - 2 Months" -> "0-2months"
 */
export function normalizeAgeStr(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Checks whether a given category, product, or category ID is Babies/Newborn.
 * Safely accepts:
 * - Category object { id, name, slug }
 * - Product object { categoryId, category_id, category, name }
 * - Category name/slug string ("babies", "mens", "Newborn Babies", etc.)
 * - Category ID number or string (e.g. 1)
 */
export function isBabiesCategory(category, categories = []) {
  if (!category) return false;

  // 1. If numeric category ID
  const numericId = typeof category === "number" ? category : (/^\d+$/.test(category) ? Number(category) : null);
  if (numericId !== null) {
    if (numericId === 1) return true; // Category 1 is "Newborn Babies"
    if (Array.isArray(categories) && categories.length > 0) {
      const matched = categories.find((c) => Number(c.id) === numericId);
      if (matched) return isBabiesCategory(matched);
    }
  }

  // 2. If product object with categoryId or category
  if (typeof category === "object" && (category.categoryId !== undefined || category.category_id !== undefined)) {
    const catId = Number(category.categoryId || category.category_id);
    if (catId === 1) return true;
    if (Array.isArray(categories) && categories.length > 0) {
      const matched = categories.find((c) => Number(c.id) === catId);
      if (matched) return isBabiesCategory(matched);
    }
    if (category.category && typeof category.category === "string") {
      return isBabiesCategory(category.category);
    }
  }

  // 3. String matching on name, slug, or raw text
  const name = typeof category === "string" ? category : String(category.name || "");
  const slug = typeof category === "string" ? category : String(category.slug || "");
  const combined = `${name} ${slug}`.toLowerCase();

  return (
    combined.includes("baby") ||
    combined.includes("babies") ||
    combined.includes("newborn") ||
    combined.includes("infant") ||
    combined.includes("toddler") ||
    combined.includes("month")
  );
}

/**
 * Returns the relevant age options dynamically based on the selected category.
 */
export function getAgePresetsForCategory(category, categories = []) {
  return isBabiesCategory(category, categories) ? BABIES_AGE_PRESETS : KIDS_AGE_PRESETS;
}

/**
 * Matches an incoming size string (e.g. "2-4", "2–4 Years", "Free Size")
 * against the dynamic preset list. If "Free Size" or invalid, falls back to the category's first dynamic preset.
 */
export function matchAgePreset(sizeStr, isBabies) {
  const presets = isBabies ? BABIES_AGE_PRESETS : KIDS_AGE_PRESETS;
  if (!sizeStr || sizeStr === "Free Size" || /free\s*size/i.test(sizeStr)) {
    return presets[0];
  }

  const normalizedInput = normalizeAgeStr(sizeStr);

  // Exact or normalized preset match
  const matched = presets.find((p) => {
    const normPreset = normalizeAgeStr(p);
    if (normPreset === normalizedInput) return true;

    // Check prefix numbers e.g. "2-4" matching "2-4years"
    const prefix = normPreset.replace(/(years|months)/i, "");
    if (prefix === normalizedInput) return true;
    return false;
  });

  return matched || sizeStr.trim();
}

/**
 * Converts an age preset string to a clean alphanumeric SKU suffix.
 * Never defaults to "FS" (Free Size).
 * e.g. "0–2 Months" -> "02M", "2–4 Years" -> "24Y", "12–14 Years" -> "1214Y"
 */
export function sizeToSkuSuffix(sizeStr, isBabies) {
  const fallback = isBabies ? "02M" : "24Y";
  if (!sizeStr || sizeStr === "Free Size" || /free\s*size/i.test(sizeStr)) {
    return fallback;
  }

  const s = String(sizeStr).trim();
  const digits = s.replace(/\D/g, "");

  if (/month/i.test(s)) {
    return `${digits || "02"}M`;
  }
  if (/year/i.test(s)) {
    return `${digits || "24"}Y`;
  }

  const clean = s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean || fallback;
}
