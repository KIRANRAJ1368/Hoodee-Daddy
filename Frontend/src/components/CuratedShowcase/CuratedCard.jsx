import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import { getProductPricing } from "../../utils/pricing";

export default function CuratedCard({ product, badgeLabel, badgeTone = "hot", className = "", style = {} }) {
  const navigate = useNavigate();
  const {
    formatPrice,
    addToCart,
    wishlist,
    isInWishlist,
    toggleWishlist,
    setQuickViewProduct
  } = useShop();

  const isSaved = isInWishlist ? isInWishlist(product.id) : wishlist.some((id) => String(id) === String(product.id));
  const [addedAnimation, setAddedAnimation] = useState(false);
  const isOutOfStock = !product.inStock || Number(product.stockCount ?? 0) <= 0 || product.stockStatus === "out_of_stock";

  const primaryImg =
    (product.images && product.images[0]) ||
    product.image ||
    "/images/photo-1521572163474-6864f9cf17ab.jpg";
  const secondaryImg =
    (product.images && product.images[1]) || null;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1400);
  };

  // Map badgeTone to high-converting badges
  const getBadgeClass = () => {
    if (badgeTone === "new" || (badgeLabel && badgeLabel.toLowerCase().includes("new"))) return "badge-new";
    if (badgeTone === "sale" || (badgeLabel && badgeLabel.toLowerCase().includes("sale"))) return "badge-sale";
    if (badgeTone === "gold" || (badgeLabel && badgeLabel.toLowerCase().includes("best"))) return "badge-gold";
    return "badge-hot";
  };

  const pricing = getProductPricing(product);
  const shownPrice = pricing.price;
  const displayOriginalPrice = pricing.originalPrice;
  const isOfferActive = pricing.isOffer;
  const saveBadge = isOfferActive ? pricing.offerBadge : (displayOriginalPrice ? `${pricing.savingsPercent}% OFF` : null);

  return (
    <div className={`curated-card ${className}`.trim()} style={style}>
      {/* Media Box */}
      <div
        className="curated-media-box"
        onClick={() => navigate(`/product/${product.id}`)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/product/${product.id}`);
          }
        }}
      >
        {/* Dynamic Badge */}
        {isOutOfStock ? (
          <span className="curated-badge badge-soldout">OUT OF STOCK</span>
        ) : badgeLabel ? (
          <span className={`curated-badge ${getBadgeClass()}`}>
            {typeof badgeLabel === "string"
              ? badgeLabel.replace(/^#\d+\s*[-–—:]?\s*/i, "").trim()
              : badgeLabel}
          </span>
        ) : null}

        {/* Primary & Secondary Hover Images */}
        <img
          src={imageUrl(primaryImg)}
          alt={product.name}
          className="curated-img primary"
          loading="eager"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/photo-1521572163474-6864f9cf17ab.jpg";
          }}
        />
        {secondaryImg && (
          <img
            src={imageUrl(secondaryImg)}
            alt={`${product.name} alternate view`}
            className="curated-img secondary"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Quick Action Floating Bar */}
        <div className="curated-action-bar" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <button
            type="button"
            className="curated-action-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            title="Quick View"
            aria-label={`Quick view ${product.name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>

          <button
            type="button"
            className={`curated-action-btn ${isSaved ? "saved" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            aria-label="Wishlist toggle"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <button
            type="button"
            className={`curated-action-btn quick-buy-btn ${addedAnimation ? "added" : ""} ${isOutOfStock ? "is-disabled" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleQuickAdd(e);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            title={isOutOfStock ? "Out of Stock" : "Quick Add to Bag"}
            aria-label={isOutOfStock ? "Out of Stock" : `Add ${product.name} to bag`}
            disabled={isOutOfStock}
          >
            {addedAnimation ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="curated-info">
        {/* Rating & Reviews */}
        <div className="curated-rating-row">
          {Number(product.reviewCount || 0) > 0 && (
            <div
              className="curated-star-box"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/products/${product.slug || product.id}#customer-reviews`);
              }}
              style={{ cursor: "pointer" }}
              title="Click to view verified customer reviews"
            >
              <span className="curated-star">★</span>
              <span className="curated-rating-num">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="curated-review-count">({product.reviewCount})</span>
            </div>
          )}
          {saveBadge && (
            <span className="curated-save-tag">{saveBadge}</span>
          )}
        </div>

        {/* Title */}
        <h3
          className="curated-title"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.name}
        </h3>

        {/* Pricing Row */}
        <div className="curated-pricing-row">
          <div className="curated-price-box">
            <span className="curated-price-current">{formatPrice(shownPrice)}</span>
            {displayOriginalPrice && (
              <span className="curated-price-original">{formatPrice(displayOriginalPrice)}</span>
            )}
            {pricing.savingsPercent > 0 && (
              <span className="curated-price-discount">({pricing.savingsPercent}% OFF)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
