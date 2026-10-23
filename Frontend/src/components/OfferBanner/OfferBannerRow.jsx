import React from "react";
import { imageUrl } from "../../utils/imageUrl";
import "./OfferBanner.css";

/**
 * Extracts discount percentage & promo scope dynamically from banner fields.
 * Handles formats like:
 * - "FLAT 20% OFF · STOREWIDE" -> discount: "FLAT 20% OFF", scope: "STOREWIDE"
 * - "25% OFF · MEN'S WEAR" -> discount: "25% OFF", scope: "MEN'S WEAR"
 * - "UP TO 50% OFF" -> discount: "UP TO 50% OFF", scope: ""
 * - Or finds percentages in subtitle/title if badge_promo isn't set.
 */
function parseOfferHighlights(banner) {
  const promo = (banner.badge_promo || "").trim();
  const tag = (banner.tag || "").trim();
  const sub = (banner.subtitle || "").trim();
  const title = (banner.title || "").trim();

  const discountPattern = /(?:(FLAT|UP TO|EXTRA|SAVE)\s+)?(?:₹\s*\d+(?:\s*OFF)?|\d+%\s*(?:OFF)?)/i;

  let discountBadge = "";
  let discountScope = "";

  if (promo) {
    const parts = promo.split(/[·•|–-]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      discountBadge = parts[0];
      discountScope = parts.slice(1).join(" · ");
    } else {
      discountBadge = promo;
    }
  } else {
    const match = title.match(discountPattern) || sub.match(discountPattern) || tag.match(discountPattern);
    if (match) {
      discountBadge = match[0].toUpperCase();
    }
  }

  const displayTag = tag || (discountBadge ? "EXCLUSIVE OFFER" : "LIMITED TIME OFFER");

  return { discountBadge, discountScope, displayTag };
}

export default function OfferBannerRow({ banners = [], onOpenBanner }) {
  if (!Array.isArray(banners) || banners.length === 0) {
    return null;
  }
  const displayBanners = banners.slice(0, 10);
  const isSingle = displayBanners.length === 1;

  return (
    <section
      className={`offer-banner-row offer-banner-row-container ${isSingle ? "offer-banner-row-container--single" : ""}`}
      aria-label="Promotional Offers and Seasonal Drops"
    >
      <div className={`offer-banner-grid ${isSingle ? "offer-banner-grid--single" : ""}`}>
        {displayBanners.map((banner, index) => {
          const { discountBadge, discountScope, displayTag } = parseOfferHighlights(banner);

          const defaultObjPosition = index === 0 ? "center center" : "center top";
          const imagePosition =
            banner.image_position && banner.image_position !== "center center"
              ? banner.image_position
              : defaultObjPosition;

          return (
            <article
              key={banner.id || index}
              className={`offer-banner-card ${isSingle ? "offer-banner-card--single" : ""}`}
              onClick={() => onOpenBanner && onOpenBanner(banner)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenBanner && onOpenBanner(banner);
                }
              }}
              title="Click to view offer details and shop"
              aria-label={`${banner.title} - ${discountBadge || displayTag}`}
            >
              {/* Subtle ambient luxury glow accent */}
              <div className="offer-banner-ambient-glow" aria-hidden="true" />
              <div className="offer-banner-shimmer" aria-hidden="true" />

              {/* Left Content Column */}
              <div className="offer-banner-content">
                {/* Top Badges Bar: Highlighted Discount Badge & Tag */}
                <div className="offer-banner-top-bar">
                  {discountBadge && (
                    <span className="offer-banner-discount-badge" title={`Discount: ${discountBadge}`}>
                      <svg
                        className="offer-banner-lightning-icon"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span className="offer-banner-discount-value">{discountBadge}</span>
                      {discountScope && (
                        <span className="offer-banner-discount-scope">{discountScope}</span>
                      )}
                    </span>
                  )}

                  {displayTag && (
                    <span className="offer-banner-tag">
                      <span className="offer-banner-pulse-dot" aria-hidden="true" />
                      <span>{displayTag}</span>
                    </span>
                  )}
                </div>

                {/* Offer Title */}
                <h3 className="offer-banner-title">{banner.title}</h3>

                {/* Subtitle / Short Catchy Offer Details */}
                {banner.subtitle && (
                  <p className="offer-banner-subtitle">{banner.subtitle}</p>
                )}

                {/* Compact Primary CTA Button */}
                <div className="offer-banner-card-actions">
                  <span className="offer-banner-open-btn">
                    <span className="offer-banner-btn-text">
                      {banner.primary_cta_text || "Claim Offer"}
                    </span>
                    <svg
                      className="offer-banner-arrow"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Right Framed Product Visual Thumbnail Window */}
              <div className="offer-banner-visual-frame">
                <img
                  src={imageUrl(banner.image_url)}
                  alt={banner.title}
                  className="offer-banner-thumb-img"
                  style={{ objectPosition: imagePosition }}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/banner-streetwear-tee.jpg";
                  }}
                />
                <div className="offer-banner-visual-overlay" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
