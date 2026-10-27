/**
 * Age-based size presets for HooDee Daddy.
 * - Babies: 0–2 Months, 2–4 Months, 4–6 Months, 6–8 Months, 8–10 Months, 10–12 Months.
 * - Boys / Girls / Kids: 2–4 Years, 4–6 Years, 6–8 Years, 8–10 Years, 10–12 Years, 12–14 Years.
 */

export const BABIES_AGE_PRESETS = [
  "0–2 Months",
  "2–4 Months",
  "4–6 Months",
  "6–8 Months",
  "8–10 Months",
  "10–12 Months"
];

export const KIDS_AGE_PRESETS = [
  "2–4 Years",
  "4–6 Years",
  "6–8 Years",
  "8–10 Years",
  "10–12 Years",
  "12–14 Years"
];

/**
 * Checks whether a given category is Babies based on its name or slug.
 */
export function isBabiesCategory(category) {
  if (!category) return false;
  const name = String(category.name || "").toLowerCase();
  const slug = String(category.slug || "").toLowerCase();
  return (
    name.includes("baby") ||
    name.includes("babies") ||
    name.includes("newborn") ||
    name.includes("infant") ||
    name.includes("toddler") ||
    slug.includes("baby") ||
    slug.includes("babies") ||
    slug.includes("newborn") ||
    slug.includes("infant") ||
    slug.includes("toddler")
  );
}

/**
 * Returns the relevant age options dynamically based on the selected category.
 */
export function getAgePresetsForCategory(category) {
  return isBabiesCategory(category) ? BABIES_AGE_PRESETS : KIDS_AGE_PRESETS;
}
