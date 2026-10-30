const { Op, fn, col, where: sequelizeWhere } = require("sequelize");
const { randomBytes } = require("crypto");
const { Product, Category, ProductImage, ProductColor, ProductSize, ProductVariant, sequelize } = require("../models");
const ApiError = require("../utils/ApiError");
const { getPagination, buildMeta } = require("../utils/pagination");

const PRODUCT_INCLUDES = [
  { model: Category, as: "category", attributes: ["id", "name", "slug"] },
  { model: ProductImage, as: "images", separate: true, order: [["sort_order", "ASC"], ["id", "ASC"]] },
  { model: ProductColor, as: "colors", separate: true, order: [["sort_order", "ASC"], ["id", "ASC"]] },
  { model: ProductSize, as: "sizes", separate: true, order: [["sort_order", "ASC"], ["id", "ASC"]] },
  {
    model: ProductVariant,
    as: "variants",
    separate: true,
    order: [["id", "ASC"]],
    include: [
      { model: ProductSize, as: "size", attributes: ["id", "label"] },
      { model: ProductColor, as: "color", attributes: ["id", "name", "hex_code"] }
    ]
  }
];

function assertPriceRange(price, originalPrice) {
  const selling = Number(price);
  const original = Number(originalPrice);
  if (!Number.isFinite(selling) || selling <= 0) {
    throw ApiError.badRequest("Selling price must be greater than zero");
  }
  if (!Number.isFinite(original) || original <= 0) {
    throw ApiError.badRequest("Original / MRP price must be greater than zero");
  }
  if (original <= selling) {
    throw ApiError.badRequest(
      `Original / MRP price (₹${original}) must be higher than selling price (₹${selling}). Selling price must be lower than original price.`
    );
  }
}

function assertVariantPriceOverride(priceOverride, originalPrice) {
  const selling = Number(priceOverride);
  if (!Number.isFinite(selling) || selling <= 0) {
    throw ApiError.badRequest("Variant sale price must be greater than zero");
  }
  if (originalPrice !== null && originalPrice !== undefined) {
    const original = Number(originalPrice);
    if (!Number.isFinite(original) || original <= 0) {
      throw ApiError.badRequest("Variant MRP must be greater than zero");
    }
    if (original <= selling) {
      throw ApiError.badRequest(
        `Original / MRP price (₹${original}) must be higher than variant price override (₹${selling}). Selling price must be lower than original price.`
      );
    }
  }
}

function extractSizeLabel(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v.size === "string") return v.size.trim();
  if (v.size && typeof v.size === "object") return String(v.size.label || v.size.name || "").trim();
  if (typeof v.sizeLabel === "string") return v.sizeLabel.trim();
  if (typeof v.size_label === "string") return v.size_label.trim();
  return "";
}

function extractColorName(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v.color === "string") return v.color.trim();
  if (v.color && typeof v.color === "object") return String(v.color.name || "").trim();
  if (typeof v.colorName === "string") return v.colorName.trim();
  if (typeof v.color_name === "string") return v.color_name.trim();
  return "";
}

function extractColorHex(v) {
  if (!v) return "#1E293B";
  if (v.colorHex || v.color_hex) return v.colorHex || v.color_hex;
  if (v.color && typeof v.color === "object" && (v.color.hex_code || v.color.hex)) {
    return v.color.hex_code || v.color.hex;
  }
  return "#1E293B";
}

function extractGalleryImages(v) {
  if (!v) return [];
  const raw = v.gallery_images ?? v.galleryImages;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item : item?.url || ""))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item : item?.url || ""))
          .filter(Boolean);
      }
    } catch {
      return [raw].filter(Boolean);
    }
  }
  return [];
}

