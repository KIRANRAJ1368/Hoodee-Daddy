import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import SizeGuideModal from "./SizeGuideModal";
import { imageUrl } from "../../utils/imageUrl";
import { getProductPricing } from "../../utils/pricing";
import "./QuickViewModal.css";

function availableColors(product) {
  if (product?.variants?.length) {
    const colors = new Map();
    product.variants.forEach((variant) => {
      if (variant.color) {
        const key = variant.color.toLowerCase();
        if (!colors.has(key)) colors.set(key, { name: variant.color, hex: variant.colorHex || "#181715" });
      }
    });
    if (colors.size > 0) return [...colors.values()];
  }
  if (Array.isArray(product?.colors)) {
    return product.colors.map((c) => {
      if (typeof c === "string") return { name: c, hex: "#181715" };
      return { name: c.name || "Default", hex: c.hex || c.hexCode || c.hex_code || "#181715" };
    });
  }
  return [];
}

function availableSizes(product) {
  if (product?.variants?.length) {
    const sizes = [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))];
    if (sizes.length > 0) return sizes;
  }
  if (Array.isArray(product?.sizes)) {
    return product.sizes.map((s) => (typeof s === "object" && s !== null ? (s.label || s.size || s.name) : s)).filter(Boolean);
  }
  return [];
}

