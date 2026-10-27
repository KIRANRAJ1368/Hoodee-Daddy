/**
 * Merchandising Engine — Best Sellers & New Arrivals
 *
 * Provides dynamic scoring, manual merchandising overrides,
 * relative timestamp generation, category deduplication,
 * and JSON-LD schema markup for SEO.
 */

// Format relative date for New Arrivals (e.g., "Added 2 days ago", "Just In")
export function formatRelativeTime(dateString) {
  if (!dateString) return "Just In";
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));

  if (diffInDays === 0) return "Just In";
  if (diffInDays === 1) return "Added yesterday";
  if (diffInDays < 7) return `Added ${diffInDays} days ago`;
  if (diffInDays < 14) return "Added 1 week ago";
  if (diffInDays < 30) return `Added ${Math.floor(diffInDays / 7)} weeks ago`;
  return "New Season";
}

/**
 * Assign default merchandising metrics to products if not present in the catalog.
 * Uses deterministic hashing based on product ID to keep data consistent between renders.
 */
export function enrichProductMetrics(product, index = 0) {
  const seed = String(product.id ?? `p-${index}`)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Synthesize realistic e-commerce metrics if missing
  const salesVolume30d =
    product.salesVolume30d ?? Math.round(((seed * 37) % 450) + 50);
  const salesVolume7d =
    product.salesVolume7d ?? Math.round(salesVolume30d * 0.28 + ((seed % 15) - 7));
  const conversionRate =
    product.conversionRate ?? Number((((seed % 35) + 18) / 10).toFixed(1)); // 1.8% to 5.2%
  // Ranking only (never displayed) — always derived from the Admin price.
  const revenue30d =
    product.revenue30d ?? salesVolume30d * (Number(product.price) || 0);

  // Synthesize release date within last 45 days if missing
  const daysAgo = product.daysAgo ?? (seed % 42) + 1;
  const releaseDate =
    product.releaseDate ??
    new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  // Manual curation priority (1 = highest priority override, null = purely algorithmic)
  const curationPriority = product.curationPriority ?? (product.isBestSeller && index < 2 ? index + 1 : null);

  return {
    ...product,
    salesVolume30d,
    salesVolume7d,
    conversionRate,
    revenue30d,
    releaseDate,
    curationPriority,
  };
}

/**
 * Calculates Best Sellers based on sales performance, velocity, and manual curation overrides.
 *
 * Scoring Formula:
 * Score = (Volume * 0.45) + (Revenue / 100 * 0.35) + (ConversionRate * 10 * 0.20)
 * Manual overrides with `curationPriority` are placed at the front.
 *
 * @param {Array} catalog - Array of products
 * @param {Object} options - Configuration options
 * @returns {Array} 4-8 Best Seller products with rank indicators
 */
export function getBestSellers(catalog = [], options = {}) {
  const {
    limit = 8,
    period = "30d", // '30d' | '7d' | 'all-time'
    minStock = 1,
    categoryFilter = null,
  } = options;

  const enriched = catalog.map((p, i) => enrichProductMetrics(p, i));

  // Filter in-stock items and optional category
  const eligible = enriched.filter((p) => {
    const stock = p.stockCount !== undefined ? p.stockCount : (p.inStock ? 10 : 0);
    if (stock < minStock) return false;
    if (categoryFilter && categoryFilter !== "All") {
      return (p.category || "").toLowerCase() === categoryFilter.toLowerCase();
    }
    return true;
  });

  // Score and sort
  const scored = eligible.map((p) => {
    const volume = period === "7d" ? p.salesVolume7d : p.salesVolume30d;
    const revenue = period === "7d" ? (p.salesVolume7d * p.price) : p.revenue30d;
    const conv = p.conversionRate || 2.5;

    // Algorithmic rank score
    const score = (volume * 0.45) + ((revenue / 100) * 0.35) + (conv * 10 * 0.2);

    return { ...p, _merchandisingScore: score };
  });

  // If no category filter is set, interleave top products across categories for balanced representation
  let topList = [];
  const count = Math.max(4, Math.min(limit, 16));

  if (!categoryFilter || categoryFilter === "All") {
    const cats = ["mens", "women", "boys", "girls", "kids", "babies"];
    const byCat = {};
    cats.forEach((c) => (byCat[c] = []));
    scored.forEach((p) => {
      const c = (p.category || "").toLowerCase();
      const normCat = c === "men" ? "mens" : c;
      if (byCat[normCat]) byCat[normCat].push(p);
      else {
        if (!byCat["mens"]) byCat["mens"] = [];
        byCat["mens"].push(p);
      }
    });

    cats.forEach((c) => {
      byCat[c].sort((a, b) => {
        if (a.curationPriority && b.curationPriority) {
          return a.curationPriority - b.curationPriority;
        }
        if (a.curationPriority) return -1;
        if (b.curationPriority) return 1;
        return b._merchandisingScore - a._merchandisingScore;
      });
    });

    const perCat = Math.ceil(count / cats.length);
    for (let i = 0; i < perCat; i++) {
      for (const c of cats) {
        if (byCat[c][i] && topList.length < count) {
          topList.push(byCat[c][i]);
        }
      }
    }
  } else {
    // Sort: manual curation override first, then highest score
    scored.sort((a, b) => {
      if (a.curationPriority && b.curationPriority) {
        return a.curationPriority - b.curationPriority;
      }
      if (a.curationPriority) return -1;
      if (b.curationPriority) return 1;
      return b._merchandisingScore - a._merchandisingScore;
    });
    topList = scored.slice(0, count);
  }

  // Decorate with visual sales indicators
  return topList.map((item, index) => {
    let salesRankBadge = "Best Seller";
    let badgeTone = "hot";

    if (item.rating >= 4.9 && item.reviewCount >= 50) {
      salesRankBadge = "Top Rated ★";
      badgeTone = "top";
    } else if (item.salesVolume7d > item.salesVolume30d * 0.32) {
      salesRankBadge = "Trending 🔥";
      badgeTone = "trending";
    } else {
      salesRankBadge = "Best Seller";
      badgeTone = "hot";
    }

    return {
      ...item,
      salesRank: index + 1,
      salesRankBadge,
      badgeTone,
      sectionType: "best-seller",
    };
  });
}

