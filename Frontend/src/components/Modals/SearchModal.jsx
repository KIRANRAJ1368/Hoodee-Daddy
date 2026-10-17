import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import "./SearchModal.css";

const POPULAR_SEARCHES = [
  "Round Neck T-Shirts",
  "Polo T-Shirts",
  "Hoodies",
  "Sweatshirts",
  "Joggers",
  "New Arrivals",
  "Best Sellers"
];

// Map popular/chip terms to reliable match keys (handles plural/noise).
const CHIP_QUERIES = {
  "round neck t-shirts": "round neck",
  "polo t-shirts": "polo",
  "hoodies": "hoodie",
  "sweatshirts": "sweatshirt",
  "joggers": "joggers",
  "new arrivals": "@new",
  "best sellers": "@best"
};

export default function SearchModal() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    allProducts,
    products,
    categories,
    formatPrice
  } = useShop();

  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Dynamically derive popular search chips from real subcategories and categories
  const dynamicPopularSearches = useMemo(() => {
    const list = [];
    (categories || []).forEach((c) => {
      (c.subcategories || []).forEach((sub) => {
        if (sub.name && !list.includes(sub.name)) list.push(sub.name);
      });
    });
    return list.length > 0 ? list.slice(0, 8) : POPULAR_SEARCHES;
  }, [categories]);

  // Combine products list safely
  const productCatalog = useMemo(() => {
    return allProducts && allProducts.length > 0 ? allProducts : products || [];
  }, [allProducts, products]);

  // Focus input on open, clear on close
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
    }
  }, [isSearchOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Pre-index searchable text so keystrokes do not rebuild strings per product
  const indexedCatalog = useMemo(() => {
    return productCatalog.map((p) => {
      const variantColors = (p.variants || []).map((v) => v.color).filter(Boolean);
      const variantSizes = (p.variants || []).map((v) => v.size).filter(Boolean);
      const text = [
        p.name,
        p.category,
        p.subCategory,
        p.description,
        p.badge,
        p.sku,
        ...(p.colors || []).map((c) => (typeof c === "string" ? c : c?.name) || ""),
        ...variantColors,
        ...variantSizes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return { product: p, text };
    });
  }, [productCatalog]);

  if (!isSearchOpen) return null;

  const trimmed = debouncedQuery.trim().toLowerCase();

  // Resolve chip-friendly terms to reliable match keys
  const searchTerm = CHIP_QUERIES[trimmed] || trimmed;

  const matchesProduct = (entry) => {
    const p = entry.product;
    if (searchTerm === "@new") {
      return (
        p.isNew ||
        p.badgeType === "new" ||
        (p.badge || "").toLowerCase().includes("new")
      );
    }
    if (searchTerm === "@best") {
      return (
        p.isBestSeller ||
        p.badgeType === "hot" ||
        (p.badge || "").toLowerCase().includes("best")
      );
    }

    return entry.text.includes(searchTerm);
  };

  const filteredProducts = trimmed
    ? indexedCatalog.filter(matchesProduct).map((e) => e.product).slice(0, 12)
    : [];

  const handleSelectProduct = (productId) => {
    setIsSearchOpen(false);
    navigate(`/product/${productId}`);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (trimmed) {
      setIsSearchOpen(false);
      navigate(`/collection?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="search-dropdown-overlay" onClick={() => setIsSearchOpen(false)}>
      <div
        className="search-dropdown-container"
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search catalog"
      >
        {/* Search Bar Row */}
        <form className="search-bar-row" onSubmit={handleSearchSubmit}>
          <div className="search-input-box">
            <svg
              className="search-bar-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>

            <input
              ref={inputRef}
              type="text"
              className="search-input-field"
              placeholder="Search for products… (Press Enter to view all)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(e);
                }
              }}
              aria-label="Search for products"
              autoComplete="off"
            />

            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setQuery("");
                  if (inputRef.current) inputRef.current.focus();
                }}
                aria-label="Clear search text"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="search-dropdown-close-btn"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search"
          >
            Close
          </button>
        </form>

        {/* Instant Suggestions / Results Dropdown */}
        <div className="search-dropdown-content">
          {/* Quick Popular Tags when empty */}
          {!trimmed && (
            <div className="search-popular-section">
              <span className="search-popular-label">Popular Searches</span>
              <div className="search-popular-chips">
                {dynamicPopularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="search-chip-btn"
                    onClick={() => {
                      setQuery(term);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                  >
                    <span>{term}</span>
                    <span className="search-chip-arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {trimmed && (
            <div className="search-results-section">
              <div className="search-results-header">
                <span className="search-results-count">
                  {filteredProducts.length === 0
                    ? `No results for "${query}"`
                    : `${filteredProducts.length} ${
                        filteredProducts.length === 1 ? "result" : "results"
                      } found`}
                </span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="search-results-list">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = !product.inStock || (product.stockCount !== undefined && Number(product.stockCount) <= 0) || product.stockStatus === "out_of_stock";
                    return (
                      <div
                        key={product.id}
                        className="search-result-item"
                        onClick={() => handleSelectProduct(product.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelectProduct(product.id);
                          }
                        }}
                      >
                        <div className="search-item-img-wrap">
                          <img
                            src={imageUrl(product.images?.[0] || product.image)}
                            alt={product.name}
                            className="search-item-img"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = "/images/zmw-logo-transparent.png"; }}
                          />
                        </div>

                        <div className="search-item-details">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="search-item-category">
                              {product.category}
                            </span>
                            {isOutOfStock && (
                              <span style={{ color: "#DC2626", fontSize: "0.7rem", fontWeight: 700 }}>
                                OUT OF STOCK
                              </span>
                            )}
                          </div>
                          <h4 className="search-item-name">{product.name}</h4>
                          <div className="search-item-price-row">
                            <span className="search-item-price">
                              {formatPrice(product.price)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="search-item-original-price">
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="search-item-arrow" aria-hidden="true">
                          &rarr;
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ padding: "12px 16px", textAlign: "center", borderTop: "1px solid var(--color-border, #e5e7eb)" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={handleSearchSubmit}
                    >
                      View all results for "{trimmed}" in Collection &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="search-no-results">
                  <p style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>No Products Found</p>
                  <span className="search-no-results-hint">
                    {productCatalog.length === 0
                      ? "No products have been added yet."
                      : `We couldn't find any products matching "${trimmed}". Try checking for spelling errors or using general terms.`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
