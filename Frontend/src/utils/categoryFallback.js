/**
 * Category fallback and history tracking utility.
 * Resolves previous valid active category when a category has been deleted in Admin
 * or when an inactive/non-existent category URL is accessed.
 */

export const CATEGORY_HISTORY_KEY = "hd_categories_order_history";

export function isCategoryMatch(catSlug, targetSlug) {
  if (!catSlug || !targetSlug) return false;
  const s1 = String(catSlug).toLowerCase().trim();
  const s2 = String(targetSlug).toLowerCase().trim();
  if (s1 === s2) return true;
  // Normalize men / mens
  if ((s1 === "men" || s1 === "mens") && (s2 === "men" || s2 === "mens")) return true;
  // Normalize woman / women / womens
  if (
    (s1 === "women" || s1 === "woman" || s1 === "womens") &&
    (s2 === "women" || s2 === "woman" || s2 === "womens")
  ) {
    return true;
  }
  return false;
}

export function getCategoryHistory() {
  try {
    const raw = localStorage.getItem(CATEGORY_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {}
  return ["men", "women", "boys", "girls", "babies"];
}

export function saveCategoryHistory(activeCategories) {
  if (!Array.isArray(activeCategories) || activeCategories.length === 0) return;
  try {
    const existing = getCategoryHistory();
    const currentSlugs = activeCategories
      .filter((c) => c && c.slug)
      .map((c) => String(c.slug).toLowerCase().trim());

    const merged = [...existing];
    currentSlugs.forEach((slug, idx) => {
      const existingIdx = merged.findIndex((s) => isCategoryMatch(s, slug));
      if (existingIdx === -1) {
        // Find previous slug in currentSlugs that exists in merged
        let insertAfter = -1;
        for (let i = idx - 1; i >= 0; i--) {
          const prevSlug = currentSlugs[i];
          const found = merged.findIndex((s) => isCategoryMatch(s, prevSlug));
          if (found !== -1) {
            insertAfter = found;
            break;
          }
        }
        if (insertAfter !== -1) {
          merged.splice(insertAfter + 1, 0, slug);
        } else {
          merged.push(slug);
        }
      }
    });

    localStorage.setItem(CATEGORY_HISTORY_KEY, JSON.stringify(merged));
  } catch {}
}

/**
 * Resolves the previous active category when a requested category has been deleted or is invalid.
 * If category X was deleted, finds the category immediately preceding X in the category sequence.
 * Example: If "kids" (which comes after "babies") is deleted, returns "babies".
 */
export function resolveFallbackCategory(requestedSlug, activeCategories) {
  if (!Array.isArray(activeCategories) || activeCategories.length === 0) return null;

  const target = String(requestedSlug || "").toLowerCase().trim();
  const history = getCategoryHistory();

  // 1. Try to find the target in historical sequence
  const historyIdx = history.findIndex((s) => isCategoryMatch(s, target));
  if (historyIdx !== -1) {
    // Search backwards in history for the previous active category
    for (let i = historyIdx - 1; i >= 0; i--) {
      const activeMatch = activeCategories.find((c) => isCategoryMatch(c.slug, history[i]));
      if (activeMatch) return activeMatch;
    }
    // If nothing backward (was first in list), search forward
    for (let i = historyIdx + 1; i < history.length; i++) {
      const activeMatch = activeCategories.find((c) => isCategoryMatch(c.slug, history[i]));
      if (activeMatch) return activeMatch;
    }
  }

  // 2. Specific domain knowledge:
  // If "kids" was deleted, the category before it was "babies"
  if (target === "kids") {
    const babies = activeCategories.find((c) => isCategoryMatch(c.slug, "babies"));
    if (babies) return babies;
  }

  // 3. Fallback to the last active category in sequence (which represents the category before newly appended items)
  return activeCategories[activeCategories.length - 1] || activeCategories[0] || null;
}
