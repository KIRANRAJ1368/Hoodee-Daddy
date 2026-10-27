import React, { useMemo, useState, useEffect } from "react";
import { useShop } from "../../context/ShopContext";
import {
  getBestSellers,
  getNewArrivals,
  generateCatalogJsonLd
} from "../../utils/merchandising";
import CuratedCard from "./CuratedCard";
import CTABanner from "../CTABanner/CTABanner";
import useManualScrollCarousel from "../../hooks/useManualScrollCarousel";
import "./CuratedShowcase.css";

/* ── ProductCarousel Component ── */
function ProductCarousel({
  products,
  badgeLabelKey,
  defaultBadge,
  badgeTone,
  sectionId,
  eyebrow,
  title,
  subtitle,
  viewAllTo,
  viewAllLabel,
  bgClass,
  filterPills,
  selectedPill,
  onPillChange,
}) {
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w <= 768) {
        setVisibleCount(2);
      } else if (w <= 1100) {
        setVisibleCount(3);
      } else {
        setVisibleCount(4);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { trackRef, scrollNext, scrollPrev, containerProps, trackProps } = useManualScrollCarousel({
    autoDelayMs: 4000
  });

  return (
    <section
      id={sectionId}
      className={`curated-section ${bgClass}`}
      aria-label={title}
    >
      <div className="container">
        {/* Header Row: heading left + CTA button right */}
        <div className="curated-header-row">
          <div className="section-header-left">
            <div className="section-eyebrow-badge">
              <span className="eyebrow-dot" />
              <span className="eyebrow-text">{eyebrow}</span>
            </div>
            <h2 className="section-heading-title">{title}</h2>
            <p className="section-heading-subtitle">{subtitle}</p>
          </div>
          <CTABanner
            ctaTo={viewAllTo}
            ctaLabel={viewAllLabel}
          />
        </div>

        {/* Filter Pills (e.g. for New Arrivals) */}
        {filterPills && filterPills.length > 1 && (
          <div className="curated-dept-pills">
            {filterPills.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`curated-dept-pill ${selectedPill === d.id ? "active" : ""}`}
                onClick={() => onPillChange(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Carousel Viewport & Floating Arrows */}
        {products && products.length > 0 ? (
          <div className="carousel-container" {...containerProps}>
            {/* Side arrow left */}
            <button
              type="button"
              className="carousel-side-arrow left"
              onClick={scrollPrev}
              aria-label="Previous slide"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {/* Track Viewport */}
            <div className="carousel-viewport" {...trackProps}>
              <div className="carousel-slider-track">
                {products.map((item, idx) => (
                  <div
                    key={item.id}
                    className="carousel-slide-item fade"
                    style={{
                      flex: `0 0 ${100 / visibleCount}%`,
                      maxWidth: `${100 / visibleCount}%`,
                      animationDelay: `${Math.min(idx * 70, 420)}ms`
                    }}
                  >
                    <CuratedCard
                      product={item}
                      badgeLabel={item[badgeLabelKey] || defaultBadge}
                      badgeTone={badgeTone}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Side arrow right */}
            <button
              type="button"
              className="carousel-side-arrow right"
              onClick={scrollNext}
              aria-label="Next slide"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        ) : (
          <div className="curated-empty-state" style={{ textAlign: "center", padding: "48px 20px 36px", color: "var(--brand-blue)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "var(--brand-white)", marginBottom: "12px", color: "var(--brand-blue)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--brand-blue)", margin: "0 0 4px" }}>No Products Found</h3>
            <p style={{ fontSize: "14px", color: "var(--brand-blue)", margin: 0 }}>Products will appear here once added from the Admin Panel.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Individual Section 2: New Arrivals Export ── */
export function NewArrivalsSection() {
  const { allProducts, products, homeData } = useShop();

  const catalog = useMemo(() => {
    return allProducts && allProducts.length > 0 ? allProducts : products;
  }, [allProducts, products]);

  const bestSellers = useMemo(() => {
    return getBestSellers(catalog, { limit: 12, period: "30d" });
  }, [catalog]);

  const bestSellerIds = useMemo(() => {
    return bestSellers.map((p) => p.id);
  }, [bestSellers]);

  const newArrivals = useMemo(() => {
    return homeData?.newArrivals?.length
      ? homeData.newArrivals
      : getNewArrivals(catalog, bestSellerIds, { limit: 12 });
  }, [catalog, bestSellerIds, homeData]);

  const section = homeData?.sections?.find((item) => item.section_key === "new_arrivals");

  const [selectedDept, setSelectedDept] = useState("all");

  const displayedNewArrivals = useMemo(() => {
    if (selectedDept === "all") return newArrivals;
    const matchDept = (p) => {
      if (selectedDept === "all") return true;
      const cat = (p.category || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const sel = selectedDept.toLowerCase();

      if (sel === "mens" || sel === "men") return cat === "mens" || cat === "men";
      if (sel === "women" || sel === "womens") return cat === "women" || cat === "womens";
      return cat === sel || name.includes(sel);
    };
    const inNewArrivals = newArrivals.filter(matchDept);
    if (inNewArrivals.length > 0) return inNewArrivals;
    const inCatalog = catalog.filter(matchDept);
    return inCatalog.length > 0 ? inCatalog.slice(0, 12) : newArrivals;
  }, [catalog, newArrivals, selectedDept]);

  const newArrivalsJsonLd = useMemo(() => {
    return generateCatalogJsonLd(newArrivals, "HooDee Daddy New Arrivals");
  }, [newArrivals]);

  const deptPills = useMemo(() => {
    const defaultPills = [{ id: "all", label: "All Items" }];
    if (homeData?.categories && homeData.categories.length > 0) {
      const activeCats = [...homeData.categories]
        .filter((c) => c.is_active !== false)
        .sort((a, b) => (Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)) || ((Number(a.id) || 0) - (Number(b.id) || 0)));
      const catPills = activeCats.map((c) => ({
        id: c.slug,
        label: c.name
      }));
      return [...defaultPills, ...catPills];
    }
    return defaultPills;
  }, [homeData]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newArrivalsJsonLd) }}
      />
      <ProductCarousel
        products={displayedNewArrivals}
        badgeLabelKey="newArrivalBadge"
        defaultBadge="NEW"
        badgeTone="new"
        sectionId="whats-new-this-season"
        eyebrow="JUST RELEASED 2026"
        title={section?.title || "New Arrivals"}
        subtitle={section?.subtitle || "Directly from our design atelier. Freshly dropped silhouettes with zero overlap with our best-seller lineup."}
        viewAllTo="/collection?collection=new-arrivals"
        viewAllLabel="Explore All New Arrivals"
        bgClass="new-arrivals-section"
        filterPills={deptPills}
        selectedPill={selectedDept}
        onPillChange={setSelectedDept}
      />
    </>
  );
}

/* ── Individual Section 5: Best Sellers Export ── */
export function BestSellersSection() {
  const { allProducts, products, homeData } = useShop();

  const catalog = useMemo(() => {
    return allProducts && allProducts.length > 0 ? allProducts : products;
  }, [allProducts, products]);

  const bestSellers = useMemo(() => {
    return homeData?.bestSellers?.length
      ? homeData.bestSellers
      : getBestSellers(catalog, { limit: 12, period: "30d" });
  }, [catalog, homeData]);

  const section = homeData?.sections?.find((item) => item.section_key === "best_sellers");

  const bestSellersJsonLd = useMemo(() => {
    return generateCatalogJsonLd(bestSellers, "HooDee Daddy Best Sellers");
  }, [bestSellers]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bestSellersJsonLd) }}
      />
      <ProductCarousel
        products={bestSellers}
        badgeLabelKey="salesRankBadge"
        defaultBadge="BEST SELLER"
        badgeTone="hot"
        sectionId="most-loved-pieces"
        eyebrow="MOST COVETED PIECES"
        title={section?.title || "Best Sellers"}
        subtitle={section?.subtitle || "Data-backed essentials: garments with peak sales volume, stellar verified reviews, and enduring customer demand."}
        viewAllTo="/collection?collection=best-sellers"
        viewAllLabel="View All Best Sellers"
        bgClass="best-sellers-section"
      />
    </>
  );
}

/* ── Main CuratedShowcase Export (Backwards Compatible) ── */
export default function CuratedShowcase() {
  return (
    <div className="curated-showcase-wrapper">
      <NewArrivalsSection />
      <BestSellersSection />
    </div>
  );
}
