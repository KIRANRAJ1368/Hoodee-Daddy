import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../../utils/imageUrl";
import "./OfferBannerModal.css";

export default function OfferBannerModal({ banner, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !banner) return null;

  const targetLink = banner.primary_cta_link || "/collection";
  const ctaText = banner.primary_cta_text || "Claim Offer & Shop Now";

  return (
    <div
      className="offer-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
    >
      <div className="offer-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="offer-modal-close-btn"
          onClick={onClose}
          aria-label="Close offer popup"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Hero Visual Area */}
        <div className="offer-modal-hero">
          {banner.image_url ? (
            <img
              src={imageUrl(banner.image_url)}
              alt={banner.title}
              className="offer-modal-img"
              style={banner.image_position ? { objectPosition: banner.image_position } : undefined}
            />
          ) : (
            <div className="offer-modal-img-fallback" />
          )}
          <div className="offer-modal-hero-gradient" />

          {/* Floating Promo Tag */}
          <div className="offer-modal-floating-tags">
            {banner.badge_promo && (
              <span className="offer-modal-promo-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/>
                </svg>
                <span>{banner.badge_promo}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="offer-modal-body">
          {banner.tag && (
            <div className="offer-modal-eyebrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>{banner.tag}</span>
            </div>
          )}

          <h2 id="offer-modal-title" className="offer-modal-title">
            {banner.title}
          </h2>

          {banner.subtitle && (
            <p className="offer-modal-subtitle">{banner.subtitle}</p>
          )}

          {/* Action Row */}
          <div className="offer-modal-actions">
            <Link
              to={targetLink}
              className="offer-modal-cta-btn"
              onClick={onClose}
            >
              <span>{ctaText}</span>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>

            {banner.secondary_cta_link && (
              <Link
                to={banner.secondary_cta_link}
                className="offer-modal-secondary-link"
                onClick={onClose}
              >
                <span>{banner.secondary_cta_text || "Explore Category"}</span>
              </Link>
            )}
          </div>

          <p className="offer-modal-disclaimer">
            * Limited period offer. Auto-applied discount valid on eligible catalog items while supplies last.
          </p>
        </div>
      </div>
    </div>
  );
}
