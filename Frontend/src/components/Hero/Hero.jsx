import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import { formatPrice } from "../../utils/formatPrice";
import "./Hero.css";

const SHIPPING_LABEL = "Pan-India Express Shipping";

function renderHeroIcon(name) {
  switch (name) {
    case "bolt":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
        </svg>
      );
    case "flame":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.5 2-6.5 4.5-8.5.5-.4 1.2-.1 1.3.5.3 1.8 1.4 3.3 3 4 0-2.5 1.5-5.5 4-7.5.5-.4 1.2-.1 1.3.5.4 3 2.5 5.5 3.9 8.5 1.2 2.5 1 5.5-1 7.5-2 2-4.5 4-8 4z" />
        </svg>
      );
    case "truck":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "refresh":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      );
    case "shield":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "tag":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "star":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FAA703" stroke="#FAA703" strokeWidth="1" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    default:
      return null;
  }
}

const HERO_BANNERS = [
  {
    id: 8,
    badge: "Limited Time",
    badgeIcon: "bolt",
    subBadge: "",
    offer: "UP TO 50% OFF",
    offerTag: "Selling Out Fast",
    headline: "Mega Fashion Sale",
    support: "Premium streetwear drops and oversized graphic tees marked down. Pure cotton essentials with zero compromise.",
    cta: "Shop Now",
    link: "/collection?category=mens",
    urgencyTag: "⚡ Selling Out Fast",
    perks: [
      { icon: "truck", label: SHIPPING_LABEL },
      { icon: "refresh", label: "7-Day Easy Returns" },
      { icon: "shield", label: "100% Quality Checked" }
    ],
    image: "/images/hero-mens-oversized-tee.jpg",
    imagePosition: "72% 10%",
    alt: "Mega Fashion Sale",
    slideLabel: "Mega Fashion Sale",
    themeClass: "hero-theme-1"
  },
  {
    id: 9,
    badge: "New Arrivals",
    badgeIcon: "sparkle",
    subBadge: "",
    offer: "FLAT 25% OFF",
    offerTag: "Fresh Drop",
    headline: "New Season Styles",
    support: "Heavyweight 240 GSM drops with relaxed silhouettes, modern street aesthetics, and all-day comfort.",
    cta: "Explore Now",
    link: "/collection?category=mens",
    urgencyTag: "✨ Fresh Drop",
    perks: [
      { icon: "shield", label: "240 GSM Heavyweight" },
      { icon: "star", label: "4.9★ Customer Rating" },
      { icon: "tag", label: "100% Combed Cotton" }
    ],
    image: "/images/hero-mens-tshirt-banner-2.jpg",
    imagePosition: "80% 10%",
    alt: "New Season Styles",
    slideLabel: "New Season Styles",
    themeClass: "hero-theme-2"
  },
  {
    id: 10,
    badge: "Best Deals",
    badgeIcon: "flame",
    subBadge: "",
    offer: "WINTER SALE",
    offerTag: "Limited Winter Stock",
    headline: "Styles Starting at Great Prices",
    support: "Brushed fleece hoodies, ribbed high-necks and signature winter layering essentials built for the cold.",
    cta: "Shop Now",
    link: "/collection?category=women",
    urgencyTag: "🔥 Limited Winter Stock",
    perks: [
      { icon: "shield", label: "Fleece Lined Comfort" },
      { icon: "truck", label: "Cash on Delivery Available" },
      { icon: "bolt", label: "Same-Day Dispatch" }
    ],
    image: "/images/cat-banner-womens.jpg",
    imagePosition: "75% 8%",
    alt: "Styles Starting at Great Prices",
    slideLabel: "Styles Starting at Great Prices",
    themeClass: "hero-theme-3"
  }
];