export default function QuickViewModal() {
  const {
    quickViewProduct,
    setQuickViewProduct,
    formatPrice,
    addToCart,
    wishlist,
    isInWishlist,
    toggleWishlist
  } = useShop();

  const navigate = useNavigate();
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const images = useMemo(() => {
    if (!quickViewProduct) return [];
    if (Array.isArray(quickViewProduct.images) && quickViewProduct.images.length > 0) {
      return quickViewProduct.images.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean);
    }
    if (quickViewProduct.image) return [quickViewProduct.image];
    return ["/images/photo-1521572163474-6864f9cf17ab.jpg"];
  }, [quickViewProduct]);

  const productColors = useMemo(() => availableColors(quickViewProduct), [quickViewProduct]);

  // Color-specific sizes
  const colorSizes = useMemo(() => {
    if (!quickViewProduct) return [];
    if (Array.isArray(quickViewProduct.variants) && quickViewProduct.variants.length > 0 && selectedColor) {
      const sizes = [...new Set(quickViewProduct.variants
        .filter((variant) => variant.color?.toLowerCase() === selectedColor.toLowerCase())
        .map((variant) => variant.size)
        .filter(Boolean))];
      if (sizes.length) return sizes;
    }
    return availableSizes(quickViewProduct);
  }, [quickViewProduct, selectedColor]);

  // Unavailable sizes for the selected color
  const unavailableSizes = useMemo(() => {
    if (!quickViewProduct?.variants || quickViewProduct.variants.length === 0 || !selectedColor) return new Set();
    const set = new Set();
    colorSizes.forEach((s) => {
      const v = quickViewProduct.variants.find(
        (item) =>
          item.size?.toLowerCase() === s.toLowerCase() &&
          item.color?.toLowerCase() === selectedColor.toLowerCase()
      );
      if (!v || Number(v.stockCount ?? 0) <= 0) {
        set.add(s);
      }
    });
    return set;
  }, [quickViewProduct, selectedColor, colorSizes]);

  const hasAgeSizes = useMemo(() => {
    return colorSizes.some((s) => /month|year/i.test(s));
  }, [colorSizes]);

  const currentVariant = useMemo(() => {
    if (!quickViewProduct?.variants || quickViewProduct.variants.length === 0) return null;
    const exact = quickViewProduct.variants.find((v) => {
      const matchColor = !v.color || !selectedColor || v.color.toLowerCase() === selectedColor.toLowerCase();
      const matchSize = !v.size || !selectedSize || v.size.toLowerCase() === selectedSize.toLowerCase();
      return matchColor && matchSize;
    });
    if (exact) return exact;
    const colorMatch = quickViewProduct.variants.find((v) => {
      return !v.color || !selectedColor || v.color.toLowerCase() === selectedColor.toLowerCase();
    });
    if (colorMatch) return colorMatch;
    return quickViewProduct.variants[0];
  }, [quickViewProduct, selectedColor, selectedSize]);

  const variantImages = useMemo(() => {
    if (!currentVariant) return images;
    const gallery = Array.isArray(currentVariant.galleryImages) ? currentVariant.galleryImages : [];
    const ownImages = [currentVariant.imageUrl || currentVariant.image_url, ...gallery].filter(Boolean);
    return ownImages.length ? ownImages : images;
  }, [currentVariant, images]);

  useEffect(() => setActiveImgIndex(0), [currentVariant?.id]);

  // Initialize defaults when product changes
  useEffect(() => {
    if (quickViewProduct) {
      setActiveImgIndex(0);
      const colors = availableColors(quickViewProduct);
      const sizes = availableSizes(quickViewProduct);
      const defaultVariant = quickViewProduct.variants?.find((variant) => Number(variant.stockCount ?? 0) > 0) || quickViewProduct.variants?.[0];
      setSelectedColor(defaultVariant?.color || colors[0]?.name || null);
      setSelectedSize(defaultVariant?.size || sizes[0] || null);
      setQuantity(1);
    }
  }, [quickViewProduct]);

  // Intelligent color select
  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    setQuantity(1);
    if (quickViewProduct?.variants?.length) {
      const variantsForColor = quickViewProduct.variants.filter(
        (v) => v.color && v.color.toLowerCase() === colorName.toLowerCase()
      );
      if (variantsForColor.length > 0) {
        const currentSizeHasStock = variantsForColor.some(
          (v) => v.size && v.size.toLowerCase() === selectedSize?.toLowerCase() && Number(v.stockCount ?? 0) > 0
        );
        if (!currentSizeHasStock) {
          const firstInStock = variantsForColor.find((v) => Number(v.stockCount ?? 0) > 0);
          if (firstInStock?.size) {
            setSelectedSize(firstInStock.size);
          } else if (variantsForColor[0]?.size) {
            setSelectedSize(variantsForColor[0].size);
          }
        }
      }
    }
  };

  const hasVariants = Array.isArray(quickViewProduct?.variants) && quickViewProduct.variants.length > 0;
  const activeStockCount = hasVariants
    ? Number(currentVariant?.stockCount ?? 0)
    : Number(quickViewProduct?.stockCount ?? 0);
  const isOutOfStock = hasVariants
    ? !currentVariant || Number(currentVariant.stockCount ?? 0) <= 0
    : !quickViewProduct?.inStock || Number(quickViewProduct?.stockCount ?? 0) <= 0;
  const isLowStock = !isOutOfStock && activeStockCount > 0 && activeStockCount <= 5;

  const pricing = useMemo(
    () => getProductPricing(quickViewProduct, currentVariant),
    [quickViewProduct, currentVariant]
  );
  const activePrice = pricing.price;
  const displayOriginalPrice = pricing.originalPrice;
  const isOffer = pricing.isOffer;

  // Clamp quantity
  useEffect(() => {
    if (activeStockCount <= 0 && quantity !== 1) {
      setQuantity(1);
    } else if (activeStockCount > 0 && quantity > activeStockCount) {
      setQuantity(activeStockCount);
    }
  }, [activeStockCount, quantity]);

  if (!quickViewProduct) return null;

  const isSaved = isInWishlist
    ? isInWishlist(quickViewProduct.id)
    : wishlist.some((id) => String(id) === String(quickViewProduct.id));

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(quickViewProduct, selectedColor, selectedSize, quantity);
    setQuickViewProduct(null);
  };

  const currentImg = variantImages[activeImgIndex] || variantImages[0];

  return (
    <div className="modal-overlay active" onClick={() => setQuickViewProduct(null)}>
      <div className="quickview-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          className="quickview-close-btn"
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close Quick View"
        >
          ✕
        </button>

        <div className="quickview-grid">
          {/* Image Gallery Column */}
          <div className="quickview-gallery">
            <div className="quickview-main-image">
              {quickViewProduct.badge && (
                <span className={`product-badge badge-${quickViewProduct.badgeType || "new"}`}>
                  {quickViewProduct.badge}
                </span>
              )}
              <img
                src={imageUrl(currentImg)}
                alt={quickViewProduct.name}
                className="main-view-img"
              />
            </div>

            {/* Thumbnail Row */}
            {variantImages.length > 1 && (
              <div className="quickview-thumbnails">
                {variantImages.map((img, i) => (
                  <button
                    key={i}
                    className={`thumb-btn ${i === activeImgIndex ? "active" : ""}`}
                    onClick={() => setActiveImgIndex(i)}
                  >
                    <img src={imageUrl(img)} alt={`Angle ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Variant Selectors */}
          <div className="quickview-details">
            <span className="quickview-category">{quickViewProduct.category}</span>
            <h2 className="quickview-title">{quickViewProduct.name}</h2>

            {/* Rating & SKU */}
            <div className="quickview-meta-row">
              {Number(quickViewProduct.reviewCount || 0) > 0 && (
                <div
                  className="star-rating"
                  onClick={() => {
                    const targetUrl = `/products/${quickViewProduct.slug || quickViewProduct.id}#customer-reviews`;
                    setQuickViewProduct(null);
                    navigate(targetUrl);
                  }}
                  style={{ cursor: "pointer" }}
                  title="Click to view verified customer reviews"
                >
                  <span>★</span>
                  <span>{Number(quickViewProduct.rating || 0).toFixed(1)}</span>
                  <span className="review-count">
                    ({quickViewProduct.reviewCount} {quickViewProduct.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}
              <span className="sku-tag">
                SKU: {currentVariant?.skuSuffix ? `${quickViewProduct.sku}-${currentVariant.skuSuffix}` : quickViewProduct.sku}
              </span>
            </div>

            {/* Pricing */}
            <div className="quickview-price-row">
              <span className="price-current">{formatPrice(activePrice)}</span>
              {displayOriginalPrice && (
                <span className="price-original">
                  {formatPrice(displayOriginalPrice)}
                </span>
              )}
              {isOffer && (
                <span className="quickview-offer-chip">{pricing.offerBadge}</span>
              )}
            </div>

            <p className="quickview-description">{quickViewProduct.description}</p>

            {/* Color Selector */}
            {productColors.length > 0 && (
              <div className="variant-block">
                <span className="variant-label">
                  Color: <strong>{selectedColor}</strong>
                </span>
                <div className="color-swatch-list">
                  {productColors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      className={`color-swatch-btn ${selectedColor === c.name ? "active" : ""}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => handleColorSelect(c.name)}
                      title={c.name}
                      aria-pressed={selectedColor === c.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {colorSizes.length > 0 && (
              <div className="variant-block">
                <div className="size-header">
                  <span className="variant-label">
                    {hasAgeSizes ? "Select Age:" : "Size:"} <strong>{selectedSize}</strong>
                  </span>
                  <button
                    className="size-guide-btn"
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                  >
                    {hasAgeSizes ? "Age & Size Guide" : "Size Guide"}
                  </button>
                </div>
                <div className="size-pill-list">
                  {colorSizes.map((s) => {
                    const isSoldOut = unavailableSizes.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`size-pill ${selectedSize === s ? "active" : ""} ${isSoldOut ? "sold-out" : ""}`}
                        onClick={() => setSelectedSize(s)}
                        title={isSoldOut ? `${s} (Out of stock in ${selectedColor || "this color"})` : s}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & CTA */}
            <div className="quickview-actions">
              <div className="qty-control">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="qty-value">{isOutOfStock ? 0 : quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(activeStockCount || 99, q + 1))}
                  disabled={isOutOfStock || (activeStockCount > 0 && quantity >= activeStockCount)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-add-bag"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  "Out of Stock"
                ) : (
                  `Add To Bag • ${formatPrice(activePrice * quantity)}`
                )}
              </button>

              <button
                type="button"
                className={`btn-wishlist-round ${isSaved ? "saved" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist(quickViewProduct.id);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                title={isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            {/* Stock indicator */}
            <div className={`stock-indicator ${isOutOfStock ? "out-of-stock" : isLowStock ? "low-stock" : "in-stock"}`}>
              <span className="stock-dot"></span>
              <span>
                {isOutOfStock
                  ? "Currently Out of Stock — Restock in progress"
                  : isLowStock
                  ? `Low Stock — Only ${activeStockCount} units remaining. Order soon!`
                  : `In stock ready to ship (${activeStockCount} units remaining)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        selectedSize={selectedSize}
      />
    </div>
  );
}
