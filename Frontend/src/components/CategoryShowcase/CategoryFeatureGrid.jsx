import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import ProductCard from "../ProductCard/ProductCard";
import useCarousel from "../../hooks/useCarousel";
import {
  CAROUSEL_BREAKPOINTS,
  shouldShowArrows,
  shouldShowCarousel,
  visibleCountForWidth,
  trackOffset
} from "../../utils/carouselCore";
import "./CategoryFeatureGrid.css";

function CardTile({ card }) {
  const hasImage = Boolean(card.image && typeof card.image === "string" && card.image.trim());
  return (
    <Link to={card.link} className="cat-feature-card">
      <div className="cat-feature-img-wrap">
        {hasImage ? (
          <img
            src={imageUrl(card.image)}
            alt={card.title ? `${card.title} - ${card.tag || "Clothing"} | HooDee Daddy` : "Category Item"}
            className="cat-feature-img"
            loading="lazy"
            style={card.imagePosition ? { objectPosition: card.imagePosition } : undefined}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="cat-feature-no-img">
            <span className="cat-feature-no-img-text">{card.title}</span>
          </div>
        )}
        <div className="cat-feature-overlay" />
      </div>
      <div className="cat-feature-caption">
        <h3 className="cat-feature-name">{card.title}</h3>
      </div>
    </Link>
  );
}

function CarouselArrow({ direction, onClick, label }) {
  return (
    <button
      type="button"
      className={`cat-feature-arrow ${direction}`}
      onClick={onClick}
      aria-label={label}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}></polyline>
      </svg>
    </button>
  );
}