export default function Hero() {
  const { homeData } = useShop();
  const managedBanners = [
    ...(homeData?.banners?.hero || []),
    ...(homeData?.banners?.home_hero || [])
  ].filter((banner) => banner?.is_active !== false);

  const banners = managedBanners.length
    ? managedBanners.map((banner, index) => {
        const promo = banner.badge_promo?.trim() || "";
        const tag = banner.tag?.trim() || "";
        const title = banner.title?.trim() || "ZMW Clothing";
        const subtitle = banner.subtitle?.trim() || "";
        const offer = promo || title;
        const offerTag = banner.secondary_cta_text && banner.secondary_cta_text.toLowerCase() !== tag.toLowerCase() ? banner.secondary_cta_text : "";
        const urgencyTag = banner.secondary_cta_text
          ? (banner.secondary_cta_text.includes("Fast") ? `⚡ ${banner.secondary_cta_text}` : banner.secondary_cta_text.includes("Stock") ? `🔥 ${banner.secondary_cta_text}` : `✨ ${banner.secondary_cta_text}`)
          : "✨ Fresh Drop";

        return {
          id: banner.id,
          badge: tag || "ZMW",
          badgeIcon: index === 0 ? "bolt" : index === 1 ? "sparkle" : "flame",
          subBadge: "",
          offer,
          offerTag,
          headline: promo && promo.toLowerCase() === title.toLowerCase() ? (tag || "Special Edition") : title,
          support: subtitle,
          cta: banner.primary_cta_text?.trim() || "Shop Now",
          link: (banner.primary_cta_link && !banner.primary_cta_link.startsWith("#")) ? banner.primary_cta_link : "/collection",
          urgencyTag,
          perks: index === 1 ? [
            { icon: "shield", label: "240 GSM Heavyweight" },
            { icon: "star", label: "4.9★ Customer Rating" },
            { icon: "tag", label: "100% Combed Cotton" }
          ] : index === 2 ? [
            { icon: "shield", label: "Fleece Lined Comfort" },
            { icon: "truck", label: "Cash on Delivery Available" },
            { icon: "bolt", label: "Same-Day Dispatch" }
          ] : [
            { icon: "truck", label: SHIPPING_LABEL },
            { icon: "refresh", label: "7-Day Easy Returns" },
            { icon: "shield", label: "100% Quality Checked" }
          ],
          image: banner.image_url,
          imagePosition: banner.image_position || "75% 10%",
          alt: title,
          slideLabel: title,
          themeClass: `hero-theme-${(index % 3) + 1}`
        };
      })
    : HERO_BANNERS;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    setCurrentSlide((prev) => (prev >= banners.length ? 0 : prev));
  }, [banners.length]);

  // 5-second automatic slide transition
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      nextSlide();
    } else if (distance < -45) {
      prevSlide();
    }
  };

  return (
    <section
      id="home"
      className="hero-section hero-clean-banner"
      aria-label="Featured Streetwear Banners"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-slides-wrapper">
        {banners.map((banner, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={banner.id}
              className={`hero-slide-item ${isActive ? "active" : ""} hero-slide-${banner.id} ${banner.themeClass}`}
              aria-hidden={!isActive}
            >
              {/* Full-bleed background image with clear model visibility */}
              <div className="hero-backdrop">
                <img
                  src={imageUrl(banner.image)}
                  alt={banner.alt}
                  className="hero-backdrop-img"
                  loading={index === 0 ? "eager" : "lazy"}
                  style={banner.imagePosition ? { objectPosition: banner.imagePosition } : undefined}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/hero-mens-oversized-tee.jpg";
                  }}
                />
                {/* Subtle scrim ensuring clothing & model details stay bright and text is crisp */}
                <div className="hero-backdrop-scrim" />
              </div>

              {/* Visually rich ecommerce content container on the LEFT */}
              <div className="container hero-container">
                <div className="hero-content-box">
                  {/* Top Badge Row: Small supporting elements */}
                  <div className="hero-tag-wrap">
                    <span className="hero-tag-badge gold">
                      {renderHeroIcon(banner.badgeIcon)}
                      {banner.badge}
                    </span>
                    {banner.subBadge && (
                      <span className="hero-tag-subbadge">
                        {banner.subBadge}
                      </span>
                    )}
                  </div>

                  {/* 1. PRIMARY OFFER (Strong Visual Hierarchy) */}
                  <div className="hero-offer-block">
                    <div className="hero-offer-heading">
                      {banner.offer}
                    </div>
                    {banner.offerTag && (
                      <span className="hero-offer-tag">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          <circle cx="7" cy="7" r="1.5" />
                        </svg>
                        {banner.offerTag}
                      </span>
                    )}
                  </div>

                  {/* 2. SUPPORTING TEXT & CAMPAIGN HEADLINE */}
                  <div className="hero-campaign-info">
                    <h2 className="hero-campaign-headline">
                      {banner.headline}
                    </h2>
                    <p className="hero-subtitle">
                      {banner.support}
                    </p>
                  </div>

                  {/* ECOMMERCE MICRO-PERKS BAR */}
                  <div className="hero-perks-bar">
                    {banner.perks.map((perk, pIdx) => (
                      <div key={pIdx} className="hero-perk-item">
                        <span className="hero-perk-icon">
                          {renderHeroIcon(perk.icon)}
                        </span>
                        <span className="hero-perk-label">{perk.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* 3. CALL TO ACTION & SOCIAL PROOF */}
                  <div className="hero-cta-group">
                    <Link to={banner.link} className="hero-btn-primary">
                      <span>{banner.cta}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>

                    {banner.urgencyTag && (
                      <span className="hero-urgency-pill">
                        {banner.urgencyTag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Arrows */}
      <button
        type="button"
        className="hero-nav-arrow hero-nav-arrow-prev"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous Slide"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        type="button"
        className="hero-nav-arrow hero-nav-arrow-next"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next Slide"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Slide Dot Indicators */}
      <div className="hero-dots-wrap" role="tablist" aria-label="Hero slide indicators">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            role="tab"
            aria-selected={index === currentSlide}
            aria-label={`Go to slide ${index + 1}: ${banner.slideLabel}`}
            className={`hero-dot-btn ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
