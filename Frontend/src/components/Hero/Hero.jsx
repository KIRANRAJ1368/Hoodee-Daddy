import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import "./Hero.css";

const HERO_BANNERS = [
  {
    id: 8,
    image: "/images/crazymonk-hero-oversized.jpg",
    imagePosition: "center center",
    alt: "Oversized Streetwear Drops · Buy 2 @ ₹999",
    link: "/collection?category=mens"
  },
  {
    id: 10,
    image: "/images/crazymonk-hero-hoodies.jpg",
    imagePosition: "center center",
    alt: "Winter Hoodie Shop · Buy 1 Get 1 50% Off",
    link: "/collection?category=mens"
  },
  {
    id: 9,
    image: "/images/crazymonk-hero-graphic-tees.jpg",
    imagePosition: "center center",
    alt: "Graphic Streetwear Drops · Buy 2 Get 1 Free",
    link: "/collection?category=mens"
  }
];

export default function Hero() {
  const { homeData } = useShop();

  const managedBanners = useMemo(() => {
    return [
      ...(homeData?.banners?.hero || []),
      ...(homeData?.banners?.home_hero || [])
    ].filter((banner) => banner?.is_active !== false);
  }, [homeData]);

  const banners = useMemo(() => {
    if (managedBanners.length > 0) {
      return managedBanners.map((banner, index) => {
        const title = banner.title?.trim() || `Banner ${index + 1}`;
        const targetLink =
          banner.primary_cta_link && !banner.primary_cta_link.startsWith("#")
            ? banner.primary_cta_link
            : "/collection";

        return {
          id: banner.id || `mb-${index}`,
          image: banner.image_url,
          imagePosition: banner.image_position || "center center",
          alt: title,
          link: targetLink
        };
      });
    }

    return HERO_BANNERS;
  }, [managedBanners]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const totalSlides = banners.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    setCurrentSlide((prev) => (prev >= totalSlides ? 0 : prev));
  }, [totalSlides]);

  // 5-second automatic slide transition
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || totalSlides <= 1) return;
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
      className="hero-section hero-pure-banner"
      aria-label="Promotional Hero Banners"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-pure-track">
        {banners.map((banner, index) => {
          const isActive = index === currentSlide;

          const imageContent = (
            <img
              src={imageUrl(banner.image)}
              alt={banner.alt}
              className="hero-pure-img"
              loading={index === 0 ? "eager" : "lazy"}
              style={banner.imagePosition ? { objectPosition: banner.imagePosition } : undefined}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/hero-mens-oversized-tee.jpg";
              }}
            />
          );

          return (
            <div
              key={banner.id || index}
              className={`hero-pure-slide ${isActive ? "active" : ""}`}
              aria-hidden={!isActive}
            >
              {banner.link ? (
                <Link
                  to={banner.link}
                  className="hero-pure-link"
                  aria-label={banner.alt}
                  tabIndex={isActive ? 0 : -1}
                >
                  {imageContent}
                </Link>
              ) : (
                <div className="hero-pure-link">
                  {imageContent}
                </div>
              )}

              {/* CrazyMonk-inspired Streetwear Live Pulse Badge */}
              <div className="hero-crazymonk-pill" aria-hidden="true">
                <span className="hero-crazymonk-dot" />
                <span className="hero-crazymonk-text">
                  {banner.alt || "STREETWEAR DROP"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Controls (Only if multiple banners) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            className="hero-pure-arrow hero-pure-arrow-prev"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            className="hero-pure-arrow hero-pure-arrow-next"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Slide"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="hero-pure-dots" role="tablist" aria-label="Hero slide indicators">
            {banners.map((banner, index) => (
              <button
                key={banner.id || index}
                type="button"
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Go to slide ${index + 1}: ${banner.alt}`}
                className={`hero-pure-dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
