import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import { getProductPricing } from "../../utils/pricing";
import "./ProductCard.css";

function getProductBadge(product) {
  if (product.badge) {
    const typeMap = { hot: "trending", new: "newdrop", sale: "sale" };
    return { text: product.badge, type: typeMap[product.badgeType] || "trending" };
  }
  const raw = (product.badge || "").trim().toUpperCase();
  if (raw.includes("BEST")) return { text: "BEST SELLER", type: "bestseller" };
  if (raw.includes("DROP") || raw === "NEW" || raw.includes("NEW")) return { text: "NEW DROP", type: "newdrop" };
  if (raw.includes("LIMIT")) return { text: "LIMITED", type: "limited" };
  if (raw.includes("TREND")) return { text: "TRENDING", type: "trending" };
  if (raw.includes("SALE") || product.isSale) return { text: "SALE", type: "sale" };

  if (product.isBestSeller) return { text: "BEST SELLER", type: "bestseller" };
  if (product.isNewArrival) return { text: "NEW DROP", type: "newdrop" };
  return null;
}

export default function ProductCard({ product, className = "", style = {} }) {
  const navigate = useNavigate();
  const { formatPrice, addToCart, wishlist, isInWishlist, toggleWishlist, setQuickViewProduct } = useShop();

  const isSaved = isInWishlist ? isInWishlist(product.id) : wishlist.some((id) => String(id) === String(product.id));
  const hasSecondaryImg = product.images && product.images.length > 1;
  const badgeInfo = getProductBadge(product);
  const pricing = getProductPricing(product);
  const shownPrice = pricing.price;
  const displayOriginalPrice = pricing.originalPrice;
  const isOfferActive = pricing.isOffer;
  const isOutOfStock = !product.inStock || Number(product.stockCount ?? 0) <= 0 || product.stockStatus === "out_of_stock";

  const productUrl = `/products/${product.slug || product.id}`;
  const handleCardClick = () => {
    navigate(productUrl);
  };

  const primaryImg = (product.images && product.images[0]) || product.image || "/images/photo-1521572163474-6864f9cf17ab.jpg";
  const secondaryImg = (product.images && product.images[1]) || null;

  return (
    <div className={`product-card ${className}`.trim()} style={style}>
      {/* Image Box */}
      <div
        className="product-image-box"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${product.name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Tasteful Brand Badges */}
        {isOutOfStock ? (
          <span className="product-badge badge-soldout">OUT OF STOCK</span>
        ) : isOfferActive ? (
          <span className="product-badge badge-sale">{pricing.offerBadge}</span>
        ) : badgeInfo && (
          <span className={`product-badge badge-${badgeInfo.type}`}>
            {badgeInfo.text}
          </span>
        )}

        {/* Primary & Secondary Images */}
        <img
          src={imageUrl(primaryImg)}
          alt={product.name ? `${product.name} - ZMW Clothing` : "ZMW Clothing Product"}
          className="product-img-primary"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/images/photo-1521572163474-6864f9cf17ab.jpg";
          }}
        />
        {hasSecondaryImg && (
          <img
            src={imageUrl(secondaryImg)}
            alt={product.name ? `${product.name} - alternate view` : "ZMW Clothing alternate view"}
            className="product-img-secondary"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Vertical Icon-Only Action Stack (Eye, Heart, Bag) */}
        <div className="product-card-actions-stack" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          {/* 1. Eye = Quick View */}
          <button
            type="button"
            className="card-action-icon-btn"
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {/* 2. Heart = Wishlist */}
          <button
            type="button"
            className={`card-action-icon-btn card-wishlist-icon-btn ${isSaved ? "saved" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            title={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
            aria-label={isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill={isSaved ? "#DC2626" : "none"} stroke={isSaved ? "#DC2626" : "currentColor"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* 3. Bag / Cart = Add to Cart */}
          <button
            type="button"
            className={`card-action-icon-btn card-cart-icon-btn ${isOutOfStock ? "is-disabled" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isOutOfStock) addToCart(product);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            aria-label={isOutOfStock ? "Out of Stock" : `Add ${product.name} to cart`}
            disabled={isOutOfStock}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Info - Showing Product name, Rating (if reviewed), Current price & MRP */}
      <div className="product-info">
        {Number(product.reviewCount || 0) > 0 && (
          <div
            className="product-card-rating"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`${productUrl}#customer-reviews`);
            }}
            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#d97706", marginBottom: "4px" }}
            title="Click to view verified customer reviews"
          >
            <span>★</span>
            <span style={{ fontWeight: 600 }}>{Number(product.rating || 0).toFixed(1)}</span>
            <span style={{ color: "#6b7280", fontSize: "11px" }}>({product.reviewCount})</span>
          </div>
        )}
        <h3 className="product-name" onClick={handleCardClick} title={product.name}>
          <Link to={productUrl} style={{ color: "inherit", textDecoration: "none" }}>
            {product.name}
          </Link>
        </h3>

        <div className="product-pricing">
          <span className="price-current">{formatPrice(shownPrice)}</span>
          {displayOriginalPrice && (
            <span className="price-original">{formatPrice(displayOriginalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