async function generateUniqueSku(name, transaction) {
  const nameToken = String(name || "PRODUCT")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "PRODUCT";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sku = `HD-${nameToken}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const existing = await Product.findOne({ where: { sku }, transaction });
    if (!existing) return sku;
  }

  throw ApiError.conflict("Could not generate a unique SKU. Please try again.");
}
const SORT_MAP = {
  "price-asc": [["price", "ASC"]],
  "price-desc": [["price", "DESC"]],
  newest: [["created_at", "DESC"], ["id", "DESC"]],
  rating: [["rating", "DESC"]],
  popularity: [
    ["is_best_seller", "DESC"],
    ["review_count", "DESC"]
  ]
};

/**
 * Builds the same filters Collection.jsx already applies client-side:
 * category (department slug), type (fuzzy match against product_type or
 * subcategory name), collection (best-sellers / new-arrivals), color,
 * size, availability, min/max price.
 */
async function listProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const where = query.includeInactive === "true" ? {} : { is_active: true };
  const include = PRODUCT_INCLUDES.map((inc) => ({ ...inc }));

  const search = (query.search || query.q || "").trim();
  if (search) {
    const needle = `%${search}%`;
    where[Op.or] = [
      { name: { [Op.like]: needle } },
      { sku: { [Op.like]: needle } },
      { product_type: { [Op.like]: needle } }
    ];
  }

  if (query.category && query.category !== "all") {
    const category = await Category.findOne({ where: { slug: query.category } });
    where.category_id = category ? category.id : -1;
  }

  if (query.type && query.type !== "all") {
    const needle = `%${query.type.toLowerCase()}%`;
    where[Op.and] = [
      ...(where[Op.and] || []),
      sequelizeWhere(fn("LOWER", col("Product.product_type")), { [Op.like]: needle })
    ];
  }

  if (query.collection === "best-sellers") where.is_best_seller = true;
  if (query.collection === "new-arrivals") where.is_new_arrival = true;

  if (query.availability === "in-stock") {
    where.in_stock = true;
    where.stock_count = { [Op.gt]: 0 };
  }
  if (query.availability === "out-of-stock") {
    where[Op.or] = [{ in_stock: false }, { stock_count: 0 }];
  }
  if (query.availability === "low-stock") {
    where.in_stock = true;
    where.stock_count = { [Op.gt]: 0, [Op.lte]: 5 };
  }

  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price[Op.gte] = parseFloat(query.minPrice);
    if (query.maxPrice) where.price[Op.lte] = parseFloat(query.maxPrice);
  }

  if (query.color) {
    const colors = Array.isArray(query.color) ? query.color : [query.color];
    const colorInc = include.find((inc) => inc.as === "colors");
    if (colorInc) {
      colorInc.where = { name: { [Op.in]: colors } };
      colorInc.required = true;
      delete colorInc.separate;
    }
  }

  if (query.size) {
    const sizes = Array.isArray(query.size) ? query.size : [query.size];
    const sizeInc = include.find((inc) => inc.as === "sizes");
    if (sizeInc) {
      sizeInc.where = { label: { [Op.in]: sizes } };
      sizeInc.required = true;
      delete sizeInc.separate;
    }
  }

  const order = SORT_MAP[query.sort] || [["created_at", "DESC"], ["id", "DESC"]];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    order,
    limit,
    offset,
    distinct: true
  });

  return { rows, meta: buildMeta({ page, limit, count }) };
}

async function replaceNestedCollections(product, body, transaction, { isCreate = false } = {}) {
  let previousVariantSales = 0;
  if (Array.isArray(body.variants) && !isCreate) {
    const existingVariants = await ProductVariant.findAll({ where: { product_id: product.id }, transaction });
    previousVariantSales = existingVariants.reduce((sum, variant) => sum + (Number(variant.sales_count) || 0), 0);
  }
  if (Array.isArray(body.images)) {
    if (body.images.length < 1) {
      throw ApiError.badRequest("At least 1 product image (Front View) is required.");
    }
    if (body.images.length > 12) {
      throw ApiError.badRequest("Maximum 12 images are allowed per product.");
    }
  }
  if (Array.isArray(body.variants) && body.variants.some((variant) => {
    const mainImageCount = variant.image_url || variant.imageUrl ? 1 : 0;
    const galleryCount = extractGalleryImages(variant).length;
    return mainImageCount + galleryCount > 12;
  })) {
    throw ApiError.badRequest("Maximum 12 images are allowed per variant.");
  }
  if (Array.isArray(body.images)) {
    await ProductImage.destroy({ where: { product_id: product.id }, transaction });
    if (body.images.length > 0) {
      await ProductImage.bulkCreate(
        body.images.map((img, idx) => ({
          product_id: product.id,
          url: typeof img === "string" ? img : img.url,
          alt_text: typeof img === "object" ? img.alt_text || product.name : product.name,
          sort_order: idx
        })),
        { transaction }
      );
    }
  }

  let createdColors = [];
  if (Array.isArray(body.colors)) {
    await ProductColor.destroy({ where: { product_id: product.id }, transaction });
    if (body.colors.length > 0) {
      await ProductColor.bulkCreate(
        body.colors.map((color, idx) => ({
          product_id: product.id,
          name: color.name,
          hex_code: color.hex || color.hex_code,
          sort_order: idx
        })),
        { transaction }
      );
    }
    createdColors = await ProductColor.findAll({ where: { product_id: product.id }, transaction });
  } else {
    createdColors = await ProductColor.findAll({ where: { product_id: product.id }, transaction });
  }

  let createdSizes = [];
  if (Array.isArray(body.sizes)) {
    await ProductSize.destroy({ where: { product_id: product.id }, transaction });
    if (body.sizes.length > 0) {
      await ProductSize.bulkCreate(
        body.sizes.map((size, idx) => ({
          product_id: product.id,
          label: typeof size === "string" ? size : size?.label || String(size),
          sort_order: idx
        })),
        { transaction }
      );
    }
    createdSizes = await ProductSize.findAll({ where: { product_id: product.id }, transaction });
  } else {
    createdSizes = await ProductSize.findAll({ where: { product_id: product.id }, transaction });
  }

  if (Array.isArray(body.variants)) {
    await ProductVariant.destroy({ where: { product_id: product.id }, transaction });
    if (body.variants.length > 0) {
      const colorMap = new Map();
      createdColors.forEach((c) => {
        colorMap.set(String(c.name).toLowerCase(), c.id);
        colorMap.set(String(c.id), c.id);
      });

      const sizeMap = new Map();
      createdSizes.forEach((s) => {
        sizeMap.set(String(s.label).toLowerCase(), s.id);
        sizeMap.set(String(s.id), s.id);
      });

      // Automatically register any new sizes or colors specified in the variants
      for (const v of body.variants) {
        const sizeVal = extractSizeLabel(v);
        const explicitSizeId = v.size_id || v.sizeId || (typeof v.size === "object" ? v.size?.id : null);
        if (sizeVal && !sizeMap.has(sizeVal.toLowerCase())) {
          if (explicitSizeId && sizeMap.has(String(explicitSizeId))) {
            sizeMap.set(sizeVal.toLowerCase(), sizeMap.get(String(explicitSizeId)));
          } else {
            let matchedSize = null;
            if (explicitSizeId) {
              matchedSize = await ProductSize.findByPk(explicitSizeId, { transaction });
            }
            if (matchedSize) {
              sizeMap.set(sizeVal.toLowerCase(), matchedSize.id);
              sizeMap.set(String(matchedSize.id), matchedSize.id);
            } else {
              const newSize = await ProductSize.create(
                { product_id: product.id, label: sizeVal, sort_order: sizeMap.size },
                { transaction }
              );
              sizeMap.set(sizeVal.toLowerCase(), newSize.id);
              sizeMap.set(String(newSize.id), newSize.id);
            }
          }
        } else if (!sizeVal && explicitSizeId && !sizeMap.has(String(explicitSizeId))) {
          const matchedSize = await ProductSize.findByPk(explicitSizeId, { transaction });
          if (matchedSize) {
            sizeMap.set(String(matchedSize.id), matchedSize.id);
            if (matchedSize.label) sizeMap.set(matchedSize.label.toLowerCase(), matchedSize.id);
          }
        }

        const colorVal = extractColorName(v);
        const explicitColorId = v.color_id || v.colorId || (typeof v.color === "object" ? v.color?.id : null);
        if (colorVal && !colorMap.has(colorVal.toLowerCase())) {
          if (explicitColorId && colorMap.has(String(explicitColorId))) {
            colorMap.set(colorVal.toLowerCase(), colorMap.get(String(explicitColorId)));
          } else {
            let matchedColor = null;
            if (explicitColorId) {
              matchedColor = await ProductColor.findByPk(explicitColorId, { transaction });
            }
            if (matchedColor) {
              colorMap.set(colorVal.toLowerCase(), matchedColor.id);
              colorMap.set(String(matchedColor.id), matchedColor.id);
            } else {
              const newColor = await ProductColor.create(
                {
                  product_id: product.id,
                  name: colorVal,
                  hex_code: extractColorHex(v),
                  sort_order: colorMap.size
                },
                { transaction }
              );
              colorMap.set(colorVal.toLowerCase(), newColor.id);
              colorMap.set(String(newColor.id), newColor.id);
            }
          }
        } else if (!colorVal && explicitColorId && !colorMap.has(String(explicitColorId))) {
          const matchedColor = await ProductColor.findByPk(explicitColorId, { transaction });
          if (matchedColor) {
            colorMap.set(String(matchedColor.id), matchedColor.id);
            if (matchedColor.name) colorMap.set(matchedColor.name.toLowerCase(), matchedColor.id);
          }
        }
      }

      const variantRows = [];
      const seenCombos = new Set();
      for (const v of body.variants) {
        const sizeVal = extractSizeLabel(v);
        const colorVal = extractColorName(v);
        const explicitSizeId = v.size_id || v.sizeId || (typeof v.size === "object" ? v.size?.id : null);
        const explicitColorId = v.color_id || v.colorId || (typeof v.color === "object" ? v.color?.id : null);

        const sizeId =
          (sizeVal && sizeMap.get(sizeVal.toLowerCase())) ||
          (explicitSizeId && sizeMap.get(String(explicitSizeId))) ||
          null;

        const colorId =
          (colorVal && colorMap.get(colorVal.toLowerCase())) ||
          (explicitColorId && colorMap.get(String(explicitColorId))) ||
          null;

        const comboKey = `${sizeId ?? "null"}:${colorId ?? "null"}`;
        if (seenCombos.has(comboKey)) {
          continue;
        }
        seenCombos.add(comboKey);

        const priceOverride = v.price_override ?? v.priceOverride;
        const originalPriceOverride = v.original_price_override ?? v.originalPriceOverride;
        if (priceOverride !== null && priceOverride !== undefined) {
          assertPriceRange(priceOverride, originalPriceOverride ?? product.original_price);
        } else if (originalPriceOverride !== null && originalPriceOverride !== undefined) {
          assertPriceRange(product.price, originalPriceOverride);
        }

        variantRows.push({
          created_at: v.created_at || v.createdAt || undefined,
          product_id: product.id,
          size_id: sizeId,
          color_id: colorId,
          sku_suffix: v.sku_suffix || v.skuSuffix || null,
          stock_count: Math.max(0, Number(v.stock_count ?? v.stockCount ?? 0)),
          sales_count: Math.max(0, Number(v.sales_count ?? v.salesCount ?? 0)),
          price_override: priceOverride !== null && priceOverride !== undefined ? parseFloat(priceOverride) : null,
          original_price_override: originalPriceOverride !== null && originalPriceOverride !== undefined ? parseFloat(originalPriceOverride) : null,
          image_url: v.image_url || v.imageUrl || null,
          gallery_images: v.gallery_images || v.galleryImages || extractGalleryImages(v)
        });
      }

      if (variantRows.length > 0) {
        await ProductVariant.bulkCreate(variantRows, { transaction });
      }

      // Synchronize overall stock count and in_stock from variants
      const totalStock = variantRows.reduce((sum, v) => sum + (Number(v.stock_count) || 0), 0);
      product.stock_count = totalStock;
      product.in_stock = totalStock > 0;
      const nextVariantSales = variantRows.reduce((sum, variant) => sum + (Number(variant.sales_count) || 0), 0);
      product.sales_count = Math.max(0, Number(product.sales_count || 0) + nextVariantSales - previousVariantSales);
      const defaultVariant = variantRows[0];
      if (defaultVariant && defaultVariant.price_override !== null && defaultVariant.price_override !== undefined) {
        product.price = defaultVariant.price_override;
      }
      if (defaultVariant && defaultVariant.original_price_override !== null && defaultVariant.original_price_override !== undefined) {
        product.original_price = defaultVariant.original_price_override;
      }
      await product.save({ transaction });
    } else {
      product.in_stock = Number(product.stock_count || 0) > 0;
      await product.save({ transaction });
    }
  }
}

async function createProduct(body) {
  assertPriceRange(body.price, body.original_price);
  if (!Array.isArray(body.images) || body.images.length < 1) {
    throw ApiError.badRequest("At least 1 product image (Front View) is required.");
  }
  if (body.images.length > 12) {
    throw ApiError.badRequest("Maximum 12 images are allowed per product.");
  }
  return sequelize.transaction(async (transaction) => {
    const sku = await generateUniqueSku(body.name, transaction);
    const existingSlug = await Product.findOne({ where: { slug: body.slug }, transaction });
    if (existingSlug) throw ApiError.conflict("A product with this slug already exists");

    const product = await Product.create(
      {
        name: body.name,
        slug: body.slug,
        sku,
        category_id: body.category_id,
        subcategory_id: null,
        product_type: body.product_type || null,
        description: body.description || null,
        price: body.price,
        original_price: body.original_price || null,
        stock_count: body.stock_count ?? 0,
        in_stock: body.in_stock ?? (body.stock_count ? body.stock_count > 0 : true),
        is_best_seller: body.is_best_seller ?? false,
        is_new_arrival: body.is_new_arrival ?? false,
        is_sale: body.is_sale ?? false,
        show_on_homepage: body.show_on_homepage ?? false,
        badge_label: body.badge_label || null,
        badge_type: body.badge_type || null,
        is_active: body.is_active ?? true,
        specifications: body.specifications || null,
        meta_title: body.meta_title || body.metaTitle || null,
        meta_description: body.meta_description || body.metaDescription || null,
        meta_keywords: body.meta_keywords || body.metaKeywords || null,
        canonical_url: body.canonical_url || body.canonicalUrl || null
      },
      { transaction }
    );

    await replaceNestedCollections(product, body, transaction, { isCreate: true });
    return product;
  });
}

async function updateProduct(productOrId, body) {
  const product =
    typeof productOrId === "object" && productOrId?.save
      ? productOrId
      : await Product.findByPk(productOrId);
  if (!product) throw ApiError.notFound("Product not found");
  const nextOriginalPrice = Object.prototype.hasOwnProperty.call(body, "original_price")
    ? body.original_price
    : product.original_price;
  assertPriceRange(body.price ?? product.price, nextOriginalPrice);

  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.length < 1) {
      throw ApiError.badRequest("At least 1 product image (Front View) is required.");
    }
    if (body.images.length > 12) {
      throw ApiError.badRequest("Maximum 12 images are allowed per product.");
    }
  }

  return sequelize.transaction(async (transaction) => {
    const nextSku = product.sku;
    if (body.slug && body.slug !== product.slug) {
      const clash = await Product.findOne({ where: { slug: body.slug }, transaction });
      if (clash) throw ApiError.conflict("A product with this slug already exists");
    }

    const fields = [
      "name",
      "slug",
      "category_id",
      "product_type",
      "description",
      "price",
      "original_price",
      "stock_count",
      "sales_count",
      "in_stock",
      "is_best_seller",
      "is_new_arrival",
      "is_sale",
      "show_on_homepage",
      "badge_label",
      "badge_type",
      "is_active",
      "specifications",
      "meta_title",
      "meta_description",
      "meta_keywords",
      "canonical_url"
    ];
    product.sku = nextSku;
    fields.forEach((f) => {
      if (body[f] !== undefined) {
        product[f] = body[f];
      }
    });
    if (body.metaTitle !== undefined) product.meta_title = body.metaTitle;
    if (body.metaDescription !== undefined) product.meta_description = body.metaDescription;
    if (body.metaKeywords !== undefined) product.meta_keywords = body.metaKeywords;
    if (body.canonicalUrl !== undefined) product.canonical_url = body.canonicalUrl;
    await product.save({ transaction });

    await replaceNestedCollections(product, body, transaction);
    return product;
  });
}

module.exports = { listProducts, createProduct, updateProduct, PRODUCT_INCLUDES, assertPriceRange, assertVariantPriceOverride };