export function CategoryCards({ cards: customCards, category: directCategory, categorySlug, defaultTag = "CATEGORY" }) {
  const { homeData } = useShop();
  const slug = categorySlug || directCategory?.slug || "";
  const category = directCategory || homeData?.categories?.find((item) => item.slug === slug || (slug === "mens" && item.slug === "men"));

  const [visibleCount, setVisibleCount] = useState(CAROUSEL_BREAKPOINTS.wide);
  useEffect(() => {
    const handleResize = () => setVisibleCount(visibleCountForWidth(window.innerWidth));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sanitizeTag = (tag) => {
    if (!tag) return defaultTag;
    if (/edit/i.test(tag)) return defaultTag;
    return tag;
  };

  const items = Array.isArray(customCards) ? customCards : [];

  const { index, next, prev, setPaused } = useCarousel(
    items.length,
    visibleCount,
    0
  );

  const slideWidth = 100 / visibleCount;

  if (items.length === 0) {
    return null;
  }

  if (!shouldShowCarousel(items.length, visibleCount)) {
    return (
      <div className="cat-feature-grid cat-feature-grid--four">
        {items.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="cat-feature-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {shouldShowArrows(items.length, visibleCount) && (
        <CarouselArrow direction="left" onClick={prev} label="Previous items" />
      )}

      <div className="cat-feature-carousel-viewport">
        <div
          className="cat-feature-carousel-track"
          style={{
            transform: `translateX(-${trackOffset(index, visibleCount)}%)`,
            transition: "transform 450ms cubic-bezier(0.25, 1, 0.5, 1)"
          }}
        >
          {items.map((card) => (
            <div
              key={card.id}
              className="cat-feature-carousel-slide"
              style={{ flex: `0 0 ${slideWidth}%`, maxWidth: `${slideWidth}%` }}
            >
              <CardTile card={card} />
            </div>
          ))}
        </div>
      </div>

      {shouldShowArrows(items.length, visibleCount) && (
        <CarouselArrow direction="right" onClick={next} label="Next items" />
      )}
    </div>
  );
}

/* ── Generic Data-Driven Category Section ── */
export function CategorySection({ category, section }) {
  const { homeData, allProducts } = useShop();
  if (!category || category.is_active === false || category.show_on_homepage === false) {
    return null;
  }
  if (section && section.is_active === false) {
    return null;
  }

  // Find the authoritative banner for this category from homeData.banners
  const bannerList =
    homeData?.banners?.[category.slug] ||
    (category.slug === "mens" ? homeData?.banners?.["men"] : null) ||
    (category.slug === "women" ? homeData?.banners?.["womens"] : null) ||
    [];
  const banner = Array.isArray(bannerList) && bannerList.length > 0 ? bannerList[0] : null;

  const eyebrowText = `${category.name.toUpperCase()} COLLECTION`;
  const defaultTitle = `${category.name} Collection`;
  const defaultSubtitle =
    category.description ||
    `Explore premium ${category.name.toLowerCase()} essentials crafted for an elevated, modern fit.`;

  const title = banner?.title || section?.title || defaultTitle;
  const subtitle = banner?.subtitle || section?.subtitle || defaultSubtitle;
  const slugClass = `${category.slug}-feature-section`;

  // First 4 active products for this category
  const categoryProducts = useMemo(() => {
    if (Array.isArray(category.products) && category.products.length > 0) {
      return category.products.slice(0, 4);
    }
    const catId = Number(category.id);
    const catSlug = String(category.slug || "").trim().toLowerCase();
    return (allProducts || [])
      .filter((p) => {
        if (p.categoryId && Number(p.categoryId) === catId) return true;
        const pCat = String(p.category || "").trim().toLowerCase();
        if (pCat && pCat === catSlug) return true;
        if ((catSlug === "mens" || catSlug === "men") && (pCat === "mens" || pCat === "men")) return true;
        if ((catSlug === "women" || catSlug === "womens") && (pCat === "women" || pCat === "womens")) return true;
        return false;
      })
      .slice(0, 4);
  }, [category, allProducts]);

  return (
    <section className={`category-feature-section ${slugClass}`} aria-label={`${category.name} Collection`}>
      <div className="container">
        {/* Render Clean Category Section Header with Direct View All Products CTA */}
        <div className="cat-feature-header-row">
          <div className="section-header-left">
            <div className="section-eyebrow-badge">
              <span className="eyebrow-dot" />
              <span className="eyebrow-text">{eyebrowText}</span>
            </div>
            <h2 className="section-heading-title">{title}</h2>
            <p className="section-heading-subtitle">{subtitle}</p>
          </div>

          <Link
            to={`/categories/${encodeURIComponent(category.slug)}`}
            className="cat-feature-view-all-btn"
            aria-label={`View all ${category.name} products`}
          >
            <span>View All Products</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>

        {/* First 4 Products Grid */}
        {categoryProducts.length > 0 ? (
          <div className="cat-products-grid">
            {categoryProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="cat-empty-state">
            <p>Products will appear here once added from the Admin Panel.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Backwards-Compatible Category Section Exports ── */
export function MensCategoriesSection() {
  const { homeData } = useShop();
  const category = homeData?.categories?.find((item) => item.slug === "mens" || item.slug === "men");
  const section = homeData?.sections?.find((item) => item.section_key === "mens_categories");
  return category ? <CategorySection category={category} section={section} /> : null;
}

export function WomensCategoriesSection() {
  const { homeData } = useShop();
  const category = homeData?.categories?.find((item) => item.slug === "women" || item.slug === "womens");
  const section = homeData?.sections?.find((item) => item.section_key === "womens_categories");
  return category ? <CategorySection category={category} section={section} /> : null;
}

export function BoysCategoriesSection() {
  const { homeData } = useShop();
  const category = homeData?.categories?.find((item) => item.slug === "boys");
  const section = homeData?.sections?.find((item) => item.section_key === "boys_categories");
  return category ? <CategorySection category={category} section={section} /> : null;
}

export function GirlsCategoriesSection() {
  const { homeData } = useShop();
  const category = homeData?.categories?.find((item) => item.slug === "girls");
  const section = homeData?.sections?.find((item) => item.section_key === "girls_categories");
  return category ? <CategorySection category={category} section={section} /> : null;
}

export function BabiesCategoriesSection() {
  const { homeData } = useShop();
  const category = homeData?.categories?.find((item) => item.slug === "babies");
  const section = homeData?.sections?.find((item) => item.section_key === "babies_categories");
  return category ? <CategorySection category={category} section={section} /> : null;
}

/* ── Main CategoryFeatureGrid Export (Data-Driven across all categories) ── */
export default function CategoryFeatureGrid() {
  const { homeData } = useShop();
  const categories = (homeData?.categories || [])
    .filter((c) => c.is_active !== false && c.show_on_homepage !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
  const sectionMap = new Map((homeData?.sections || []).map((s) => [s.section_key, s]));

  return (
    <>
      {categories.map((category) => {
        const sectionKey =
          category.slug === "mens" || category.slug === "men"
            ? "mens_categories"
            : category.slug === "women" || category.slug === "womens"
            ? "womens_categories"
            : `${category.slug}_categories`;
        const section = sectionMap.get(sectionKey) || sectionMap.get(category.slug);
        return <CategorySection key={category.id || category.slug} category={category} section={section} />;
      })}
    </>
  );
}