/**
 * Pulls the most recent additions to the inventory, strictly excluding products
 * already selected for Best Sellers to avoid customer confusion.
 *
 * @param {Array} catalog - Array of products
 * @param {Array} excludeIds - Product IDs already featured in Best Sellers
 * @param {Object} options - Configuration options
 * @returns {Array} New Arrival products with timestamp badges
 */
export function getNewArrivals(catalog = [], excludeIds = [], options = {}) {
  const {
    limit = 8,
    minStock = 1,
    categoryFilter = null,
  } = options;

  const excludeSet = new Set(excludeIds || []);
  const enriched = catalog.map((p, i) => enrichProductMetrics(p, i));

  // Exclude Best Sellers, out-of-stock items, and match category
  const eligible = enriched.filter((p) => {
    if (excludeSet.has(p.id)) return false; // STRICT DEDUPLICATION
    const stock = p.stockCount !== undefined ? p.stockCount : (p.inStock ? 10 : 0);
    if (stock < minStock) return false;
    if (categoryFilter && categoryFilter !== "All") {
      const c = (p.category || "").toLowerCase();
      const filter = categoryFilter.toLowerCase();
      if (filter === "mens") return c === "mens" || c === "men";
      return c === filter;
    }
    return true;
  });

  const count = Math.max(4, Math.min(limit, 16));
  let finalArrivals = [];

  if (!categoryFilter || categoryFilter === "All") {
    const cats = ["mens", "women", "boys", "girls", "kids", "babies"];
    const byCat = {};
    cats.forEach((c) => (byCat[c] = []));
    eligible.forEach((p) => {
      const c = (p.category || "").toLowerCase();
      const normCat = c === "men" ? "mens" : c;
      if (byCat[normCat]) byCat[normCat].push(p);
      else {
        if (!byCat["mens"]) byCat["mens"] = [];
        byCat["mens"].push(p);
      }
    });

    cats.forEach((c) => {
      byCat[c].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    });

    const perCat = Math.ceil(count / cats.length);
    for (let i = 0; i < perCat; i++) {
      for (const c of cats) {
        if (byCat[c][i] && finalArrivals.length < count) {
          finalArrivals.push(byCat[c][i]);
        }
      }
    }
  } else {
    // Sort by release date descending (newest first)
    eligible.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
    finalArrivals = eligible.slice(0, count);
  }

  // Fallback if needed
  if (finalArrivals.length < 4) {
    const fallbackEligible = enriched.filter(
      (p) => !excludeSet.has(p.id) && !finalArrivals.some((r) => r.id === p.id)
    );
    finalArrivals = [...finalArrivals, ...fallbackEligible].slice(0, count);
  }

  return finalArrivals.map((item) => {
    const timeLabel = formatRelativeTime(item.releaseDate);
    return {
      ...item,
      timeLabel,
      newArrivalBadge: timeLabel === "Just In" ? "Just In" : timeLabel,
      badgeTone: "new",
      sectionType: "new-arrival",
    };
  });
}

/**
 * Generates Google-compliant JSON-LD structured data for the product collection
 */
export function generateCatalogJsonLd(products = [], listName = "Featured Collection") {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "image": (product.images && product.images[0]) ? product.images[0] : "",
        "description": product.description || product.name,
        "sku": product.sku || product.id,
        "category": product.category,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": product.price,
          "availability": (product.inStock !== false) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition",
          "url": `https://hoodeedaddy.com/product/${product.id}`,
        },
        ...(product.rating ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviewCount || 1,
            "bestRating": 5,
            "worstRating": 1,
          }
        } : {}),
      },
    })),
  };

  return schema;
}
