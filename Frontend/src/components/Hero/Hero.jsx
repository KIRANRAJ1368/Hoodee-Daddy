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

  // Advance automatically every 3 seconds.
  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [totalSlides, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null || totalSlides <= 1) return;
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
