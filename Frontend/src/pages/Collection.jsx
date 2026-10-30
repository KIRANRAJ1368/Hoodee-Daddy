import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation, Link, useParams } from "react-router-dom";
import SeoHead from "../components/Seo/SeoHead";
import { buildCategorySchema, buildBreadcrumbSchema } from "../utils/seoSchemas";
import { useShop } from "../context/ShopContext";
import { isCategoryMatch, resolveFallbackCategory, saveCategoryHistory } from "../utils/categoryFallback";
import ProductCard from "../components/ProductCard/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed/RecentlyViewed";
import { CURRENCY_SYMBOL, formatINRNumber, formatPrice } from "../utils/formatPrice";
import { imageUrl } from "../utils/imageUrl";

const SHIPPING_LABEL = "Pan-India Express Shipping";
import "./Collection.css";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "relevant", label: "Most relevant" },
  { value: "best-selling", label: "Best selling" },
  { value: "alpha-asc", label: "Alphabetically, A-Z" },
  { value: "alpha-desc", label: "Alphabetically, Z-A" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "date-asc", label: "Date, old to new" },
  { value: "date-desc", label: "Date, new to old" }
];


const INITIAL_PAGE_SIZE = 12;

const CATEGORY_ALIASES = { men: "mens" };

/** Lowercase and strip punctuation so a slug and its display name compare equal. */
const normalizeToken = (value) => (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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
    case "heart":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "star":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--brand-blue)" stroke="var(--brand-blue)" strokeWidth="1" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    default:
      return null;
  }
}

const BANNER_CONFIG = {
  mens: {
    categoryName: "Men",
    badge: "★ PREMIUM MEN'S APPAREL · SEASON 2026",
    badgeIcon: "sparkle",
    subBadge: "Season 2026",
    offer: "FLAT 25% OFF · AUTO-APPLIED",
    offerTag: "AUTO-APPLIED AT CHECKOUT",
    title: "MEN'S COLLECTION",
    subtitle: "Heavyweight pure combed cotton essentials, oversized streetwear drops, and modern cuts.",
    perks: [
      { icon: "shield", label: "280 GSM Heavyweight" },
      { icon: "star", label: "4.9★ Customer Rating" },
      { icon: "tag", label: "100% Combed Cotton" }
    ],
    ctaText: "Shop Men's",
    urgencyTag: "✨ Fresh Drop",
    image: "/images/crazymonk-cat-mens.jpg",
    imagePosition: "center top"
  },
  women: {
    categoryName: "Women",
    badge: "★ CONTEMPORARY WOMEN'S WEAR · SEASON 2026",
    badgeIcon: "sparkle",
    subBadge: "Season 2026",
    offer: "FLAT 25% OFF · AUTO-APPLIED",
    offerTag: "AUTO-APPLIED AT CHECKOUT",
    title: "WOMEN'S COLLECTION",
    subtitle: "Chic relaxed drop-shoulder fits, ultra-breathable pure combed cotton, and modern minimalist artwork.",
    perks: [
      { icon: "sparkle", label: "Artistic Minimalist Prints" },
      { icon: "star", label: "4.9★ Customer Rating" },
      { icon: "tag", label: "100% Combed Cotton" }
    ],
    ctaText: "Shop Women's",
    urgencyTag: "✨ Fresh Drop",
    image: "/images/crazymonk-cat-womens.jpg",
    imagePosition: "center top"
  },
  boys: {
    categoryName: "Boys",
    badge: "⚡ PLAYFUL DROPS · SEASON 2026",
    badgeIcon: "bolt",
    subBadge: "Season 2026",
    offer: "STARTING AT ₹599 · FREE SHIPPING",
    offerTag: "PREMIUM STREETWEAR",
    title: "BOYS' COLLECTION",
    subtitle: "High-energy graphic streetwear hoodies, durable reinforced seams, and super-soft bio-washed cotton.",
    perks: [
      { icon: "shield", label: "Reinforced Durability" },
      { icon: "star", label: "4.8★ Parent Approved" },
      { icon: "truck", label: SHIPPING_LABEL }
    ],
    ctaText: "Shop Boys'",
    urgencyTag: "⚡ Selling Out Fast",
    image: "/images/banner-boys.jpg",
    imagePosition: "center top"
  },
  girls: {
    categoryName: "Girls",
    badge: "★ SWEET & TRENDY · SEASON 2026",
    badgeIcon: "sparkle",
    subBadge: "Season 2026",
    offer: "FLAT 20% OFF · AUTO-APPLIED",
    offerTag: "AUTO-APPLIED AT CHECKOUT",
    title: "GIRLS' COLLECTION",
    subtitle: "Cheerful graphic sweatshirts, soft high-necks, trendy matching sets, and gentle skin-friendly organic cotton.",
    perks: [
      { icon: "heart", label: "Ultra-Gentle on Skin" },
      { icon: "star", label: "4.9★ Customer Rating" },
      { icon: "tag", label: "100% Pure Cotton" }
    ],
    ctaText: "Shop Girls'",
    urgencyTag: "✨ Fresh Drop",
    image: "/images/banner-girls.jpg",
    imagePosition: "center top"
  },
  babies: {
    categoryName: "Babies",
    badge: "♥ TINY & SOFT · 100% BABY-SAFE",
    badgeIcon: "heart",
    subBadge: "100% Baby-Safe",
    offer: "STARTING AT ₹449 · HYPOALLERGENIC",
    offerTag: "HYPOALLERGENIC COTTON",
    title: "BABIES' COLLECTION",
    subtitle: "Cozy ribbed rompers, buttery-soft pyjamas, and stretch bottoms crafted in pure hypoallergenic organic cotton.",
    perks: [
      { icon: "heart", label: "Hypoallergenic Pure Cotton" },
      { icon: "shield", label: "Zero Harsh Chemicals" },
      { icon: "tag", label: "Easy Snap Fastening" }
    ],
    ctaText: "Shop Babies'",
    urgencyTag: "🍼 Gentle Care",
    image: "/images/banner-babies.jpg",
    imagePosition: "center top"
  },
  "best-sellers": {
    categoryName: "Best Sellers",
    badge: "Top Rated",
    badgeIcon: "star",
    subBadge: "Community Favourites",
    offer: "BEST SELLERS",
    offerTag: "4.9★ HIGHLY RATED",
    title: "The Ones Everyone's Talking About.",
    subtitle: "Curated from real reviews, real wears, and verified bestselling data across our catalogue.",
    perks: [
      { icon: "star", label: "4.9★ Verified Reviews" },
      { icon: "bolt", label: "Fast Express Dispatch" },
      { icon: "shield", label: "Guaranteed Satisfaction" }
    ],
    ctaText: "Shop Best Sellers",
    image: "/images/crazymonk-hero-hoodies.jpg",
    imagePosition: "center top"
  },
  "new-arrivals": {
    categoryName: "New Arrivals",
    badge: "Fresh Drop",
    badgeIcon: "sparkle",
    subBadge: "Season 2026",
    offer: "NEW ARRIVALS",
    offerTag: "JUST LANDED IN STORE",
    title: "New Season, New Drops.",
    subtitle: "First to the edit — our newest limited-run streetwear styles, fresh off the printing press.",
    perks: [
      { icon: "sparkle", label: "Limited Run Quantities" },
      { icon: "tag", label: "Modern Street Silhouettes" },
      { icon: "truck", label: "Fast Track Delivery" }
    ],
    ctaText: "Shop New Arrivals",
    image: "/images/crazymonk-hero-oversized.jpg",
    imagePosition: "center top"
  },
  default: {
    categoryName: "Collection",
    badge: "HooDee Daddy Wardrobe",
    badgeIcon: "bolt",
    subBadge: "All Collections",
    offer: "ALL STYLES",
    offerTag: "EVERY STYLE UNDER ONE ROOF",
    title: "One Store, Every Style.",
    subtitle: "Explore our unified catalogue of premium wardrobe essentials.",
    perks: [
      { icon: "truck", label: SHIPPING_LABEL },
      { icon: "shield", label: "7-Day Easy Returns" },
      { icon: "tag", label: "100% Quality Checked" }
    ],
    ctaText: "Shop Collection",
    image: "/images/dept-family-banner.jpg",
    imagePosition: "center top"
  }
};

