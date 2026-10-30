/**
 * Shapes a Product (with its category/subcategory/images/colors/sizes
 * eager-loaded) into the same camelCase JSON shape the existing frontend's
 * UNIFIED_PRODUCTS already uses, so swapping the static import for a
 * fetch() call later is a drop-in change.
 */
function serializeProduct(product) {
  const p = product.toJSON ? product.toJSON() : product;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    category: p.category ? p.category.slug : null,
    categoryId: p.category_id,
    subCategory: null,
    subcategoryId: null,
    productType: p.product_type,
    price: Number(p.price),
    originalPrice: p.original_price !== null && p.original_price !== undefined ? Number(p.original_price) : null,
    rating: Number(p.rating),
    reviewCount: p.review_count,
    inStock: Boolean(p.in_stock && Number(p.stock_count ?? 0) > 0),
    stockCount: Number(p.stock_count ?? 0),
    salesCount: Number(p.sales_count ?? 0),
    stockStatus:
      !p.in_stock || Number(p.stock_count ?? 0) === 0
        ? "out_of_stock"
        : Number(p.stock_count ?? 0) <= 5
        ? "low_stock"
        : "in_stock",
    isBestSeller: p.is_best_seller,
    isNewArrival: p.is_new_arrival,
    isSale: p.is_sale,
    isNew: p.badge_type === "new",
    badge: p.badge_label,
    badgeType: p.badge_type,
    isActive: p.is_active,
    showOnHomepage: Boolean(p.show_on_homepage),
    description: p.description,
    metaTitle: p.meta_title || null,
    metaDescription: p.meta_description || null,
    metaKeywords: p.meta_keywords || null,
    canonicalUrl: p.canonical_url || null,
    specifications: p.specifications
      ? Array.isArray(p.specifications)
        ? p.specifications
        : typeof p.specifications === "string"
        ? (() => { try { return JSON.parse(p.specifications); } catch { return []; } })()
        : []
      : [],
    images: (p.images || []).sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url),
    colors: (p.colors || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ id: c.id, name: c.name, hex: c.hex_code })),
    sizes: (p.sizes || []).sort((a, b) => a.sort_order - b.sort_order).map((s) => s.label),
    variants: (p.variants || []).map((v) => {
      const vStock = Number(v.stock_count ?? 0);
      return {
        id: v.id,
        sizeId: v.size_id,
        size: v.size ? v.size.label : null,
        colorId: v.color_id,
        color: v.color ? v.color.name : null,
        colorHex: v.color ? v.color.hex_code : null,
        skuSuffix: v.sku_suffix,
        stockCount: vStock,
        salesCount: Number(v.sales_count ?? 0),
        priceOverride: v.price_override !== null && v.price_override !== undefined ? Number(v.price_override) : null,
        originalPriceOverride: v.original_price_override !== null && v.original_price_override !== undefined ? Number(v.original_price_override) : null,
        createdAt: v.created_at || v.createdAt || null,
        imageUrl: v.image_url || null,
        galleryImages: (() => {
          if (Array.isArray(v.gallery_images)) return v.gallery_images;
          if (typeof v.gallery_images === "string") {
            try {
              const parsed = JSON.parse(v.gallery_images);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        })(),
        inStock: vStock > 0,
        stockStatus: vStock === 0 ? "out_of_stock" : vStock <= 5 ? "low_stock" : "in_stock"
      };
    }),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

module.exports = { serializeProduct };
