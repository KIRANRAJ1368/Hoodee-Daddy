import React from "react";
import { Link } from "react-router-dom";
import "./CTABanner.css";

export default function CTABanner({
  ctaTo,
  ctaLabel,
  image,
  imageAlt = "HooDee Daddy",
}) {
  const hasImage = Boolean(image);
  return (
    <div className={`cta-banner${hasImage ? "" : " cta-banner--no-image"}`}>
      <div className="cta-banner-btn">
        <Link to={ctaTo} className="hd-primary-cta">
          <span>{ctaLabel}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Link>
      </div>
      {hasImage && (
        <div className="cta-banner-media">
          <img
            src={image}
            alt={imageAlt}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}