import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { storefrontApi } from "../../services/storefrontApi";
import TopAnnouncementBar from "../TopAnnouncementBar/TopAnnouncementBar";
import "./Navbar.css";

function isCategoryMatching(catSlug, activeNav) {
  if (!catSlug || !activeNav) return false;
  const s1 = String(catSlug).toLowerCase().trim();
  const s2 = String(activeNav).toLowerCase().trim();
  if (s1 === s2) return true;
  // Normalize men / mens
  if ((s1 === "men" || s1 === "mens") && (s2 === "men" || s2 === "mens")) return true;
  // Normalize woman / women / womens
  if ((s1 === "women" || s1 === "woman" || s1 === "womens") && (s2 === "women" || s2 === "woman" || s2 === "womens")) return true;
  return false;
}

function sortCategoriesBySequence(cats) {
  if (!Array.isArray(cats)) return [];
  return [...cats].sort(
    (a, b) => (Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)) || ((Number(a.id) || 0) - (Number(b.id) || 0))
  );
}

export default function Navbar() {
  const {
    homeData,
    categories: contextCategories,
    cartItemCount,
    wishlistCount,
    setIsSearchOpen,
    setAuthModalState,
    setIsOrderTrackOpen,
    customerUser,
    logoutCustomer
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDesktopMenu, setOpenDesktopMenu] = useState(null);
  const [dropdownCoords, setDropdownCoords] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileExpandedCats, setMobileExpandedCats] = useState({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const desktopNavRef = useRef(null);
  const navScrollRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef({});
  const hoverTimeoutRef = useRef(null);

  // Dynamic Categories from Context / API / localStorage cache
  const [categories, setCategories] = useState(() => {
    try {
      const cached = localStorage.getItem("hd_navbar_categories");
      return cached ? sortCategoriesBySequence(JSON.parse(cached)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (homeData) {
      const activeCats = sortCategoriesBySequence(
        (homeData.categories || []).filter((c) => c.is_active !== false)
      );
      setCategories(activeCats);
      try {
        localStorage.setItem("hd_navbar_categories", JSON.stringify(activeCats));
      } catch (e) {}
    } else if (Array.isArray(contextCategories) && contextCategories.length > 0) {
      const activeCats = sortCategoriesBySequence(
        contextCategories.filter((c) => c.is_active !== false)
      );
      setCategories(activeCats);
      try {
        localStorage.setItem("hd_navbar_categories", JSON.stringify(activeCats));
      } catch (e) {}
    } else if (categories.length === 0) {
      storefrontApi
        .categories()
        .then((data) => {
          if (Array.isArray(data)) {
            const activeCats = sortCategoriesBySequence(
              data.filter((c) => c.is_active !== false)
            );
            setCategories(activeCats);
            try {
              localStorage.setItem("hd_navbar_categories", JSON.stringify(activeCats));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }
  }, [contextCategories, homeData]);

  // Horizontal scroll arrows detection
  const updateScrollArrows = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const hasOverflow = maxScroll > 2;

    setIsOverflowing(hasOverflow);
    setCanScrollLeft(hasOverflow && scrollLeft > 2);
    setCanScrollRight(hasOverflow && scrollLeft < maxScroll - 2);
  }, []);

  const handleNavScroll = (direction) => {
    const el = navScrollRef.current;
    if (!el) return;
    setOpenDesktopMenu(null);
    setDropdownCoords(null);
    const scrollStep = Math.max(180, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({
      left: direction === "right" ? scrollStep : -scrollStep,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    updateScrollArrows();
    const t = setTimeout(updateScrollArrows, 120);
    return () => clearTimeout(t);
  }, [categories, updateScrollArrows]);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      updateScrollArrows();
    });
    ro.observe(el);
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }
    return () => ro.disconnect();
  }, [updateScrollArrows]);

  useEffect(() => {
    window.addEventListener("resize", updateScrollArrows);
    return () => window.removeEventListener("resize", updateScrollArrows);
  }, [updateScrollArrows]);

  // Sticky navbar shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 40;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const location = useLocation();

  // Active navigation key computed dynamically
  const activeNav = useMemo(() => {
    if (location.pathname === "/") return "home";
    if (location.pathname === "/best-sellers" || location.pathname === "/best-seller") return "best-sellers";
    if (location.pathname === "/new-arrivals" || location.pathname === "/new-arrival") return "new-arrivals";

    const pathWithoutSlash = location.pathname.replace(/^\//, "").toLowerCase();
    let currentCat = null;
    let currentCol = null;

    if (location.pathname === "/collection") {
      const sp = new URLSearchParams(location.search);
      currentCat = sp.get("category")?.toLowerCase();
      currentCol = sp.get("collection")?.toLowerCase();
    } else if (location.pathname.startsWith("/categories/")) {
      const parts = location.pathname.split("/").filter(Boolean);
      currentCat = parts[1]?.toLowerCase();
    } else {
      currentCat = pathWithoutSlash;
    }

    if (currentCol === "best-sellers" || currentCol === "best-seller") return "best-sellers";
    if (currentCol === "new-arrivals" || currentCol === "new-arrival") return "new-arrivals";

    if (currentCat) {
      if (currentCat === "men") return "mens";
      if (currentCat === "woman") return "women";
      return currentCat;
    }

    return null;
  }, [location.pathname, location.search]);

  const closeAllMenus = useCallback(() => {
    setOpenDesktopMenu(null);
    setDropdownCoords(null);
    setUserDropdownOpen(false);
  }, []);

  const openDesktopMenuFor = useCallback((slug) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const el = itemRefs.current[slug];
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2
      });
    }
    setOpenDesktopMenu(slug);
  }, []);

  const cancelClose = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const closeWithDelay = useCallback((delay = 160) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDesktopMenu(null);
      setDropdownCoords(null);
    }, delay);
  }, []);

  // Also keep a click toggle for accessibility (keyboard users)
  const toggleDesktopMenu = useCallback((slug) => {
    if (openDesktopMenu === slug) {
      setOpenDesktopMenu(null);
      setDropdownCoords(null);
    } else {
      openDesktopMenuFor(slug);
    }
  }, [openDesktopMenu, openDesktopMenuFor]);

  const activeMenuCategory = useMemo(() => {
    if (!openDesktopMenu) return null;
    return categories.find((c) => c.slug === openDesktopMenu) || null;
  }, [openDesktopMenu, categories]);

  // Close menus on outside click
  useEffect(() => {
    if (!openDesktopMenu && !userDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      if (desktopNavRef.current && desktopNavRef.current.contains(e.target)) return;
      closeAllMenus();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDesktopMenu, userDropdownOpen, closeAllMenus]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        closeAllMenus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeAllMenus]);

  // Close menus on window scroll
  useEffect(() => {
    if (!openDesktopMenu) return;
    const handleScrollOrResize = () => {
      closeAllMenus();
    };
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [openDesktopMenu, closeAllMenus]);

  // Close menus & drawer on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    closeAllMenus();
  }, [location.pathname, location.search, closeAllMenus]);

  // Automatically close mobile menu if window resizes to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setMobileMenuOpen(false);
      } else {
        closeAllMenus();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeAllMenus]);

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="site-header">
        <TopAnnouncementBar />
        <nav className={`main-navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
          <div className="container navbar-inner" ref={desktopNavRef}>
            <button
              className={`hamburger-btn ${mobileMenuOpen ? "active" : ""}`}
              onClick={() => {
                setMobileMenuOpen((prev) => !prev);
                closeAllMenus();
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            <Link to="/" className="brand-logo" onClick={closeAllMenus} aria-label="HooDee Daddy home">
              <img
                src={process.env.PUBLIC_URL + "/images/hoodee-daddy-logo.svg"}
                alt="HooDee Daddy"
                className="brand-logo-img"
                width="943"
                height="733"
              />
            </Link>

            {/* Desktop Navbar with Smooth Scroll Track and Overflow Arrows */}
            <div className="nav-links-scroll-wrapper">
              {canScrollLeft && (
                <button
                  type="button"
                  className="nav-scroll-arrow nav-scroll-arrow-left"
                  onClick={() => handleNavScroll("left")}
                  aria-label="Scroll navbar left"
                  title="Scroll left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              )}

              <div
                className={`nav-links-scroll-track ${isOverflowing ? "is-overflowing" : ""}`}
                ref={navScrollRef}
                onScroll={updateScrollArrows}
              >
                <ul className="nav-links">
                  {/* 1. Dynamic Categories */}
                  {categories.map((cat) => {
                    const isCatActive = isCategoryMatching(cat.slug, activeNav);

                    return (
                      <li
                        key={cat.id || cat.slug}
                        className="nav-item"
                        ref={(el) => {
                          if (el) itemRefs.current[cat.slug] = el;
                        }}
                      >
                        <Link
                          to={`/categories/${encodeURIComponent(cat.slug)}`}
                          className={"nav-link" + (isCatActive ? " active" : "")}
                          onClick={() => {
                            closeAllMenus();
                          }}
                        >
                          <span>{cat.name}</span>
                        </Link>
                      </li>
                    );
                  })}

                  {/* 2. Static Item: New Arrivals */}
                  <li key="static-new-arrivals">
                    <Link
                      to="/collection?collection=new-arrivals"
                      className={"nav-link nav-link-new-arrival" + (activeNav === "new-arrivals" ? " active" : "")}
                      onClick={closeAllMenus}
                    >
                      <span className="nav-arrival-dot" aria-hidden="true" />
                      <span className="nav-arrival-text">New Arrivals</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {canScrollRight && (
                <button
                  type="button"
                  className="nav-scroll-arrow nav-scroll-arrow-right"
                  onClick={() => handleNavScroll("right")}
                  aria-label="Scroll navbar right"
                  title="Scroll right"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              )}
            </div>

            <div className="nav-actions">
              <button
                className="action-btn"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search Catalog"
                title="Search Catalog"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              <div style={{ position: "relative" }}>
                <button
                  className="action-btn"
                  onClick={() => {
                    if (customerUser) {
                      setUserDropdownOpen((prev) => !prev);
                    } else {
                      setAuthModalState("login");
                    }
                  }}
                  aria-label={customerUser ? `Account: ${customerUser.name}` : "Account Login"}
                  title={customerUser ? `Logged in as ${customerUser.name}` : "Customer Login / Register"}
                >
                  {customerUser ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "var(--color-accent, var(--brand-white))",
                        color: "var(--brand-blue)",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                </button>

                {customerUser && userDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 8,
                      background: "var(--color-white, var(--brand-white))",
                      border: "1px solid var(--color-grey-200, var(--brand-border))",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px rgba(9, 21, 37, 0.12)",
                      width: 220,
                      padding: "14px",
                      zIndex: 100,
                      textAlign: "left"
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink, var(--brand-blue))" }}>
                      {customerUser.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-grey-600, var(--brand-blue))", marginBottom: 10, wordBreak: "break-all" }}>
                      {customerUser.email}
                    </div>
                    <div style={{ borderTop: "1px solid var(--color-grey-100, var(--brand-border))", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      <Link
                        to="/account"
                        style={{ textDecoration: "none", fontSize: 12, textAlign: "left", cursor: "pointer", padding: "4px 0", color: "var(--color-ink, var(--brand-blue))", fontWeight: 600, display: "block" }}
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        📦 My Account & Orders
                      </Link>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", fontSize: 12, textAlign: "left", cursor: "pointer", padding: "4px 0", color: "var(--color-ink, var(--brand-blue))" }}
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsOrderTrackOpen(true);
                        }}
                      >
                        Track My Order
                      </button>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", fontSize: 12, textAlign: "left", cursor: "pointer", padding: "4px 0", color: "var(--brand-blue)", fontWeight: 600 }}
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logoutCustomer();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/wishlist"
                className="action-btn wishlist-nav-link"
                aria-label={`View Wishlist (${wishlistCount} items)`}
                title="Wishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {wishlistCount > 0 && (
                  <span className="badge-count">{wishlistCount}</span>
                )}
              </Link>

              <Link
                to="/cart"
                className="action-btn cart-btn"
                aria-label={`Shopping Bag (${cartItemCount} items)`}
                title="View Cart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span className="badge-count">{cartItemCount}</span>
                )}
              </Link>
            </div>
          </div>
        </nav>



        {/* Mobile Slide-Out Menu Drawer */}
        <div
          className={`drawer-backdrop ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          aria-hidden={!mobileMenuOpen}
          className={`mobile-nav-drawer ${mobileMenuOpen ? "open" : ""}`}
        >
          <div className="mobile-nav-header">
            <Link
              to="/"
              className="mobile-brand-logo"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="HooDee Daddy home"
            >
              <img
                src={process.env.PUBLIC_URL + "/images/hoodee-daddy-logo.svg"}
                alt="HooDee Daddy"
                className="mobile-brand-logo-img"
                width="120"
                height="38"
              />
            </Link>
            <button
              className="drawer-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <ul className="mobile-nav-list">
            {/* 1. Dynamic Categories */}
            {categories.map((cat) => {
              const isCatActive = isCategoryMatching(cat.slug, activeNav);

              return (
                <li key={cat.id || cat.slug}>
                  <Link
                    to={`/categories/${encodeURIComponent(cat.slug)}`}
                    className={isCatActive ? "mobile-nav-active" : ""}
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}

            {/* 2. Static New Arrivals */}
            <li>
              <Link
                to="/collection?collection=new-arrivals"
                className={activeNav === "new-arrivals" ? "mobile-nav-active" : ""}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-arrival-dot" aria-hidden="true" style={{ display: "inline-block", marginRight: "8px" }} />
                <span className="nav-arrival-text">New Arrivals</span>
              </Link>
            </li>

            {/* Wishlist */}
            <li>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
              >
                Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
              </Link>
            </li>
          </ul>

          <div className="mobile-nav-footer">
            {customerUser ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 8 }}>
                  Signed in as <strong>{customerUser.name}</strong>
                </div>
                <Link
                  to="/account"
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%", marginBottom: "8px", display: "block", textAlign: "center", textDecoration: "none" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📦 My Account & Orders
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%", marginBottom: "8px" }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logoutCustomer();
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: "100%", marginBottom: "8px" }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalState("login");
                }}
              >
                Sign In / Register
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: "100%" }}
              onClick={() => {
                setMobileMenuOpen(false);
                setIsOrderTrackOpen(true);
              }}
            >
              Track My Order
            </button>
          </div>
        </div>
      </header>
      <div className="site-header-spacer" aria-hidden="true" />
    </>
  );
}
