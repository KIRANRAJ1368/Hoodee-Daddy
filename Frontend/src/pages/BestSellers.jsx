import { useMemo, useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { CURRENCY_SYMBOL, formatINRNumber } from "../utils/formatPrice";
import { getBestSellers } from "../utils/merchandising";
import ProductCard from "../components/ProductCard/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed/RecentlyViewed";
import TrustFeatures from "../components/TrustFeatures/TrustFeatures";
import "./Men.css";
import "./BestSellers.css";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "title-asc", label: "Alphabetically: A-Z" },
  { value: "title-desc", label: "Alphabetically: Z-A" },
  { value: "rating", label: "Customer Rating" }
];

const INITIAL_PAGE_SIZE = 12;

export default function BestSellers() {
  const { allProducts, categories } = useShop();

  const activeCategories = useMemo(
    () => (categories || []).filter((c) => c.is_active),
    [categories]
  );

  const categoryTabs = useMemo(
    () => ["All", ...activeCategories.map((c) => c.name)],
    [activeCategories]
  );

  const ALL_GENDER_PRODUCTS = useMemo(() => {
    return (allProducts || []).map((p) => {
      const catSlug = String(p?.category ?? "").toLowerCase();
      // Strict exact-slug match only. Each product belongs to exactly the
      // category it was assigned to in Admin. No cross-category aliases.
      const matched = activeCategories.find(
        (c) => c.slug.toLowerCase() === catSlug
      );
      return { ...p, gender: matched ? matched.name : "Other" };
    });
  }, [allProducts, activeCategories]);

  // Dynamic price ceiling from full catalog
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(1, ...ALL_GENDER_PRODUCTS.map((p) => Number(p.price) || 0)) / 100) * 100,
    [ALL_GENDER_PRODUCTS]
  );

  // Filter states
  const [activeGender, setActiveGender] = useState("All");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [availability, setAvailability] = useState("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [sortBy, setSortBy] = useState("featured");

  // Layout / pagination
  const [gridDensity, setGridDensity] = useState(4);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Accordion state
  const [openFilters, setOpenFilters] = useState({
    gender: true,
    price: true,
    color: true,
    size: true,
    availability: true
  });

  // Reset price range when currency changes
  useEffect(() => {
    setMaxPrice(priceCeiling);
    setMinPrice(0);
  }, [priceCeiling]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileDrawerOpen]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [activeGender, selectedColors, selectedSizes, availability, minPrice, maxPrice, sortBy]);

  // Compute best-sellers pool (from the gender-filtered catalog)
  const genderCatalog = useMemo(() => {
    if (activeGender === "All") return ALL_GENDER_PRODUCTS;
    return ALL_GENDER_PRODUCTS.filter((p) => p.gender === activeGender);
  }, [activeGender]);

  // Best sellers pool from the active gender catalog
  const bestSellerPool = useMemo(() => {
    return getBestSellers(genderCatalog, { limit: 8 });
  }, [genderCatalog]);

  // Build color options from the current gender catalog
  const colorOptions = useMemo(() => {
    const map = new Map();
    genderCatalog.forEach((p) => {
      (p.colors || []).forEach((c) => {
        const name = typeof c === "string" ? c : c?.name;
        const hex = typeof c === "object" ? c?.hex || c?.hexCode : "#181715";
        if (name) {
          const key = name.toLowerCase();
          if (!map.has(key)) map.set(key, { name, hex: hex || "#181715", count: 0 });
          map.get(key).count += 1;
        }
      });
      (p.variants || []).forEach((v) => {
        if (v.color) {
          const key = v.color.toLowerCase();
          if (!map.has(key)) map.set(key, { name: v.color, hex: v.colorHex || "#181715", count: 0 });
          map.get(key).count += 1;
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [genderCatalog]);

  // Build size options from current gender catalog
  const sizeOptions = useMemo(() => {
    const set = new Set();
    genderCatalog.forEach((p) => {
      (p.sizes || []).forEach((s) => set.add(typeof s === "object" ? s.size || s.label : s));
      (p.variants || []).forEach((v) => { if (v.size) set.add(v.size); });
    });
    const order = [
      "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M",
      "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y",
      "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"
    ];
    return Array.from(set).sort((a, b) => {
      const iA = order.indexOf(a);
      const iB = order.indexOf(b);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [genderCatalog]);

  const isItemInStock = (p) => Boolean(
    p.inStock &&
    (p.stockCount === undefined || Number(p.stockCount) > 0) &&
    p.stockStatus !== "out_of_stock"
  );
  const inStockCount = useMemo(() => genderCatalog.filter(isItemInStock).length, [genderCatalog]);
  const outOfStockCount = genderCatalog.length - inStockCount;

  // Toggle helpers
  const toggleColor = (name) =>
    setSelectedColors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  const toggleSize = (size) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  const toggleFilterAccordion = (name) =>
    setOpenFilters((prev) => ({ ...prev, [name]: !prev[name] }));

  const clearFilters = () => {
    setActiveGender("All");
    setSelectedColors([]);
    setSelectedSizes([]);
    setAvailability("all");
    setMinPrice(0);
    setMaxPrice(priceCeiling);
    setSortBy("featured");
  };

  // Active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeGender !== "All") count += 1;
    if (selectedColors.length > 0) count += selectedColors.length;
    if (selectedSizes.length > 0) count += selectedSizes.length;
    if (availability !== "all") count += 1;
    if (minPrice > 0 || maxPrice < priceCeiling) count += 1;
    return count;
  }, [activeGender, selectedColors, selectedSizes, availability, minPrice, maxPrice, priceCeiling]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Filter + sort pipeline (applied on top of best sellers pool)
  const filteredProducts = useMemo(() => {
    // Start from full gender catalog (not only the top-8 best sellers) so filters work on the whole set
    let list = genderCatalog.filter((p) => {
      if (selectedColors.length > 0) {
        const hasColor =
          (p.colors || []).some((c) => selectedColors.some((sc) => sc.toLowerCase() === (typeof c === "string" ? c : c.name).toLowerCase())) ||
          (p.variants || []).some((v) => selectedColors.some((sc) => sc.toLowerCase() === (v.color || "").toLowerCase()));
        if (!hasColor) return false;
      }
      if (selectedSizes.length > 0) {
        const hasSize =
          (p.sizes || []).some((s) => selectedSizes.some((ss) => ss.toLowerCase() === (typeof s === "object" ? s.size || s.label : s).toLowerCase())) ||
          (p.variants || []).some((v) => selectedSizes.some((ss) => ss.toLowerCase() === (v.size || "").toLowerCase()));
        if (!hasSize) return false;
      }
      if (availability === "inStock" && !isItemInStock(p)) return false;
      if (availability === "outOfStock" && isItemInStock(p)) return false;
      const pPrice = Number(p.price) || 0;
      if (pPrice < minPrice || pPrice > maxPrice) return false;
      return true;
    });

    // Sort best sellers first by default, then apply user sort
    switch (sortBy) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "title-asc":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "title-desc":
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "best-selling":
      case "featured":
      default:
        // Best sellers first (isBestSeller flag), then by reviewCount
        list = [...list].sort((a, b) => {
          if (b.isBestSeller !== a.isBestSeller) return b.isBestSeller ? 1 : -1;
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        });
        break;
    }

    return list;
  }, [genderCatalog, selectedColors, selectedSizes, availability, minPrice, maxPrice, sortBy]);

  const displayedProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + INITIAL_PAGE_SIZE);
      setIsLoadingMore(false);
    }, 400);
  };

  const progressPercentage = Math.min(
    100,
    Math.round((displayedProducts.length / Math.max(1, filteredProducts.length)) * 100)
  );

  // Shared filter widget (used in both desktop sidebar and mobile drawer)
  const renderFilterWidgets = () => (
    <>
      {/* Gender / Category */}
      <div className={`filter-accordion-block ${openFilters.gender ? "open" : ""}`}>
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleFilterAccordion("gender")}
          aria-expanded={openFilters.gender}
        >
          <span>Shop By</span>
          <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {openFilters.gender && (
          <div className="filter-accordion-content">
            <ul className="filter-category-list">
              {categoryTabs.map((g) => {
                const count = g === "All"
                  ? ALL_GENDER_PRODUCTS.length
                  : ALL_GENDER_PRODUCTS.filter((p) => p.gender === g).length;
                return (
                  <li key={g}>
                    <button
                      type="button"
                      className={`filter-category-row ${activeGender === g ? "active" : ""}`}
                      onClick={() => setActiveGender(g)}
                    >
                      <span className="filter-checkbox-custom">
                        {activeGender === g && <span className="filter-checkbox-dot" />}
                      </span>
                      <span className="filter-cat-name">{g}</span>
                      <span className="filter-item-count">({count})</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className={`filter-accordion-block ${openFilters.price ? "open" : ""}`}>
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleFilterAccordion("price")}
          aria-expanded={openFilters.price}
        >
          <span>Price</span>
          <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {openFilters.price && (
          <div className="filter-accordion-content">
            <div className="price-inputs-row">
              <div className="price-input-group">
                <span className="price-input-prefix">{CURRENCY_SYMBOL}</span>
                <input
                  type="number"
                  min={0}
                  max={maxPrice}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                  className="price-number-input"
                  aria-label="Minimum price"
                />
              </div>
              <span className="price-separator">to</span>
              <div className="price-input-group">
                <span className="price-input-prefix">{CURRENCY_SYMBOL}</span>
                <input
                  type="number"
                  min={minPrice}
                  max={priceCeiling}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.min(priceCeiling, Number(e.target.value)))}
                  className="price-number-input"
                  aria-label="Maximum price"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={priceCeiling}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="price-slider"
              aria-label="Maximum price range"
            />
            <div className="price-range-labels">
              <span>{CURRENCY_SYMBOL}0</span>
              <span>up to {CURRENCY_SYMBOL}{formatINRNumber(maxPrice)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Color */}
      <div className={`filter-accordion-block ${openFilters.color ? "open" : ""}`}>
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleFilterAccordion("color")}
          aria-expanded={openFilters.color}
        >
          <span>Color</span>
          <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {openFilters.color && (
          <div className="filter-accordion-content">
            <ul className="filter-color-list">
              {colorOptions.map((c) => {
                const isActive = selectedColors.includes(c.name);
                return (
                  <li key={c.name}>
                    <button
                      type="button"
                      className={`filter-color-option ${isActive ? "active" : ""}`}
                      onClick={() => toggleColor(c.name)}
                      aria-pressed={isActive}
                    >
                      <span
                        className="filter-color-dot"
                        style={{ backgroundColor: c.hex }}
                        aria-hidden="true"
                      >
                        {isActive && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </span>
                      <span className="filter-color-name">{c.name}</span>
                      <span className="filter-item-count">({c.count})</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Size */}
      <div className={`filter-accordion-block ${openFilters.size ? "open" : ""}`}>
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleFilterAccordion("size")}
          aria-expanded={openFilters.size}
        >
          <span>Size</span>
          <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {openFilters.size && (
          <div className="filter-accordion-content">
            <div className="filter-size-grid">
              {sizeOptions.map((size) => {
                const isActive = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    className={`filter-size-chip ${isActive ? "active" : ""}`}
                    onClick={() => toggleSize(size)}
                    aria-pressed={isActive}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className={`filter-accordion-block ${openFilters.availability ? "open" : ""}`}>
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleFilterAccordion("availability")}
          aria-expanded={openFilters.availability}
        >
          <span>Availability</span>
          <svg className="filter-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {openFilters.availability && (
          <div className="filter-accordion-content">
            <label className="filter-checkbox-row">
              <input
                type="checkbox"
                checked={availability === "inStock"}
                onChange={() => setAvailability((prev) => (prev === "inStock" ? "all" : "inStock"))}
              />
              <span>In stock</span>
              <span className="filter-item-count">({inStockCount})</span>
            </label>
            <label className="filter-checkbox-row">
              <input
                type="checkbox"
                checked={availability === "outOfStock"}
                onChange={() => setAvailability((prev) => (prev === "outOfStock" ? "all" : "outOfStock"))}
              />
              <span>Out of stock</span>
              <span className="filter-item-count">({outOfStockCount})</span>
            </label>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="bs-page">
      {/* Page Header Banner */}
      <section className="bs-hero" aria-label="Best Sellers Collection">
        <div className="container bs-hero-inner">
          <span className="section-eyebrow">MOST COVETED</span>
          <h1 className="bs-hero-title">Best Sellers</h1>
          <p className="bs-hero-subtitle">
            Data-backed essentials — garments with peak sales, stellar reviews and enduring customer demand.
          </p>
          <div className="bs-gender-tabs" role="tablist" aria-label="Filter by category">
            {categoryTabs.map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                className={`bs-gender-tab ${activeGender === g ? "active" : ""}`}
                onClick={() => setActiveGender(g)}
                aria-selected={activeGender === g}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="section-padding bs-catalog-section">
        <div className="container">

          {/* Toolbar */}
          <div className="m-collection-toolbar">
            <div className="m-toolbar-left">
              {/* Mobile filter trigger */}
              <button
                type="button"
                className="m-btn-filter-trigger"
                onClick={() => setIsMobileDrawerOpen(true)}
                aria-label="Open filter menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="m-filter-badge-count">{activeFiltersCount}</span>
                )}
              </button>
              <span className="m-toolbar-total">
                Showing {Math.min(displayedProducts.length, filteredProducts.length)} of {filteredProducts.length} products
              </span>
            </div>

            <div className="m-toolbar-right">
              {/* Column switcher */}
              <div className="m-column-switcher" role="group" aria-label="Layout column switcher">
                <button
                  type="button"
                  className={`m-col-btn ${gridDensity === 3 ? "active" : ""}`}
                  onClick={() => setGridDensity(3)}
                  title="3 columns"
                  aria-label="3 columns view"
                  aria-pressed={gridDensity === 3}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="2" width="4" height="12" rx="1" />
                    <rect x="6" y="2" width="4" height="12" rx="1" />
                    <rect x="11" y="2" width="4" height="12" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`m-col-btn ${gridDensity === 4 ? "active" : ""}`}
                  onClick={() => setGridDensity(4)}
                  title="4 columns"
                  aria-label="4 columns view"
                  aria-pressed={gridDensity === 4}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="2" width="2.8" height="12" rx="0.8" />
                    <rect x="4.8" y="2" width="2.8" height="12" rx="0.8" />
                    <rect x="8.4" y="2" width="2.8" height="12" rx="0.8" />
                    <rect x="12.2" y="2" width="2.8" height="12" rx="0.8" />
                  </svg>
                </button>
              </div>

              {/* Sort */}
              <div className="m-sort-wrapper">
                <label htmlFor="bs-sort-select" className="m-sort-label">Sort by:</label>
                <div className="m-sort-select-box">
                  <select
                    id="bs-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="m-sort-select"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <svg className="m-sort-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          {hasActiveFilters && (
            <div className="m-active-filters-bar" aria-label="Active filters">
              <span className="m-active-label">Active filters:</span>
              <div className="m-active-tags-list">
                {activeGender !== "All" && (
                  <button
                    type="button"
                    className="m-active-tag"
                    onClick={() => setActiveGender("All")}
                    title="Remove category filter"
                  >
                    <span>{activeGender}</span>
                    <span className="m-tag-close">✕</span>
                  </button>
                )}
                {(minPrice > 0 || maxPrice < priceCeiling) && (
                  <button
                    type="button"
                    className="m-active-tag"
                    onClick={() => { setMinPrice(0); setMaxPrice(priceCeiling); }}
                    title="Reset price filter"
                  >
                    <span>{CURRENCY_SYMBOL}{formatINRNumber(minPrice)} – {CURRENCY_SYMBOL}{formatINRNumber(maxPrice)}</span>
                    <span className="m-tag-close">✕</span>
                  </button>
                )}
                {selectedColors.map((color) => (
                  <button key={color} type="button" className="m-active-tag" onClick={() => toggleColor(color)}>
                    <span>{color}</span>
                    <span className="m-tag-close">✕</span>
                  </button>
                ))}
                {selectedSizes.map((size) => (
                  <button key={size} type="button" className="m-active-tag" onClick={() => toggleSize(size)}>
                    <span>Size: {size}</span>
                    <span className="m-tag-close">✕</span>
                  </button>
                ))}
                {availability !== "all" && (
                  <button type="button" className="m-active-tag" onClick={() => setAvailability("all")}>
                    <span>{availability === "inStock" ? "In Stock" : "Out of Stock"}</span>
                    <span className="m-tag-close">✕</span>
                  </button>
                )}
                <button type="button" className="m-clear-all-btn" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Catalog layout: sidebar + grid */}
          <div className="m-collection-layout">
            {/* Desktop sidebar */}
            <aside className="m-filters-sidebar" aria-label="Desktop filters">
              <div className="m-sidebar-header">
                <h3>Filters</h3>
                {hasActiveFilters && (
                  <button type="button" className="m-sidebar-clear" onClick={clearFilters}>
                    Clear all
                  </button>
                )}
              </div>
              {renderFilterWidgets()}
            </aside>

            {/* Product grid */}
            <div className="m-grid-column">
              {displayedProducts.length > 0 ? (
                <>
                  <div className={`m-product-grid density-${gridDensity}`}>
                    {displayedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  <div className="m-pagination-wrap">
                    <div className="m-pagination-progress">
                      <p className="m-progress-text">
                        Showing {displayedProducts.length} of {filteredProducts.length} products
                      </p>
                      <div className="m-progress-bar-track">
                        <div
                          className="m-progress-bar-fill"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {displayedProducts.length < filteredProducts.length ? (
                      <button
                        type="button"
                        className="btn btn-primary m-btn-load-more"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <span className="m-btn-loader">
                            <span className="m-spinner-circle" />
                            Loading...
                          </span>
                        ) : (
                          <span>Load More</span>
                        )}
                      </button>
                    ) : (
                      <p className="m-pagination-end">You've seen all {filteredProducts.length} best sellers.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="m-empty-state">
                  <div className="m-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </div>
                  <h3>{ALL_GENDER_PRODUCTS.length === 0 ? "No Products Found" : "No matching styles found"}</h3>
                  <p>{ALL_GENDER_PRODUCTS.length === 0 ? "No best seller products have been added yet." : "Try clearing some filters or selecting a different category."}</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter drawer backdrop */}
      <div
        className={`m-filter-drawer-backdrop ${isMobileDrawerOpen ? "open" : ""}`}
        onClick={() => setIsMobileDrawerOpen(false)}
        aria-hidden={!isMobileDrawerOpen}
      />
      {/* Mobile filter drawer */}
      <div
        className={`m-filter-drawer ${isMobileDrawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
      >
        <div className="m-drawer-header">
          <div className="m-drawer-title-group">
            <h3>Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="m-filter-badge-count">{activeFiltersCount}</span>
            )}
          </div>
          <button
            type="button"
            className="m-drawer-close"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>
        <div className="m-drawer-body">
          {renderFilterWidgets()}
        </div>
        <div className="m-drawer-footer">
          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary m-drawer-clear-btn" onClick={clearFilters}>
              Clear all
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary m-drawer-apply-btn"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            View ({filteredProducts.length}) Products
          </button>
        </div>
      </div>

      <TrustFeatures />
      <RecentlyViewed />
    </div>
  );
}
