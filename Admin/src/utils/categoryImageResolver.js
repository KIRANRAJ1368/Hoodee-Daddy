/**
 * HooDee Daddy Storefront & Admin Category & Subcategory Image Resolver
 * Only returns image URLs explicitly configured or uploaded from Admin.
 */

export const DEFAULT_CATEGORY_IMAGES = {};
export const DEFAULT_SUBCATEGORY_IMAGES = {};

/**
 * Returns the effective cover photo URL for a category.
 * Returns the image URL only when added from Admin.
 */
export function getCategoryImageUrl(category) {
  if (!category) return "";
  if (category.image_url && typeof category.image_url === "string" && category.image_url.trim()) {
    return category.image_url.trim();
  }
  return "";
}

/**
 * Returns the effective thumbnail photo URL for a subcategory.
 * Returns the image URL only when added from Admin.
 */
export function getSubcategoryImageUrl(subcategory) {
  if (!subcategory) return "";
  if (subcategory.image_url && typeof subcategory.image_url === "string" && subcategory.image_url.trim()) {
    return subcategory.image_url.trim();
  }
  return "";
}

