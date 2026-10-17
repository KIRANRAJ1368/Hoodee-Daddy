import React from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import "./CategoryVisuals.css";

const CATEGORIES_DATA = [
  {
    id: "cat-men",
    badge: "⚡ TRENDING",
    title: "MEN",
    subtitle: "Oversized Tees, Polos & Hoodies",
    cta: "Shop Men",
    image: "/images/dept-mens.jpg",
    imagePosition: "center 6%",
    link: "/men"
  },
  {
    id: "cat-women",
    badge: "🔥 HOT DROP",
    title: "WOMEN",
    subtitle: "Crop Tops, Tees & Chic Fits",
    cta: "Explore Women",
    image: "/images/dept-womens.jpg",
    imagePosition: "center 6%",
    link: "/women"
  },
  {
    id: "cat-boys",
    badge: "✨ STREETWEAR",
    title: "BOYS",
    subtitle: "Skate Tees, Sets & Shorts",
    cta: "Shop Boys",
    image: "/images/dept-boys.jpg",
    imagePosition: "center 6%",
    link: "/kids?category=Boys"
  },
  {
    id: "cat-girls",
    badge: "🌸 NEW STYLES",
    title: "GIRLS",
    subtitle: "Dresses, Sets & Pretty Tees",
    cta: "Shop Girls",
    image: "/images/dept-girls.jpg",
    imagePosition: "center 8%",
    link: "/kids?category=Girls"
  },
  {
    id: "cat-babies",
    badge: "🍼 100% SOFT",
    title: "BABIES",
    subtitle: "Rompers, Pyjamas & Soft Knits",
    cta: "Shop Babies",
    image: "/images/dept-babies.jpg",
    imagePosition: "center 4%",
    link: "/kids?category=Babies"
  }
];

export default function CategoryVisuals() {
  const { homeData } = useShop();
  const section = homeData?.sections?.find((item) => item.section_key === "category_visuals");

  const customDepts =
    Array.isArray(section?.config?.departments) && section.config.departments.length > 0
      ? section.config.departments
          .filter((d) => d.is_active !== false)
          .map((d, i) => {
            const fallback =
              CATEGORIES_DATA.find((c) => c.title.toLowerCase() === (d.title || "").toLowerCase()) ||
              CATEGORIES_DATA[i] ||
              {};
            return {
              id: d.id || fallback.id || `dept-${i}`,
              badge: d.badge || fallback.badge || "SHOP THE COLLECTION",
              title: d.title || fallback.title || "DEPARTMENT",
              subtitle: d.subtitle || fallback.subtitle || "",
              cta: d.cta || fallback.cta || `Shop ${d.title || "Now"}`,
              image: d.image || fallback.image || "/images/dept-mens.jpg",
              imagePosition: d.imagePosition || fallback.imagePosition || "center 6%",
              link: d.link || fallback.link || "/collection"
            };
          })
      : null;

  const categories =
    customDepts ||
    (homeData?.categories?.length
      ? [...homeData.categories]
          .filter((c) => c.is_active !== false)
          .sort((a, b) => (Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)) || ((Number(a.id) || 0) - (Number(b.id) || 0)))
          .map((category) => {
          const existingCategory = CATEGORIES_DATA.find(
            (item) => item.title.toLowerCase() === category.name.toLowerCase()
          );
          return {
            id: category.id,
            badge: category.description || existingCategory?.badge || "SHOP THE COLLECTION",
            title: category.name,
            subtitle: category.description || existingCategory?.subtitle || "Discover the latest ZMW styles.",
            cta: `Shop ${category.name}`,
            image: category.image_url || existingCategory?.image || "/images/dept-family-banner.jpg",
            imagePosition: category.image_position || existingCategory?.imagePosition || "center 8%",
            link: existingCategory?.link || `/collection?category=${encodeURIComponent(category.slug)}`
          };
        })
      : CATEGORIES_DATA);
  const topCategories = categories.slice(0, 2);
  const remainingCategories = categories.slice(2);

  return (
    <section className="category-visuals-section" aria-label="Shop by Department">
      <div className="container">
        {/* Left-Aligned Section Header */}
        <div className="section-header-left">
          <div className="section-eyebrow-badge">
            <span className="eyebrow-dot" />
            <span className="eyebrow-text">DISCOVER APPAREL</span>
          </div>
          <h2 className="section-heading-title">{section?.title || "Explore by Department"}</h2>
          <p className="section-heading-subtitle">
            {section?.subtitle || "Curated wardrobe essentials crafted for iconic style — Men, Women, Boys, Girls & Babies."}
          </p>
        </div>

        {/* 2+3 Hero Banner Grid */}
        <div className="category-hero-grid">
          {/* Row 1 — 2 Flagship Cards (Men & Women) */}
          <div className="cat-hero-row cat-hero-row-top">
            {topCategories.map((cat) => (
              <Link key={cat.id} to={cat.link} className="cat-hero-card cat-hero-card--wide">
                <img
                  src={imageUrl(cat.image)}
                  alt={cat.title}
                  className="cat-hero-backdrop"
                  loading="lazy"
                  style={{ objectPosition: cat.imagePosition }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="cat-hero-scrim" />
                <div className="cat-hero-content">
                  <span className="cat-hero-badge">{cat.badge}</span>
                  <h3 className="cat-hero-title">{cat.title}</h3>
                  <p className="cat-hero-desc">{cat.subtitle}</p>
                  <span className="cat-hero-btn">
                    {cat.cta}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Row 2 — 3 Featured Cards (Boys, Girls, Babies) */}
          <div className="cat-hero-row cat-hero-row-bottom">
            {remainingCategories.map((cat) => (
              <Link key={cat.id} to={cat.link} className="cat-hero-card cat-hero-card--standard">
                <img
                  src={imageUrl(cat.image)}
                  alt={cat.title}
                  className="cat-hero-backdrop"
                  loading="lazy"
                  style={{ objectPosition: cat.imagePosition }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="cat-hero-scrim" />
                <div className="cat-hero-content">
                  <span className="cat-hero-badge">{cat.badge}</span>
                  <h3 className="cat-hero-title">{cat.title}</h3>
                  <p className="cat-hero-desc">{cat.subtitle}</p>
                  <span className="cat-hero-btn">
                    {cat.cta}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