function GridIcon({ columns }) {
  const configs = {
    2: { rects: [0, 12], w: 8 },
    3: { rects: [0, 8, 16], w: 5 },
    4: { rects: [0, 6, 12, 18], w: 3.5 },
  };
  const { rects, w } = configs[columns];
  return (
    <svg className="coll-grid-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="icon-inactive">
        {rects.map((x, i) => (
          <rect key={i} x={x + 1} y="3" width={w} height="18" rx="1.5" fill="var(--brand-blue)" />
        ))}
      </g>
      <g className="icon-active">
        {rects.map((x, i) => (
          <rect key={i} x={x + 1} y="3" width={w} height="18" rx="1.5" fill="var(--brand-blue)" />
        ))}
      </g>
    </svg>
  );
}

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { allProducts, homeData, storefrontStatus, seoSettings, refreshHomeData } = useShop();
  const { categorySlug } = useParams();
  const catalog = allProducts || [];

  useEffect(() => {
    if (typeof refreshHomeData === "function") {
      refreshHomeData();
    }
  }, [refreshHomeData]);

  const priceCeiling = useMemo(
    () => Math.ceil(catalog.reduce((max, p) => Math.max(max, Number(p.price) || 0), 1) / 100) * 100,
    [catalog]
  );

  const rawCategoryParam = (categorySlug || searchParams.get("category") || "all").toLowerCase();
  const categoryParam = CATEGORY_ALIASES[rawCategoryParam] || rawCategoryParam;
  const collectionParam = (searchParams.get("collection") || "all").toLowerCase();
  const typeParam = (searchParams.get("type") || "all").toLowerCase();
  const searchParam = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();
  const colorParam = searchParams.getAll("color");
  const sizeParam = searchParams.getAll("size");
  const availabilityParam = searchParams.get("availability") || "all";
  const [minPrice, setMinPrice] = useState(() => (searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0));
  const [maxPrice, setMaxPrice] = useState(() => (searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : priceCeiling));
  const hasUserCustomizedPriceRef = useRef(Boolean(searchParams.get("minPrice") || searchParams.get("maxPrice")));
  const sortParam = searchParams.get("sort") || (collectionParam === "best-sellers" ? "best-selling" : collectionParam === "new-arrivals" ? "newest" : "featured");

  // Keep maxPrice in sync with priceCeiling when catalog loads, unless user adjusted price
  useEffect(() => {
    if (!hasUserCustomizedPriceRef.current || maxPrice === 0 || maxPrice > priceCeiling) {
      setMaxPrice(priceCeiling);
    }
  }, [priceCeiling]);

  // Sync URL search params minPrice / maxPrice to state
  useEffect(() => {
    if (searchParams.has("minPrice")) {
      setMinPrice(Number(searchParams.get("minPrice")) || 0);
      hasUserCustomizedPriceRef.current = true;
    }
    if (searchParams.has("maxPrice")) {
      setMaxPrice(Number(searchParams.get("maxPrice")) || priceCeiling);
      hasUserCustomizedPriceRef.current = true;
    }
  }, [searchParams, priceCeiling]);

  // Reset price filters when switching category, collection, or subcategory unless specified in URL
  useEffect(() => {
    if (!searchParams.has("minPrice") && !searchParams.has("maxPrice")) {
      hasUserCustomizedPriceRef.current = false;
      setMinPrice(0);
      setMaxPrice(priceCeiling);
    }
  }, [categoryParam, collectionParam, typeParam, searchParams, priceCeiling]);

  const [openSections, setOpenSections] = useState({ price: true, color: true, size: true, availability: true });
  const [showAllColors, setShowAllColors] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

    const baseUrl = (seoSettings?.canonical_base_url || "https://hoodeedaddy.com").replace(/\/+$/, "");

  const homeCategories = useMemo(() => {
    const cats = homeData?.categories || [];
    if (cats.length > 0) {
      saveCategoryHistory(cats);
    }
    return cats;
  }, [homeData]);

  const currentCategoryKey = categoryParam === "all" ? "all" : categoryParam;
  const matchedCategory = useMemo(() => {
    if (!homeCategories || homeCategories.length === 0) return null;
    return homeCategories.find((c) => isCategoryMatch(c.slug, currentCategoryKey));
  }, [homeCategories, currentCategoryKey]);

  const matchedCatObj = matchedCategory;

  const isInvalidCategory = Boolean(
    collectionParam === "all" &&
    categoryParam !== "all" &&
    homeCategories.length > 0 &&
    !matchedCategory
  );

  useEffect(() => {
    if (isInvalidCategory) {
      const fallbackCat = resolveFallbackCategory(categoryParam, homeCategories);
      if (fallbackCat && fallbackCat.slug) {
        const targetSlug = fallbackCat.slug === "men" ? "mens" : fallbackCat.slug;
        const search = location.search ? location.search : "";
        if (categorySlug) {
          navigate(`/categories/${targetSlug}${search}`, { replace: true });
        } else {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("category", targetSlug);
          navigate(`/collection?${nextParams.toString()}`, { replace: true });
        }
      }
    }
  }, [isInvalidCategory, categoryParam, homeCategories, categorySlug, location.search, searchParams, navigate]);

  const categoryName = useMemo(() => {
    if (collectionParam === "best-sellers") return "Best Sellers";
    if (collectionParam === "new-arrivals") return "New Arrivals";
    if (matchedCatObj?.name) return matchedCatObj.name;
    if (categoryParam === "all") return "All Collections";
    return categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
  }, [collectionParam, matchedCatObj, categoryParam]);

  const seoTitle = useMemo(() => {
    if (matchedCatObj?.meta_title) return matchedCatObj.meta_title;
    if (collectionParam === "best-sellers") return "Best Sellers — Most Popular Streetwear Drops | HooDee Daddy";
    if (collectionParam === "new-arrivals") return "New Arrivals — Fresh Drops & Limited Editions | HooDee Daddy";
    if (categoryParam !== "all" && seoSettings?.category_title_format) {
      return seoSettings.category_title_format.replace("{name}", categoryName);
    }
    return `${categoryName} Collection — Luxury Apparel | HooDee Daddy`;
  }, [matchedCatObj, collectionParam, categoryParam, seoSettings, categoryName]);

  const seoDescription = useMemo(() => {
    if (matchedCatObj?.meta_description) return matchedCatObj.meta_description;
    if (categoryParam !== "all" && seoSettings?.category_description_format) {
      return seoSettings.category_description_format.replace("{name}", categoryName);
    }
    return `Explore our premium ${categoryName.toLowerCase()} collection at HooDee Daddy. Handcrafted natural fibres, relaxed street fits, and nationwide express shipping.`;
  }, [matchedCatObj, categoryParam, seoSettings, categoryName]);

  const canonicalPath = categoryParam !== "all" ? `/categories/${categoryParam}` : "/collection";

  const collectionSchemas = useMemo(() => {
    const catSchema = buildCategorySchema(categoryName, categoryParam, catalog, baseUrl);
    const breadcrumb = buildBreadcrumbSchema(
      [
        { name: "Home", path: "/" },
        { name: `${categoryName} Collection`, path: canonicalPath }
      ],
      baseUrl
    );
    return [catSchema, breadcrumb];
  }, [categoryName, categoryParam, catalog, baseUrl, canonicalPath]);

  const currentSortOption = useMemo(() => {
    return SORT_OPTIONS.find((opt) => opt.value === sortParam) || SORT_OPTIONS[0];
  }, [sortParam]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileDrawerOpen]);

  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [searchParams]);

  const activeCategoryLabel = matchedCategory
    ? matchedCategory.name
    : currentCategoryKey === "all"
    ? "All Products"
    : currentCategoryKey.charAt(0).toUpperCase() + currentCategoryKey.slice(1);

  const bannerKey = collectionParam !== "all" ? collectionParam : categoryParam !== "all" ? categoryParam : "default";

  const possibleBannerKeys = useMemo(() => {
    if (collectionParam !== "all") return [collectionParam];
    if (categoryParam !== "all") {
      const keys = [
        categoryParam,
        matchedCategory?.slug,
        categoryParam === "mens" ? "men" : categoryParam === "men" ? "mens" : null,
        categoryParam === "women" ? "womens" : categoryParam === "womens" ? "women" : null
      ].filter(Boolean);
      return [...new Set(keys)];
    }
    return ["default"];
  }, [collectionParam, categoryParam, matchedCategory]);

  const managedBanner = useMemo(() => {
    if (!homeData?.banners) return null;
    for (const key of possibleBannerKeys) {
      const list = homeData.banners[key];
      if (Array.isArray(list) && list.length > 0) {
        return list[0];
      }
    }
    return null;
  }, [homeData, possibleBannerKeys]);

  const dynamicCategoryBanner = useMemo(() => {
    if (!matchedCategory) return null;
    const catName = matchedCategory.name;
    const catUpper = catName.toUpperCase();
    const catLower = catName.toLowerCase();
    return {
      categoryName: catName,
      badge: "New Arrivals",
      badgeIcon: "sparkle",
      subBadge: "",
      offer: `${catUpper} STYLES`,
      offerTag: "",
      title: `${catUpper} COLLECTION`,
      subtitle: matchedCategory.description || `Explore our premium ${catLower} essentials crafted for elevated comfort and everyday style.`,
      perks: [
        { icon: "truck", label: SHIPPING_LABEL },
        { icon: "refresh", label: "7-Day Easy Returns" },
        { icon: "shield", label: "100% Quality Checked" }
      ],
      ctaText: `Shop ${catName}`,
      urgencyTag: "",
      image: imageUrl(matchedCategory.banner_image_url) || "/images/dept-family-banner.jpg",
      imagePosition: matchedCategory.banner_image_position && matchedCategory.banner_image_position !== "center center"
        ? matchedCategory.banner_image_position
        : "center top"
    };
  }, [matchedCategory]);

  const resolvedCategoryBanner = useMemo(() => {
    if (managedBanner) return managedBanner;
    if (matchedCategory?.banner_image_url || matchedCategory?.banner_title) {
      return {
        title: matchedCategory.banner_title,
        subtitle: matchedCategory.banner_subtitle || matchedCategory.description,
        tag: matchedCategory.banner_tag,
        badge_promo: matchedCategory.banner_badge_promo,
        image_url: matchedCategory.banner_image_url,
        image_position: matchedCategory.banner_image_position && matchedCategory.banner_image_position !== "center center"
          ? matchedCategory.banner_image_position
          : "center top",
        primary_cta_text: matchedCategory.banner_primary_cta_text,
        primary_cta_link: matchedCategory.banner_primary_cta_link || `/collection?category=${encodeURIComponent(matchedCategory.slug)}`,
        secondary_cta_text: matchedCategory.banner_secondary_cta_text
      };
    }
    return null;
  }, [managedBanner, matchedCategory]);

  const rawConfig = BANNER_CONFIG[bannerKey] || dynamicCategoryBanner || BANNER_CONFIG.default;
  const config = {
    ...rawConfig,
    categoryName: matchedCategory?.name || rawConfig.categoryName,
    subtitle: matchedCategory?.description || rawConfig.subtitle
  };

  // "Starting at" claims are generated from the real Admin catalog so a banner
  // can never advertise an amount the storefront does not actually charge.
  const categoryMinPrice = useMemo(() => {
    const slugs = [bannerKey, bannerKey === "men" ? "mens" : bannerKey === "woman" ? "women" : bannerKey]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    const scoped = catalog.filter((p) => slugs.includes(String(p?.category ?? "").toLowerCase()));
    const source = scoped.length ? scoped : catalog;
    const prices = source.map((p) => Number(p?.price)).filter((n) => Number.isFinite(n) && n > 0);
    return prices.length ? formatPrice(Math.min(...prices)) : "";
  }, [bannerKey, catalog]);
  const applyMinPrice = (text) => (text || "").replace(/\{\{MIN_PRICE\}\}/g, categoryMinPrice);

  const banner = useMemo(() => {
    if (resolvedCategoryBanner) {
      const promo = resolvedCategoryBanner.badge_promo?.trim() || "";
      const tag = resolvedCategoryBanner.tag?.trim() || config.badge || "HooDee Daddy";
      const title = resolvedCategoryBanner.title?.trim() || config.title || `${activeCategoryLabel.toUpperCase()} COLLECTION`;
      const subtitle = resolvedCategoryBanner.subtitle?.trim() || config.subtitle || "";
      const offer = promo || title;
      const headline = (promo && promo.toLowerCase() === title.toLowerCase()) ? (tag || "Special Edition") : title;
      const offerTag = resolvedCategoryBanner.secondary_cta_text && resolvedCategoryBanner.secondary_cta_text.toLowerCase() !== tag.toLowerCase()
        ? resolvedCategoryBanner.secondary_cta_text
        : "";
      const urgencyTag = resolvedCategoryBanner.secondary_cta_text
        ? (resolvedCategoryBanner.secondary_cta_text.includes("Fast")
            ? `⚡ ${resolvedCategoryBanner.secondary_cta_text}`
            : resolvedCategoryBanner.secondary_cta_text.includes("Stock")
            ? `🔥 ${resolvedCategoryBanner.secondary_cta_text}`
            : `✨ ${resolvedCategoryBanner.secondary_cta_text}`)
        : (config.urgencyTag || "");

      return {
        ...config,
        badge: tag,
        badgeIcon: config.badgeIcon || "bolt",
        subBadge: "",
        offer: applyMinPrice(offer),
        offerTag: applyMinPrice(offerTag),
        title: headline,
        subtitle: subtitle,
        image: imageUrl(resolvedCategoryBanner.image_url) || config.image,
        imagePosition: (resolvedCategoryBanner.image_position && resolvedCategoryBanner.image_position !== "center center")
          ? resolvedCategoryBanner.image_position
          : (config.imagePosition || "center top"),
        ctaText: resolvedCategoryBanner.primary_cta_text?.trim() || config.ctaText || "Shop Now",
        ctaLink: null,
        urgencyTag,
        perks: [
          { icon: "truck", label: SHIPPING_LABEL },
          { icon: "refresh", label: "7-Day Easy Returns" },
          { icon: "shield", label: "100% Quality Checked" }
        ]
      };
    }

    return {
      ...config,
      subBadge: "",
      offer: applyMinPrice(config.offer),
      offerTag: applyMinPrice(config.offerTag),
      ctaText: config.ctaText || "Shop Now",
      ctaLink: null
    };
  }, [resolvedCategoryBanner, config, activeCategoryLabel, categoryMinPrice]);

  const scrollToProducts = useCallback(() => {
    const catalogEl = document.getElementById("collection-catalog");
    if (catalogEl) {
      const navEl = document.querySelector(".site-header");
      const navHeight = navEl ? navEl.offsetHeight : 76;
      const targetY = Math.max(0, catalogEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 12);
      window.scrollTo({
        top: targetY,
        behavior: "smooth"
      });
    }
  }, []);

  const handleBannerCtaClick = useCallback((e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const rawLink = banner.ctaLink ? String(banner.ctaLink).trim() : "";
    if (rawLink && !rawLink.startsWith("#")) {
      const currentCat = categoryParam;
      let isDifferent = false;
      try {
        const url = new URL(rawLink, window.location.origin);
        const targetCategory = (url.searchParams.get("category") || "").toLowerCase();
        const targetPath = url.pathname.toLowerCase();

        if (targetCategory && targetCategory !== currentCat && targetCategory !== CATEGORY_ALIASES[currentCat]) {
          isDifferent = true;
        } else if (targetPath.startsWith("/categories/")) {
          const slugInPath = targetPath.replace("/categories/", "").split("/")[0].toLowerCase();
          if (slugInPath && slugInPath !== currentCat && slugInPath !== CATEGORY_ALIASES[currentCat]) {
            isDifferent = true;
          }
        } else if (targetPath !== "/collection" && targetPath !== location.pathname.toLowerCase()) {
          isDifferent = true;
        }
      } catch (err) {
        // Fallback to in-page scroll
      }

      if (isDifferent) {
        const dest = rawLink.includes("#") ? rawLink : `${rawLink}#collection-catalog`;
        navigate(dest);
        return;
      }
    }

    scrollToProducts();
  }, [banner.ctaLink, categoryParam, location.pathname, navigate, scrollToProducts]);

  useEffect(() => {
    if (location.hash === "#collection-catalog") {
      const timer = setTimeout(() => {
        scrollToProducts();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.search, location.hash, scrollToProducts]);

  const isSubcategoryView = false;
  const isBannerlessCollection = collectionParam === "best-sellers" || collectionParam === "new-arrivals";
  const isSearchListing = Boolean(searchParam);
  const isBannerlessListing = isBannerlessCollection || isSearchListing;

  const activeSubcategory = null;
  const matchesActiveSubcategory = () => true;

  const updateParams = (updates) => {
    let hasUrlChange = false;
    if (updates.minPrice !== undefined) {
      hasUserCustomizedPriceRef.current = updates.minPrice !== null && updates.minPrice > 0;
      setMinPrice(updates.minPrice === null ? 0 : Math.max(0, Number(updates.minPrice)));
    }
    if (updates.maxPrice !== undefined) {
      hasUserCustomizedPriceRef.current = updates.maxPrice !== null && updates.maxPrice < priceCeiling;
      setMaxPrice(updates.maxPrice === null ? priceCeiling : Math.min(priceCeiling, Number(updates.maxPrice)));
    }
    const next = new URLSearchParams(searchParams);
    if (next.has("minPrice")) {
      next.delete("minPrice");
      hasUrlChange = true;
    }
    if (next.has("maxPrice")) {
      next.delete("maxPrice");
      hasUrlChange = true;
    }
    Object.entries(updates).forEach(([key, val]) => {
      if (key === "minPrice" || key === "maxPrice") return;
      hasUrlChange = true;
      if (val === null || val === undefined || val === "" || val === "all") {
        next.delete(key);
      } else if (Array.isArray(val)) {
        next.delete(key);
        val.forEach((item) => { if (item) next.append(key, item); });
      } else {
        next.set(key, val);
      }
    });
    if (hasUrlChange) {
      setSearchParams(next, { preventScrollReset: true });
    }
  };

  const toggleArrayParam = (key, item) => {
    const current = searchParams.getAll(key);
    const updated = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
    updateParams({ [key]: updated });
  };

  const clearAllFilters = () => {
    hasUserCustomizedPriceRef.current = false;
    setMinPrice(0);
    setMaxPrice(priceCeiling);
    const next = new URLSearchParams();
    if (categoryParam !== "all") next.set("category", categoryParam);
    if (collectionParam !== "all") next.set("collection", collectionParam);
    if (typeParam !== "all") next.set("type", typeParam);
    setSearchParams(next);
  };
  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const matchesCategory = (p) => {
    if (searchParam) {
      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pDesc = (p.description || "").toLowerCase();
      const pSku = (p.sku || "").toLowerCase();
      const pColors = (p.colors || p.color || []).map((c) => (c.name || "").toLowerCase()).join(" ");
      const searchMatches =
        pName.includes(searchParam) ||
        pCat.includes(searchParam) ||
        pDesc.includes(searchParam) ||
        pSku.includes(searchParam) ||
        pColors.includes(searchParam);
      if (!searchMatches) return false;
    }
    if (categoryParam === "all") return true;
    const pCat = String(p.category || "").toLowerCase();
    if (isCategoryMatch(pCat, categoryParam)) return true;
    return false;
  };

  const baseCategoryProducts = useMemo(() => {
    return catalog.filter((p) => matchesCategory(p));
  }, [catalog, categoryParam, searchParam, typeParam]);

  const availableColors = useMemo(() => {
    const map = new Map();
    baseCategoryProducts.forEach((p) => {
      // Collect unique colors for THIS product
      const productColors = new Map();
      (p.colors || p.color || []).forEach((c) => {
        const name = (c?.name || c || "").trim();
        if (name && !productColors.has(name.toLowerCase())) {
          productColors.set(name.toLowerCase(), { name, hex: c.hex || "#ccc" });
        }
      });
      (p.variants || []).forEach((v) => {
        const name = (v?.color || "").trim();
        if (name && !productColors.has(name.toLowerCase())) {
          productColors.set(name.toLowerCase(), { name, hex: v.colorHex || "#181715" });
        }
      });

      // Increment count once per product that carries this color
      productColors.forEach(({ name, hex }, key) => {
        if (!map.has(key)) {
          map.set(key, { name, hex, count: 0 });
        }
        map.get(key).count += 1;
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [baseCategoryProducts]);

  const availableSizes = useMemo(() => {
    const map = new Map();
    baseCategoryProducts.forEach((p) => {
      // Collect unique sizes for THIS product
      const productSizes = new Set();
      (p.sizes || []).forEach((s) => {
        const label = typeof s === "object" ? s.label : s;
        if (label && String(label).trim()) {
          productSizes.add(String(label).trim());
        }
      });
      (p.variants || []).forEach((v) => {
        if (v?.size && String(v.size).trim()) {
          productSizes.add(String(v.size).trim());
        }
      });

      // Increment count once per product that carries this size
      productSizes.forEach((size) => {
        map.set(size, (map.get(size) || 0) + 1);
      });
    });

    const order = ["0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M", "0-1Y", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y", "XS", "S", "M", "L", "XL", "XXL", "3XL", "38R", "40R", "42R", "44R"];
    return Array.from(map.entries())
      .map(([size, count]) => ({ name: size, count }))
      .sort((a, b) => {
        const iA = order.indexOf(a.name);
        const iB = order.indexOf(b.name);
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [baseCategoryProducts]);

  const toggleAvailability = (val) => {
    if (availabilityParam === val) {
      updateParams({ availability: "all" });
    } else {
      updateParams({ availability: val });
    }
  };

  const inStockCount = useMemo(() => baseCategoryProducts.filter((p) => p.inStock).length, [baseCategoryProducts]);
  const outOfStockCount = baseCategoryProducts.length - inStockCount;

  const filteredProducts = useMemo(() => {
    let list = catalog.filter((p) => {
      if (searchParam) {
        const pName = (p.name || "").toLowerCase();
        const pCat = (p.category || "").toLowerCase();
        const pDesc = (p.description || "").toLowerCase();
        const pSku = (p.sku || "").toLowerCase();
        const pColors = (p.colors || p.color || []).map((c) => (c.name || "").toLowerCase()).join(" ");
        const searchMatches =
          pName.includes(searchParam) ||
          pCat.includes(searchParam) ||
          pDesc.includes(searchParam) ||
          pSku.includes(searchParam) ||
          pColors.includes(searchParam);
        if (!searchMatches) return false;
      }
      if (categoryParam !== "all" && !matchesCategory(p)) return false;
      if (collectionParam === "best-sellers" && !p.isBestSeller) return false;
      if (collectionParam === "new-arrivals" && !p.isNewArrival) return false;
      
      if (colorParam.length > 0) {
        const pColors = (p.colors || p.color || []).map((c) => (c.name || c).toLowerCase());
        (p.variants || []).forEach((v) => { if (v.color) pColors.push(v.color.toLowerCase()); });
        if (!colorParam.some((col) => pColors.includes(col.toLowerCase()))) return false;
      }
      if (sizeParam.length > 0) {
        const pSizes = (p.sizes || []).map((s) => (typeof s === "object" ? s.label : s));
        (p.variants || []).forEach((v) => { if (v.size) pSizes.push(v.size); });
        if (!sizeParam.some((s) => pSizes.includes(s))) return false;
      }
      if (availabilityParam === "inStock" && !p.inStock) return false;
      if (availabilityParam === "outOfStock" && p.inStock) return false;
      const pPrice = Number(p.price) || 0;
      const effectiveMinPrice = searchParams.has("minPrice") ? Number(searchParams.get("minPrice")) : minPrice;
      const effectiveMaxPrice = searchParams.has("maxPrice") ? Number(searchParams.get("maxPrice")) : maxPrice;
      if (pPrice < effectiveMinPrice || pPrice > effectiveMaxPrice) return false;
      return true;
    });
    switch (sortParam) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "alpha-asc":
        list = [...list].sort((a, b) => (a.name || a.title || "").localeCompare(b.name || b.title || ""));
        break;
      case "alpha-desc":
        list = [...list].sort((a, b) => (b.name || b.title || "").localeCompare(a.name || a.title || ""));
        break;
      case "date-asc":
        list = [...list].sort((a, b) => {
          const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dA - dB;
        });
        break;
      case "date-desc":
      case "newest":
        list = [...list].sort((a, b) => {
          const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dB - dA) || (Number(b.id) - Number(a.id));
        });
        break;
      case "best-selling":
        list = [...list].sort((a, b) => {
          if (b.isBestSeller !== a.isBestSeller) return b.isBestSeller ? 1 : -1;
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        });
        break;
      case "relevant":
        list = [...list].sort((a, b) => {
          const rB = (b.rating || 0) * 10 + (b.reviewCount || 0);
          const rA = (a.rating || 0) * 10 + (a.reviewCount || 0);
          return rB - rA;
        });
        break;
      case "featured":
      default:
        list = [...list].sort((a, b) => {
          const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dB - dA) || (Number(b.id) - Number(a.id));
        });
        break;
    }
    return list;
  }, [catalog, searchParam, categoryParam, collectionParam, typeParam, colorParam, sizeParam, availabilityParam, minPrice, maxPrice, sortParam]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParam) count += 1;
    count += colorParam.length + sizeParam.length;
    if (availabilityParam !== "all") count += 1;
    if (minPrice > 0 || maxPrice < priceCeiling) count += 1;
    return count;
  }, [searchParam, colorParam, sizeParam, availabilityParam, minPrice, maxPrice, priceCeiling]);

  const displayedProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => { setVisibleCount((prev) => prev + INITIAL_PAGE_SIZE); setIsLoadingMore(false); }, 350);
  };

  const progressPercentage = Math.min(100, Math.round((displayedProducts.length / Math.max(1, filteredProducts.length)) * 100));

  const SectionCaret = ({ sectionKey }) => (
    <svg
      className={"coll-accordion-caret" + (openSections[sectionKey] ? " open" : "")}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  const renderFilterWidgets = () => (
    <>
      {/* 1. Price */}
      <div className="coll-sidebar-section">
        <button type="button" className="coll-sidebar-heading" onClick={() => toggleSection("price")}>
          <span>Price</span>
          <div className="coll-heading-right">
            {(minPrice > 0 || maxPrice < priceCeiling) && (
              <span className="coll-heading-badge">1</span>
            )}
            <SectionCaret sectionKey="price" />
          </div>
        </button>
        {openSections.price && (
          <div className="coll-price-filter">
            <div className="coll-dual-slider-wrap">
              <div className="coll-slider-track" />
              <div
                className="coll-slider-fill"
                style={{
                  left: `${priceCeiling > 0 ? (minPrice / priceCeiling) * 100 : 0}%`,
                  right: `${priceCeiling > 0 ? Math.max(0, 100 - (maxPrice / priceCeiling) * 100) : 0}%`
                }}
              />
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={50}
                value={minPrice}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), maxPrice - 50);
                  updateParams({ minPrice: Math.max(0, val) });
                }}
                className="coll-range-thumb coll-range-min"
                aria-label="Minimum price range"
              />
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={50}
                value={maxPrice}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), minPrice + 50);
                  updateParams({ maxPrice: Math.min(priceCeiling, val) });
                }}
                className="coll-range-thumb coll-range-max"
                aria-label="Maximum price range"
              />
            </div>

            <div className="coll-price-inputs-row">
              <div className="coll-price-box">
                <span className="coll-price-prefix">{CURRENCY_SYMBOL}</span>
                <input
                  type="number"
                  min={0}
                  max={maxPrice}
                  value={minPrice}
                  className="coll-price-input"
                  aria-label="Minimum price input"
                  onChange={(e) => updateParams({ minPrice: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <span className="coll-price-sep">–</span>
              <div className="coll-price-box">
                <span className="coll-price-prefix">{CURRENCY_SYMBOL}</span>
                <input
                  type="number"
                  min={minPrice}
                  max={priceCeiling}
                  value={maxPrice}
                  className="coll-price-input"
                  aria-label="Maximum price input"
                  onChange={(e) => updateParams({ maxPrice: Math.min(priceCeiling, Number(e.target.value)) })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Color (Compact Swatch Grid with Show More/Less) */}
      {availableColors.length > 0 && (
        <div className="coll-sidebar-section">
          <button type="button" className="coll-sidebar-heading" onClick={() => toggleSection("color")}>
            <span>Color</span>
            <div className="coll-heading-right">
              {colorParam.length > 0 && <span className="coll-heading-badge">{colorParam.length}</span>}
              <SectionCaret sectionKey="color" />
            </div>
          </button>
          {openSections.color && (
            <div className="coll-color-filter-container">
              <div className="coll-color-scroll-wrap">
                <div className="coll-color-grid" role="group" aria-label="Filter by color">
                  {(showAllColors ? availableColors : availableColors.slice(0, 8)).map((c) => {
                    const isActive = colorParam.some((cp) => cp.toLowerCase() === c.name.toLowerCase());
                    const isWhite = c.hex && (c.hex.toLowerCase() === "#ffffff" || c.hex.toLowerCase() === "#fff");
                    return (
                      <button
                        key={c.name}
                        type="button"
                        className={"coll-color-chip" + (isActive ? " active" : "")}
                        onClick={() => toggleArrayParam("color", c.name)}
                        aria-pressed={isActive}
                        title={`${c.name} (${c.count} items)`}
                      >
                        <span
                          className={"coll-color-dot" + (isWhite ? " is-white" : "")}
                          style={{ backgroundColor: c.hex || "#ccc" }}
                        >
                          {isActive && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="coll-color-name">{c.name}</span>
                        <span className="coll-color-count">({c.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {availableColors.length > 8 && (
                <button
                  type="button"
                  className="coll-color-toggle-btn"
                  onClick={() => setShowAllColors((prev) => !prev)}
                  aria-expanded={showAllColors}
                >
                  {showAllColors ? "Show Less" : `+ Show More (${availableColors.length - 8})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Size */}
      {availableSizes.length > 0 && (
        <div className="coll-sidebar-section">
          <button type="button" className="coll-sidebar-heading" onClick={() => toggleSection("size")}>
            <span>Size</span>
            <div className="coll-heading-right">
              {sizeParam.length > 0 && <span className="coll-heading-badge">{sizeParam.length}</span>}
              <SectionCaret sectionKey="size" />
            </div>
          </button>
          {openSections.size && (
            <div className="coll-size-grid" role="group" aria-label="Filter by size">
              {availableSizes.map((item) => {
                const isActive = sizeParam.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={"coll-size-chip" + (isActive ? " active" : "")}
                    onClick={() => toggleArrayParam("size", item.name)}
                    aria-pressed={isActive}
                    title={item.name}
                  >
                    <span className="coll-size-chip-name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Availability */}
      <div className="coll-sidebar-section coll-sidebar-section--last">
        <button type="button" className="coll-sidebar-heading" onClick={() => toggleSection("availability")}>
          <span>Availability</span>
          <div className="coll-heading-right">
            {availabilityParam !== "all" && <span className="coll-heading-badge">1</span>}
            <SectionCaret sectionKey="availability" />
          </div>
        </button>
        {openSections.availability && (
          <ul className="coll-ref-list" role="group" aria-label="Filter by availability">
            <li>
              <button
                type="button"
                className={"coll-ref-row" + (availabilityParam === "inStock" ? " active" : "")}
                onClick={() => toggleAvailability("inStock")}
                aria-pressed={availabilityParam === "inStock"}
              >
                <span className={"coll-ref-checkbox" + (availabilityParam === "inStock" ? " checked" : "")}>
                  {availabilityParam === "inStock" && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="coll-ref-label">
                  <span className="coll-stock-pulse-dot" aria-hidden="true" />
                  In Stock
                </span>
                <span className="coll-ref-count">({inStockCount})</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={"coll-ref-row" + (availabilityParam === "outOfStock" ? " active" : "")}
                onClick={() => toggleAvailability("outOfStock")}
                aria-pressed={availabilityParam === "outOfStock"}
              >
                <span className={"coll-ref-checkbox" + (availabilityParam === "outOfStock" ? " checked" : "")}>
                  {availabilityParam === "outOfStock" && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="coll-ref-label">
                  <span className="coll-out-dot" aria-hidden="true" />
                  Out of Stock
                </span>
                <span className="coll-ref-count">({outOfStockCount})</span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </>
  );

  if (isInvalidCategory) {
    return (
      <div className="collection-page" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--brand-blue)", fontSize: "14px", fontWeight: 500 }}>Redirecting to active collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-page">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={matchedCatObj?.meta_keywords}
        canonicalPath={canonicalPath}
        schema={collectionSchemas}
      />
      <h1 className="sr-only">{categoryName} Collection — Luxury Apparel &amp; Streetwear | HooDee Daddy</h1>

      {/* ── Collection Page Hero-Style Category Banner — Pure Bright Image, Zero Overlay Shade ── */}
      {!isBannerlessListing && (
        <section
          id="collection-hero"
          className="coll-hero-banner"
          aria-label={`${categoryName} Collection Banner`}
        >
          <div className="coll-hero-wrapper">
            <img
              src={imageUrl(banner.image)}
              alt={categoryName ? `${categoryName} Collection Banner` : "HooDee Daddy Apparel Collection"}
              className="coll-hero-backdrop-img"
              style={{ objectPosition: banner.imagePosition || "center top" }}
              onError={(event) => { event.currentTarget.src = "/images/hero-mens-oversized-tee.jpg"; }}
            />
          </div>
        </section>
      )}

      <section id="collection-catalog" className="coll-catalog-section section-padding" aria-label="Product catalog">
        <div className="container">
          {/* Bannerless listings keep their page context above the catalog. */}
          {(isBannerlessListing || isSubcategoryView) && (
            <nav className="coll-subcat-trail" aria-label="Breadcrumb">
              {isSearchListing ? (
                <h1 className="coll-subcat-trail-current">
                  Search results for "{searchParam}"
                </h1>
              ) : isBannerlessCollection ? (
                <h1 className="coll-subcat-trail-current">
                  {collectionParam === "best-sellers" ? "Best Sellers" : "New Arrivals"}
                </h1>
              ) : (
                <h1 className="coll-subcat-trail-current">
                  {activeCategoryLabel}
                </h1>
              )}
            </nav>
          )}

          <div className="coll-toolbar">
            <p className="coll-toolbar-count">
              {filteredProducts.length === 0
                ? "No products found"
                : `${filteredProducts.length} ${filteredProducts.length === 1 ? "Product" : "Products"}`}
            </p>
            <div className="coll-toolbar-right">
              {/* Featured Custom Sort Dropdown */}
              <div className="coll-custom-sort" ref={sortRef}>
                <button
                  type="button"
                  className={`coll-custom-sort-trigger ${isSortOpen ? "open" : ""}`}
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  aria-expanded={isSortOpen}
                  aria-haspopup="listbox"
                  aria-label="Sort options"
                >
                  <span className="coll-sort-trigger-label">{currentSortOption.label}</span>
                  <svg
                    className={`coll-sort-trigger-caret ${isSortOpen ? "open" : ""}`}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isSortOpen && (
                  <ul className="coll-custom-sort-menu" role="listbox" aria-label="Sort options">
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortParam === opt.value;
                      return (
                        <li
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          className={`coll-sort-option ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            updateParams({ sort: opt.value });
                            setIsSortOpen(false);
                          }}
                        >
                          <span className="coll-sort-option-label">{opt.label}</span>
                          {isSelected && (
                            <svg className="coll-sort-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* 2 | 3 | 4 Product Grid Column Selector */}
              <div className="coll-col-switcher" role="radiogroup" aria-label="Product grid columns">
                {[2, 3, 4].map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    className={`coll-col-btn ${gridCols === cols ? "active" : ""}`}
                    onClick={() => setGridCols(cols)}
                    role="radio"
                    aria-checked={gridCols === cols}
                    aria-label={`${cols} columns`}
                    data-col={cols}
                  >
                    <GridIcon columns={cols} />
                  </button>
                ))}
              </div>

              <button type="button" className="coll-mobile-filter-btn" onClick={() => setIsMobileDrawerOpen(true)} aria-label="Open filters">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}</span>
              </button>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="coll-active-chips" aria-label="Active filters">
              {searchParam && (
                <button type="button" className="coll-chip" onClick={() => updateParams({ q: null, search: null })}>
                  Search: "{searchParam}" <span>✕</span>
                </button>
              )}
              {(minPrice > 0 || maxPrice < priceCeiling) && (
                <button type="button" className="coll-chip" onClick={() => updateParams({ minPrice: null, maxPrice: null })}>
                  Price: {CURRENCY_SYMBOL}{formatINRNumber(minPrice)} – {CURRENCY_SYMBOL}{formatINRNumber(maxPrice)} <span>✕</span>
                </button>
              )}
              {colorParam.map((c) => (
                <button key={c} type="button" className="coll-chip" onClick={() => toggleArrayParam("color", c)}>
                  Color: {c} <span>✕</span>
                </button>
              ))}
              {sizeParam.map((s) => (
                <button key={s} type="button" className="coll-chip" onClick={() => toggleArrayParam("size", s)}>
                  Size: {s} <span>✕</span>
                </button>
              ))}
              {availabilityParam !== "all" && (
                <button type="button" className="coll-chip" onClick={() => updateParams({ availability: "all" })}>
                  {availabilityParam === "inStock" ? "In Stock" : "Out of Stock"} <span>✕</span>
                </button>
              )}
              <button type="button" className="coll-clear-all" onClick={clearAllFilters}>Clear All</button>
            </div>
          )}

          <div className="coll-layout">
            <aside className="coll-sidebar" aria-label="Filter sidebar">
              <div className="coll-sidebar-inner">
                <div className="coll-sidebar-header">
                  <h2 className="coll-sidebar-title">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <button type="button" className="coll-sidebar-clear" onClick={clearAllFilters}>
                      Clear All ({activeFiltersCount})
                    </button>
                  )}
                </div>
                {renderFilterWidgets()}
              </div>
            </aside>

            <div className="coll-grid-area">
              {storefrontStatus === "loading" && (!catalog || catalog.length === 0) ? (
                <div className={`coll-product-grid coll-grid-cols-${gridCols}`} aria-busy="true">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="coll-product-skeleton">
                      <div className="coll-skeleton-img sk" />
                      <div style={{ padding: "4px 2px 2px" }}>
                        <div className="t sk w1" />
                        <div className="t sk w2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedProducts.length > 0 ? (
                <>
                  <div className={`coll-product-grid coll-grid-cols-${gridCols}`}>
                    {displayedProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        className="fade"
                        style={{ animationDelay: `${Math.min(idx * 60, 600)}ms` }}
                      />
                    ))}
                  </div>
                  <div className="coll-pagination">
                    <div className="coll-pagination-progress">
                      <p className="coll-progress-text">Showing {displayedProducts.length} of {filteredProducts.length} Products</p>
                      <div className="coll-progress-track">
                        <div className="coll-progress-fill" style={{ width: `${progressPercentage}%` }} />
                      </div>
                    </div>
                    {displayedProducts.length < filteredProducts.length ? (
                      <button type="button" className="btn btn-primary coll-load-more-btn" onClick={handleLoadMore} disabled={isLoadingMore}>
                        {isLoadingMore ? (<span className="btn-loader-content"><span className="spinner-circle" /> Loading...</span>) : (<span>Load More</span>)}
                      </button>
                    ) : (
                      <p className="coll-end-text">You have viewed all {filteredProducts.length} items.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="coll-empty-state">
                  <div className="coll-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                  <h3 className="coll-empty-title">No Products Found</h3>
                  <p className="coll-empty-desc">
                    {catalog.length === 0
                      ? "No products have been added yet. Please check back later."
                      : baseCategoryProducts.length === 0
                      ? "No products found in this category."
                      : "No designs match your current filter combination. Try adjusting your filters."}
                  </p>
                  {activeFiltersCount > 0 && (
                    <button type="button" className="btn btn-primary" onClick={() => { clearAllFilters(); navigate(canonicalPath); }}>
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={"coll-drawer-backdrop" + (isMobileDrawerOpen ? " open" : "")}
        onClick={() => setIsMobileDrawerOpen(false)} aria-hidden={!isMobileDrawerOpen} />
      <div className={"coll-mobile-drawer" + (isMobileDrawerOpen ? " open" : "")}
        role="dialog" aria-modal="true" aria-label="Filter collection">
        <div className="coll-drawer-header">
          <div className="coll-drawer-title-row">
            <h3>Filters</h3>
            {activeFiltersCount > 0 && <span className="coll-drawer-badge">{activeFiltersCount}</span>}
          </div>
          <button type="button" className="coll-drawer-close" onClick={() => setIsMobileDrawerOpen(false)} aria-label="Close filter drawer">✕</button>
        </div>
        <div className="coll-drawer-body">
          {renderFilterWidgets()}
        </div>
        <div className="coll-drawer-footer">
          <button type="button" className="btn btn-secondary coll-drawer-clear" onClick={clearAllFilters}>Clear All</button>
          <button type="button" className="btn btn-primary coll-drawer-apply" onClick={() => setIsMobileDrawerOpen(false)}>
            View ({filteredProducts.length}) Products
          </button>
        </div>
      </div>

      <RecentlyViewed />
    </div>
  );
}
