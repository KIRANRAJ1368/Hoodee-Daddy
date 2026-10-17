import React from "react";
import { useShop } from "../../context/ShopContext";
import { INSTAGRAM_SHOWCASE } from "../../data/products";
import "./ImageShowcase.css";

export default function ImageShowcase() {
  const { openLightbox } = useShop();

  return (
    <section id="instagram" className="section-padding instagram-section">
      <div className="container">
        {/* Left-Aligned Section Header */}
        <div className="section-header-left">
          <div className="section-eyebrow-badge">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">COMMUNITY LOOKBOOK</span>
          </div>
          <h2 className="section-heading-title">ZMW on Instagram</h2>
          <p className="section-heading-subtitle">
            Tag ZMWStyle and ZMWSummer on Instagram for a chance to be featured in our seasonal editorial gallery.
          </p>
        </div>

        {/* 5-Column Instagram Grid */}
        <div className="instagram-grid">
          {INSTAGRAM_SHOWCASE.map((item, index) => (
            <div
              key={item.id}
              className="instagram-card"
              onClick={() => openLightbox(index)}
              title="Click to expand photo"
            >
              <img
                src={item.image}
                alt={`Instagram post by ${item.handle}`}
                className="instagram-img"
                loading="lazy"
              />

              {/* Glass Overlay on Hover */}
              <div className="instagram-card-overlay">
                <div className="insta-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <span className="insta-handle">{item.handle}</span>
                <span className="insta-likes">❤️ {item.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
