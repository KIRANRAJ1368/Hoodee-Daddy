import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import SeoHead from "../components/Seo/SeoHead";
import { buildProductSchema, buildBreadcrumbSchema } from "../utils/seoSchemas";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard/ProductCard";
import SizeGuideModal from "../components/Modals/SizeGuideModal";
import { imageUrl } from "../utils/imageUrl";
import { getProductPricing } from "../utils/pricing";
import { storefrontApi } from "../services/storefrontApi";
import "./ProductDetail.css";

function availableColors(product) {
  if (product?.variants?.length) {
    const colors = new Map();
    product.variants.forEach((variant) => {
      if (variant.color) {
        const key = variant.color.toLowerCase();
        if (!colors.has(key)) colors.set(key, { name: variant.color, hex: variant.colorHex || "#181715" });
      }
    });
    if (colors.size > 0) return [...colors.values()];
  }
  if (Array.isArray(product?.colors)) {
    return product.colors.map((c) => {
      if (typeof c === "string") return { name: c, hex: "#181715" };
      return { name: c.name || "Default", hex: c.hex || c.hexCode || c.hex_code || "#181715" };
    });
  }
  return [];
}

function availableSizes(product) {
  if (product?.variants?.length) {
    const sizes = [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))];
    if (sizes.length > 0) return sizes;
  }
  if (Array.isArray(product?.sizes)) {
    return product.sizes.map((s) => (typeof s === "object" && s !== null ? (s.label || s.size || s.name) : s)).filter(Boolean);
  }
  return [];
}

function getDefaultSelection(prod) {
  if (!prod) return { color: null, size: null };
  if (prod.variants?.length) {
    const inStock = prod.variants.find((v) => Number(v.stockCount ?? 0) > 0);
    const chosen = inStock || prod.variants[0];
    return {
      color: chosen.color || availableColors(prod)[0]?.name || null,
      size: chosen.size || availableSizes(prod)[0] || null
    };
  }
  return {
    color: availableColors(prod)[0]?.name ?? null,
    size: availableSizes(prod)[0] || null
  };
}

export default function ProductDetail() {
  const { productId, slug } = useParams();
  const productIdentifier = slug || productId;
  const location = useLocation();
  const navigate = useNavigate();
  const {
    formatPrice,
    addToCart,
    beginBuyNow,
    wishlist,
    isInWishlist,
    toggleWishlist,
    setIsCartOpen,
    allProducts,
    findProduct,
    recentlyViewed,
    trackRecentlyViewed,
    categories,
    seoSettings,
    customerUser,
    customerToken,
    isCustomerAuthenticated,
    setAuthModalState,
    setPendingCheckout,
    setCheckoutIntent,
    addToast
  } = useShop();

  const [product, setProduct] = useState(() => findProduct(productIdentifier));
  const [isLoading, setIsLoading] = useState(!product);
  const [loadError, setLoadError] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Review Form States
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewFormRating, setReviewFormRating] = useState(5);
  const [reviewFormHoverRating, setReviewFormHoverRating] = useState(0);
  const [reviewFormName, setReviewFormName] = useState("");
  const [reviewFormTitle, setReviewFormTitle] = useState("");
  const [reviewFormComment, setReviewFormComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");
  const [reviewErrorMsg, setReviewErrorMsg] = useState("");

  const handleReviewSubmit = async (e) => {
    if (e) e.preventDefault();
    setReviewErrorMsg("");
    if (!customerUser && (!reviewFormName || !reviewFormName.trim())) {
      setReviewErrorMsg("Please enter your name.");
      return;
    }
    if (!reviewFormComment || reviewFormComment.trim().length < 5) {
      setReviewErrorMsg("Please enter a review comment of at least 5 characters.");
      return;
    }
    if (!reviewFormRating || reviewFormRating < 1 || reviewFormRating > 5) {
      setReviewErrorMsg("Please select a rating between 1 and 5 stars.");
      return;
    }
    const name = (customerUser?.name || reviewFormName || "Verified Patron").trim();
    setReviewSubmitting(true);
    try {
      const payload = {
        rating: Number(reviewFormRating || 5),
        title: reviewFormTitle ? reviewFormTitle.trim() : null,
        comment: reviewFormComment.trim(),
        customer_name: name,
        customer_email: customerUser?.email || null
      };
      const res = await storefrontApi.submitProductReview(productIdentifier, payload, customerToken);

      const createdReview = res?.data || res || {
        id: Date.now(),
        customerName: name,
        rating: Number(reviewFormRating || 5),
        title: reviewFormTitle ? reviewFormTitle.trim() : null,
        comment: reviewFormComment.trim(),
        verifiedPurchase: true,
        createdAt: new Date().toISOString()
      };

      setReviewsData((prev) => {
        const existingReviews = prev?.reviews ? [...prev.reviews] : [];
        const updatedList = [createdReview, ...existingReviews];
        const newTotal = updatedList.length;
        const newAvg = Number(
          (updatedList.reduce((sum, r) => sum + Number(r.rating || 5), 0) / newTotal).toFixed(1)
        );
        const newBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        updatedList.forEach((r) => {
          const score = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
          newBreakdown[score] = (newBreakdown[score] || 0) + 1;
        });
        const newBreakdownPct = {};
        for (let s = 1; s <= 5; s++) {
          newBreakdownPct[s] = Math.round((newBreakdown[s] / newTotal) * 100);
        }

        return {
          productId: product?.id,
          productName: product?.name,
          averageRating: newAvg,
          totalReviews: newTotal,
          breakdown: newBreakdown,
          breakdownPercentages: newBreakdownPct,
          reviews: updatedList,
          userEligibility: {
            ...(prev?.userEligibility || {}),
            canReview: false,
            alreadyReviewed: true,
            reason: "already_reviewed",
            message: "You have already reviewed this product."
          }
        };
      });

      setReviewSuccessMsg("Thank you! Your review has been added.");
      setReviewFormTitle("");
      setReviewFormComment("");
      setIsWritingReview(false);
      if (addToast) addToast("Review submitted successfully!", "success");
    } catch (err) {
      setReviewErrorMsg(err.message || "Could not submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDualView, setIsDualView] = useState(true);

  // Accordions state
  const [openAccordions, setOpenAccordions] = useState({
    desc: true,
    specs: true,
    care: false,
    shipping: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamic Product Loader: Guarantees NO previously selected product content leaks
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    // Reset selection states immediately on ID change
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setAddedToCart(false);
    setPreviewImage(null);
    setActiveImageIndex(0);
    setIsDualView(true);
    setLoadError(null);

    let isMounted = true;
    const initialMatch = findProduct(productIdentifier);

    if (initialMatch) {
      setProduct(initialMatch);
      const defaults = getDefaultSelection(initialMatch);
      setSelectedColor(defaults.color);
      setSelectedSize(defaults.size);
      trackRecentlyViewed(initialMatch.id);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setProduct(null); // Clear previous product immediately
    }

    // Always fetch fresh dynamic data for this specific product
    storefrontApi
      .product(productIdentifier)
      .then((data) => {
        if (!isMounted || !data) return;
        setProduct(data);
        const defaults = getDefaultSelection(data);
        setSelectedColor((prev) => {
          if (prev && availableColors(data).some((c) => c.name.toLowerCase() === prev.toLowerCase())) return prev;
          return defaults.color;
        });
        setSelectedSize((prev) => {
          if (prev && availableSizes(data).some((s) => s.toLowerCase() === prev.toLowerCase())) return prev;
          return defaults.size;
        });
        trackRecentlyViewed(data.id);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (!initialMatch) {
          setLoadError(err.message || "Product not found");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productIdentifier]);

  // Always fetch fresh dynamic reviews & purchase eligibility for this product
  useEffect(() => {
    let isMounted = true;
    const targetProductKey = product?.id || productIdentifier;
    if (!targetProductKey) return;
    setIsLoadingReviews(true);
    storefrontApi
      .getProductReviews(targetProductKey, customerToken)
      .then((reviewsRes) => {
        if (!isMounted || !reviewsRes) return;
        setReviewsData(reviewsRes);
      })
      .catch((err) => {
        console.warn("Could not load product reviews:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingReviews(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.id, productIdentifier, customerToken]);

  const scrollToReviews = useCallback(() => {
    const el = document.getElementById("customer-reviews");
    if (el) {
      const yOffset = -90;
      const targetY = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset + yOffset);
      window.scrollTo({ top: targetY, behavior: "smooth" });
      el.classList.add("pd-reviews-highlight");
      setTimeout(() => el.classList.remove("pd-reviews-highlight"), 1600);
    }
  }, []);

  // Canonical 301-equivalent redirect: When accessed via legacy /product/:id, redirect to canonical /products/:slug
  useEffect(() => {
    if (product?.slug && location.pathname.startsWith("/product/")) {
      navigate(`/products/${product.slug}${location.hash || ""}`, { replace: true });
    }
  }, [product?.slug, location.pathname, location.hash, navigate]);

  // Smoothly scroll to customer reviews section when hash is #customer-reviews
  useEffect(() => {
    if (location.hash === "#customer-reviews") {
      const timer = setTimeout(() => {
        scrollToReviews();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location.hash, product?.id, reviewsData, scrollToReviews]);

  useEffect(() => {
    const latestProduct = findProduct(productIdentifier);
    if (latestProduct) setProduct(latestProduct);
  }, [allProducts, findProduct, productIdentifier]);

  // Close Lightbox preview modal on Escape key
  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  // Resolve one active variant for images, stock, and price alike.
  const currentVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      const matchColor = !v.color || !selectedColor || v.color.toLowerCase() === selectedColor.toLowerCase();
      const matchSize = !v.size || !selectedSize || v.size.toLowerCase() === selectedSize.toLowerCase();
      return matchColor && matchSize;
    });
  }, [product, selectedColor, selectedSize]);

  // Resolve all product images dynamically: variant images first, then product-level images (front, back, thumbnails).
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const productImages = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && typeof img === "string") productImages.push(img.trim());
        else if (img && typeof img.url === "string") productImages.push(img.url.trim());
      });
    } else if (product.image) {
      productImages.push(typeof product.image === "string" ? product.image.trim() : "");
    }

    const variantImages = [
      currentVariant?.imageUrl,
      ...(Array.isArray(currentVariant?.galleryImages) ? currentVariant.galleryImages : [])
    ]
      .filter((image) => typeof image === "string" && image.trim().length > 0)
      .map((image) => image.trim());

    if (variantImages.length > 0) return variantImages;

    const combined = [...variantImages, ...productImages].filter(Boolean);
    const unique = [...new Set(combined)];
    return unique.length > 0 ? unique : ["/images/photo-1521572163474-6864f9cf17ab.jpg"];
  }, [product, currentVariant]);

  const safeActiveIndex = activeImageIndex >= 0 && activeImageIndex < galleryImages.length ? activeImageIndex : 0;
  const showDualView = isDualView && galleryImages.length >= 2;

  const recentlyViewedProducts = useMemo(
    () => recentlyViewed.filter((p) => String(p.id) !== String(product?.id)).slice(0, 4),
    [recentlyViewed, product]
  );

  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const activeStockCount = hasVariants
    ? Number(currentVariant?.stockCount ?? 0)
    : Number(product?.stockCount ?? 0);
  const isOutOfStock = hasVariants
    ? !currentVariant || Number(currentVariant.stockCount ?? 0) <= 0
    : !product?.inStock;
  const pricing = useMemo(
    () => getProductPricing(product, currentVariant),
    [product, currentVariant, currentVariant?.priceOverride]
  );
  const activePrice = pricing.price;
  const displayOriginalPrice = pricing.originalPrice;
  const isOffer = pricing.isOffer;
  const isLowStock = !isOutOfStock && activeStockCount > 0 && activeStockCount <= 5;
  const totalReviewsCount = Number(
    reviewsData?.totalReviews ??
    reviewsData?.reviews?.length ??
    product?.reviewCount ??
    0
  );
  const averageRatingScore = Number(
    reviewsData?.averageRating ??
    (totalReviewsCount > 0 ? product?.rating : 0) ??
    0
  );

  // Clamp quantity if active stock changes or becomes lower
  useEffect(() => {
    if (activeStockCount > 0 && quantity > activeStockCount) {
      setQuantity(activeStockCount);
    }
  }, [activeStockCount, quantity]);

  // Map of unavailable sizes for the currently selected color
  const unavailableSizes = useMemo(() => {
    if (!product?.variants || product.variants.length === 0 || !selectedColor) return new Set();
    const set = new Set();
    availableSizes(product).forEach((s) => {
      const v = product.variants.find(
        (item) =>
          item.size?.toLowerCase() === s.toLowerCase() &&
          item.color?.toLowerCase() === selectedColor.toLowerCase()
      );
      if (!v || Number(v.stockCount ?? 0) <= 0) {
        set.add(s);
      }
    });
    return set;
  }, [product, selectedColor]);

  // Determine category page navigation dynamically from real categories
  const catKey = (product?.category || "").toLowerCase();
  const matchedCategory = (categories || []).find(
    (c) => c.slug?.toLowerCase() === catKey || (catKey === "mens" && c.slug?.toLowerCase() === "men") || (catKey === "men" && c.slug?.toLowerCase() === "mens")
  );
  const categorySlug = matchedCategory?.slug || catKey || "mens";
  const collectionPath = `/categories/${encodeURIComponent(categorySlug)}`;
  const canonicalPath = product?.slug ? `/products/${product.slug}` : `/products/${productIdentifier}`;
  const baseUrl = (seoSettings?.canonical_base_url || "https://zmwclothing.com").replace(/\/+$/, "");

  const formatCollectionLabel = (name) => {
    if (!name) return "Collection";
    const trimmed = name.trim();
    if (trimmed.toLowerCase().endsWith("s")) return `${trimmed}' Collection`;
    return `${trimmed}'s Collection`;
  };
  const collectionLabel = formatCollectionLabel(matchedCategory?.name || (catKey ? catKey.charAt(0).toUpperCase() + catKey.slice(1) : ""));

  const seoTitle = useMemo(() => {
    if (!product) return "Product Details | ZMW Clothing";
    if (product.metaTitle) return product.metaTitle;
    const format = seoSettings?.product_title_format || "{name} | ZMW Clothing";
    return format
      .replace("{name}", product.name || "")
      .replace("{category}", matchedCategory?.name || catKey || "")
      .replace("{price}", product.price ? `₹${product.price}` : "");
  }, [product, seoSettings, matchedCategory, catKey]);

  const seoDescription = useMemo(() => {
    if (!product) return "Handcrafted luxury apparel from ZMW Clothing.";
    if (product.metaDescription) return product.metaDescription;
    if (seoSettings?.product_description_format && seoSettings.product_description_format.includes("{name}")) {
      return seoSettings.product_description_format
        .replace("{name}", product.name || "")
        .replace("{description}", product.description || "");
    }
    return product ? (product.description || `Buy ${product.name} online at ZMW Clothing. Premium luxury fabrics, considered tailoring, and pan-India delivery.`) : "Handcrafted luxury apparel from ZMW Clothing.";
  }, [product, seoSettings]);

  const productSchemas = useMemo(() => {
    if (!product) return null;
    const prodSchema = buildProductSchema(product, baseUrl, activePrice);
    const breadcrumbSchema = buildBreadcrumbSchema(
      [
        { name: "Home", path: "/" },
        { name: collectionLabel || "Collection", path: collectionPath },
        ...(product.subCategory ? [{ name: product.subCategory, path: `/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(product.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}` }] : []),
        { name: product.name, path: canonicalPath }
      ],
      baseUrl
    );
    return [prodSchema, breadcrumbSchema].filter(Boolean);
  }, [product, baseUrl, activePrice, collectionLabel, collectionPath, categorySlug, canonicalPath]);

  if (isLoading && !product) {
    return (
      <div className="pd-loading-screen" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--color-ink)" }}>
          <div className="pd-spinner" style={{ width: 44, height: 44, border: "3px solid #e5e7eb", borderTopColor: "var(--color-accent, #FAA703)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-grey-600)" }}>Loading product details…</p>
        </div>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="pd-not-found">
        <div className="container">
          <h2>Product Not Found</h2>
          <p>{loadError || "The product you are looking for is no longer available."}</p>
          <div className="hero-cta-group" style={{ justifyContent: "center" }}>
            <Link to="/collection" className="btn btn-primary">
              Browse All Products
            </Link>
            <Link to="/" className="btn btn-secondary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSaved = isInWishlist ? isInWishlist(product.id) : wishlist.some((id) => String(id) === String(product.id));
  const discountPct = displayOriginalPrice
    ? Math.round(((displayOriginalPrice - activePrice) / displayOriginalPrice) * 100)
    : null;

  const isWomensProduct = catKey === "women" || catKey === "womens";
  const isKidsProduct = ["kids", "boys", "girls", "babies"].includes(catKey);
  const isBabiesProduct = catKey === "babies";

  // Intelligent Color Select: switches to in-stock size if current size isn't available in new color
  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    setActiveImageIndex(0);
    setIsDualView(true);
    if (product?.variants?.length) {
      const variantsForColor = product.variants.filter(
        (v) => v.color && v.color.toLowerCase() === colorName.toLowerCase()
      );
      if (variantsForColor.length > 0) {
        const currentSizeHasStock = variantsForColor.some(
          (v) => v.size && v.size.toLowerCase() === selectedSize?.toLowerCase() && Number(v.stockCount ?? 0) > 0
        );
        if (!currentSizeHasStock) {
          const firstInStock = variantsForColor.find((v) => Number(v.stockCount ?? 0) > 0);
          if (firstInStock?.size) {
            setSelectedSize(firstInStock.size);
          } else if (variantsForColor[0]?.size) {
            setSelectedSize(variantsForColor[0].size);
          }
        }
      }
    }
  };

  // Add to Cart handler — adds to bag and opens cart drawer
  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      setIsCartOpen(true);
    }, 500);
  };

  // Instant Buy Now handler — goes directly to checkout, never opens cart drawer
  const handleBuyNow = () => {
    if (isOutOfStock) return;
    const ok = beginBuyNow(product, selectedColor, selectedSize, quantity);
    if (!ok) return;

    // Explicitly guarantee cart drawer stays closed
    setIsCartOpen(false);

    if (!isCustomerAuthenticated) {
      setCheckoutIntent("buy-now");
      setPendingCheckout(true);
      setAuthModalState("register");
      return;
    }

    navigate("/checkout", { state: { buyNow: true } });
  };

  // Copy coupon handler
  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // Dynamic Highlights derived from this product's actual information
  const highlights = [
    {
      label: "Silhouette",
      value: (product.subCategory || product.name || "").toLowerCase().includes("oversized")
        ? "Oversized Boxy Fit"
        : (product.subCategory || product.name || "").toLowerCase().includes("polo")
        ? "Classic Tailored Fit"
        : (product.subCategory || product.name || "").toLowerCase().includes("hoodie")
        ? "Relaxed Streetwear Fit"
        : (product.subCategory || product.name || "").toLowerCase().includes("sweatshirt")
        ? "Comfort Streetwear Fit"
        : isBabiesProduct
        ? "Easy-Fit Snug Infant Cut"
        : isKidsProduct
        ? "Kids' Active Comfort Fit"
        : "Relaxed Regular Fit"
    },
    {
      label: "Fabric Composition",
      value: isBabiesProduct
        ? "100% Hypoallergenic Baby-Safe Cotton"
        : isKidsProduct
        ? "100% Super-Soft Bio-Washed Organic Cotton"
        : isWomensProduct
        ? "Soft-Washed Midweight Combed Cotton"
        : (product.subCategory || product.name || "").toLowerCase().includes("hoodie")
        ? "360 GSM Heavyweight French Terry"
        : "240 GSM Pure Combed Cotton"
    },
    {
      label: "Collar / Neckline",
      value: (product.subCategory || product.name || "").toLowerCase().includes("polo")
        ? "Ribbed Knit Polo Collar"
        : (product.subCategory || product.name || "").toLowerCase().includes("high neck")
        ? "Snug Mock High Neck"
        : (product.subCategory || product.name || "").toLowerCase().includes("v-neck")
        ? "Clean Minimalist V-Neck"
        : (product.subCategory || product.name || "").toLowerCase().includes("hoodie")
        ? "Double-Layered Warm Hood"
        : isBabiesProduct
        ? "Envelope / Expandable Soft Ribbed Neck"
        : "Reinforced Crew Neck"
    },
    {
      label: "Sleeve Style",
      value: (product.name || "").toLowerCase().includes("full sleeve") || (product.name || "").toLowerCase().includes("long sleeve")
        ? "Full Length with Ribbed Cuffs"
        : (product.subCategory || product.name || "").toLowerCase().includes("hoodie") || (product.subCategory || product.name || "").toLowerCase().includes("sweatshirt")
        ? "Long Sleeve with Ribbed Cuffs"
        : "Drop-Shoulder Half Sleeve"
    },
    {
      label: "Print & Finish",
      value: isBabiesProduct
        ? "Non-Toxic Skin-Safe Reactive Dye"
        : isWomensProduct
        ? "Colorfast Artistic Pigment Print"
        : "High-Density Screen Print"
    },
    {
      label: "Garment Treatment",
      value: "Pre-Shrunk, Bio-Washed & Colorfast"
    }
  ];

  const specificationsList = (() => {
    let list = [];
    if (product?.specifications) {
      if (Array.isArray(product.specifications)) list = product.specifications;
      else if (typeof product.specifications === "string") {
        try {
          const parsed = JSON.parse(product.specifications);
          if (Array.isArray(parsed)) list = parsed;
        } catch {}
      }
    }
    if (list.length > 0) return list;
    return highlights.slice(0, 4).map((h) => ({ title: h.label, value: h.value }));
  })();

  return (
    <div className="product-detail-page">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        ogImage={previewImage || (product.images && product.images[0]) || product.image}
        schemas={productSchemas}
        keywords={product.metaKeywords || `${product.name}, ${matchedCategory?.name || "apparel"}, streetwear, ZMW Clothing`}
      />
      {/* ── Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="pd-breadcrumb-bar">
        <div className="container">
          <nav className="pd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="pd-sep">/</span>
            <Link to={collectionPath}>{collectionLabel}</Link>
            {product.subCategory && (
              <>
                <span className="pd-sep">/</span>
                <Link to={`/categories/${encodeURIComponent(categorySlug)}/${encodeURIComponent(product.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`}>
                  {product.subCategory}
                </Link>
              </>
            )}
            <span className="pd-sep">/</span>
            <span aria-current="page" className="pd-crumb-current">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main Product Display: Clean Gallery Left + Info Right ── */}
      <section className="pd-main-section">
        <div className="container">
          <div className="pd-layout">
            {/* ── Left: Dual-Image (Two Side-by-Side) Fashion Grid ── */}
            <div className="pd-gallery-col">
              <div className="pd-dual-images-grid">
                {showDualView ? (
                  galleryImages.slice(0, 2).map((img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className="pd-grid-image-item"
                      onClick={() => setPreviewImage(img)}
                      title="Click to view full resolution"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setPreviewImage(img)}
                    >
                      {idx === 0 && (
                        <>
                          <span className="pd-overlay-badge-top">
                            {product.badge || ((product.subCategory || product.name || "").toLowerCase().includes("oversized") ? "OVERSIZED FIT" : "PREMIUM FIT")}
                          </span>
                          <span className="pd-overlay-badge-bottom">
                            {isBabiesProduct
                              ? "100% ORGANIC COTTON"
                              : isKidsProduct
                              ? "SUPER-SOFT ORGANIC"
                              : isWomensProduct
                              ? "COMBED PURE COTTON"
                              : "240 GSM COMBED COTTON"}
                          </span>
                        </>
                      )}
                      {idx === 1 && (
                        <span className="pd-overlay-badge-top" style={{ background: "rgba(15, 23, 42, 0.75)" }}>
                          BACK VIEW
                        </span>
                      )}

                      <img
                        src={imageUrl(img)}
                        alt={`${product.name} - ${idx === 0 ? "front view" : "back view"}`}
                        className="pd-grid-img"
                        loading={idx < 2 ? "eager" : "lazy"}
                        onError={(event) => { event.currentTarget.src = "/images/zmw-logo-transparent.png"; }}
                      />

                      <div className="pd-zoom-hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          <line x1="11" y1="8" x2="11" y2="14" />
                          <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                        <span>Enlarge</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="pd-grid-image-item is-single"
                    onClick={() => setPreviewImage(galleryImages[safeActiveIndex] || galleryImages[0])}
                    title="Click to view full resolution"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setPreviewImage(galleryImages[safeActiveIndex] || galleryImages[0])}
                  >
                    <span className="pd-overlay-badge-top">
                      {safeActiveIndex === 0
                        ? (product.badge || ((product.subCategory || product.name || "").toLowerCase().includes("oversized") ? "OVERSIZED FIT" : "PREMIUM FIT"))
                        : safeActiveIndex === 1
                        ? "BACK VIEW"
                        : `VIEW ${safeActiveIndex + 1}`}
                    </span>
                    {safeActiveIndex === 0 && (
                      <span className="pd-overlay-badge-bottom">
                        {isBabiesProduct
                          ? "100% ORGANIC COTTON"
                          : isKidsProduct
                          ? "SUPER-SOFT ORGANIC"
                          : isWomensProduct
                          ? "COMBED PURE COTTON"
                          : "240 GSM COMBED COTTON"}
                      </span>
                    )}

                    <img
                      src={imageUrl(galleryImages[safeActiveIndex] || galleryImages[0])}
                      alt={`${product.name} - view ${safeActiveIndex + 1}`}
                      className="pd-grid-img"
                      loading="eager"
                      onError={(event) => { event.currentTarget.src = "/images/zmw-logo-transparent.png"; }}
                    />

                    <div className="pd-zoom-hint">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                      <span>Enlarge</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Small Thumbnails Strip (Front, Back & All Additional Views) ── */}
              {galleryImages.length > 1 && (
                <div className="pd-thumbnails-strip" aria-label="Product image gallery thumbnails">
                  <div className="pd-thumbnails-header">
                    <div className="pd-thumbnails-header-left">
                      <span className="pd-thumbnails-label">All Views</span>
                      <span className="pd-thumbnails-count-badge">{galleryImages.length} images</span>
                    </div>
                    {galleryImages.length >= 2 && (
                      <button
                        type="button"
                        className="pd-thumbnails-reset-btn"
                        onClick={() => {
                          setIsDualView((prev) => !prev);
                          if (!showDualView) {
                            setActiveImageIndex(0);
                          }
                        }}
                        title={showDualView ? "Switch to single view" : "Switch to dual front and back view"}
                      >
                        {showDualView ? "Focus Single View" : "Dual View (Front & Back)"}
                      </button>
                    )}
                  </div>
                  <div className="pd-thumbnails-grid" role="tablist" aria-label="Product thumbnails">
                    {galleryImages.map((img, idx) => {
                      const isActive = showDualView ? (idx === 0 || idx === 1) : idx === safeActiveIndex;
                      const label = idx === 0 ? "Front" : idx === 1 ? "Back" : `${idx + 1}`;
                      return (
                        <button
                          key={`thumb-${img}-${idx}`}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          className={`pd-thumbnail-item ${isActive ? "is-active" : ""}`}
                          onClick={() => {
                            setActiveImageIndex(idx);
                            setIsDualView(false);
                          }}
                          title={`View ${label} image`}
                        >
                          <img
                            src={imageUrl(img)}
                            alt={`${product.name} thumbnail ${label}`}
                            className="pd-thumbnail-img"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = "/images/zmw-logo-transparent.png"; }}
                          />
                          <span className="pd-thumbnail-num">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Product Info & Purchase Form ── */}
            <div className="pd-info-col">
              {/* Category Eyebrow & Title Row */}
              <div className="pd-header-group">
                <span className="pd-category-eyebrow">{product.subCategory}</span>
                <div className="pd-title-row">
                  <h1 className="pd-title">{product.name}</h1>
                  <button
                    type="button"
                    className={`pd-wishlist-icon-btn ${isSaved ? "saved" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                    aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                    title={isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isSaved ? "var(--color-accent)" : "none"} stroke={isSaved ? "var(--color-accent)" : "var(--color-ink)"} strokeWidth="1.8">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>

                {/* Rating & SKU */}
                <div className="pd-rating-sku-row">
                  {totalReviewsCount > 0 && (
                    <button
                      type="button"
                      className="pd-star-rating-pill"
                      onClick={scrollToReviews}
                      title="Click to view verified customer reviews"
                      aria-label={`View ${totalReviewsCount} customer reviews`}
                    >
                      <span className="pd-star-icon">★</span>
                      <span className="pd-star-score">{averageRatingScore.toFixed(1)}</span>
                      <span className="pd-star-count">
                        ({totalReviewsCount} {totalReviewsCount === 1 ? "review" : "reviews"})
                      </span>
                    </button>
                  )}
                  <span className="pd-sku-label">SKU: <strong>{currentVariant?.skuSuffix ? `${product.sku}-${currentVariant.skuSuffix}` : product.sku}</strong></span>
                  <span className="pd-genuine-badge">100% GENUINE APPAREL</span>
                </div>
              </div>

              {/* Active Offer Banner Alert when offer is live */}
              {isOffer && (
                <div className="pd-offer-alert">
                  <span className="pd-offer-alert-badge">⚡ OFFER ACTIVE</span>
                  <span className="pd-offer-alert-title">{product?.offer?.name || "Special Deal"}</span>
                  <span className="pd-offer-alert-value">
                    {pricing.discountType === "flat"
                      ? `Flat ₹${pricing.discountValue} OFF applied on MRP`
                      : `${pricing.savingsPercent}% OFF applied on MRP`}
                  </span>
                </div>
              )}

              {/* Price & Savings Badge */}
              <div className="pd-price-row">
                <span className="pd-price-current">{formatPrice(activePrice)}</span>
                {displayOriginalPrice && (
                  <>
                    <span className="pd-price-original">{formatPrice(displayOriginalPrice)}</span>
                    <span className="pd-discount-chip">
                      {isOffer
                        ? (pricing.discountType === "flat" ? `FLAT ₹${pricing.discountValue} OFF` : `SAVE ${pricing.savingsPercent}%`)
                        : `SAVE ${discountPct}%`}
                    </span>
                  </>
                )}
              </div>
              <p className="pd-tax-caption">Price inclusive of all taxes. Free express shipping available across India.</p>

              {/* Color Selector */}
              {availableColors(product).length > 0 && (
                <div className="pd-selector-block">
                  <span className="pd-selector-heading">
                    Color: <strong>{selectedColor}</strong>
                  </span>
                  <div className="pd-color-swatches">
                    {availableColors(product).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        className={`pd-color-dot ${selectedColor === c.name ? "active" : ""}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => handleColorSelect(c.name)}
                        title={c.name}
                        aria-pressed={selectedColor === c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector with Size Guide */}
              {availableSizes(product).length > 0 && (
                <div className="pd-selector-block">
                  <div className="pd-size-header">
                    <span className="pd-selector-heading">
                      Select Size: <strong>{selectedSize}</strong>
                    </span>
                    <button
                      type="button"
                      className="pd-size-guide-trigger"
                      onClick={() => setIsSizeGuideOpen(true)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.3 15.3l-6.6-6.6a1 1 0 0 0-1.4 0l-10.6 10.6a1 1 0 0 0 0 1.4l4.6 4.6a1 1 0 0 0 1.4 0l12.6-12.6a1 1 0 0 0 0-1.4z" />
                        <path d="M7.5 17.5l2-2" /><path d="M10.5 14.5l2-2" /><path d="M13.5 11.5l2-2" />
                      </svg>
                      Size Chart
                    </button>
                  </div>
                  <div className="pd-size-chips">
                    {availableSizes(product).map((s) => {
                      const isSoldOut = unavailableSizes.has(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`pd-size-chip ${selectedSize === s ? "active" : ""} ${isSoldOut ? "sold-out" : ""}`}
                          onClick={() => setSelectedSize(s)}
                          aria-pressed={selectedSize === s}
                          title={isSoldOut ? `${s} (Out of stock in ${selectedColor || "this color"})` : s}
                        >
                          {s}
                          {isSoldOut && <span className="sold-out-tag">Sold Out</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Dual Action Buttons (Add to Cart + Buy Now) */}
              <div className="pd-cta-action-group">
                <div className="pd-qty-wrapper">
                  <span className="pd-qty-title">Quantity</span>
                  <div className="pd-quantity-stepper">
                    <button
                      type="button"
                      className="pd-qty-btn"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="pd-qty-display">{isOutOfStock ? 0 : quantity}</span>
                    <button
                      type="button"
                      className="pd-qty-btn"
                      onClick={() => setQuantity((q) => Math.min(activeStockCount || 99, q + 1))}
                      disabled={isOutOfStock || (activeStockCount > 0 && quantity >= activeStockCount)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="pd-buttons-stack">
                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    className={`btn pd-add-to-cart-btn ${addedToCart ? "added" : ""}`}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock ? (
                      <span>Out of Stock</span>
                    ) : addedToCart ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Added to Cart ✓
                      </>
                    ) : (
                      <>Add to Cart</>
                    )}
                  </button>

                  {/* Buy Now Button (Instant Checkout) */}
                  <button
                    type="button"
                    className="btn btn-primary pd-buy-now-btn"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                  >
                    {isOutOfStock
                      ? "Currently Sold Out"
                      : `Buy Now ${formatPrice(activePrice * quantity)}`}
                  </button>
                </div>
              </div>

              {/* Delivery & In-Stock Availability Box */}
              <div className="pd-availability-box">
                <div
                  className={`pd-stock-badge ${
                    isOutOfStock ? "out-of-stock" : isLowStock ? "low-stock" : "in-stock"
                  }`}
                >
                  <span className="pd-stock-indicator-dot" />
                  <span>
                    {isOutOfStock
                      ? "Currently Out of Stock — Restock in progress"
                      : isLowStock
                      ? `Low Stock — Only ${activeStockCount} units remaining. Order soon!`
                      : `In Stock — Ready to ship (${activeStockCount} units available)`}
                  </span>
                </div>

                <div className="pd-delivery-perks">
                  <div className="pd-perk-row">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span><strong>Estimated Delivery:</strong> 3 – 5 Business Days with tracking</span>
                  </div>
                  <div className="pd-perk-row">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span><strong>Doorstep Delivery & 14-Day Returns:</strong> Hassle-free exchanges</span>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="pd-description-card">
                  <h3 className="pd-description-title">Product Description</h3>
                  <p className="pd-main-description-text">{product.description}</p>
                </div>
              )}

              {/* Product Specifications Table */}
              {specificationsList.length > 0 && (
                <div className="pd-specifications-card">
                  <div className="pd-spec-header-row">
                    <h3 className="pd-spec-title">PRODUCT SPECIFICATIONS</h3>
                    <span className="pd-spec-count-tag">{specificationsList.length} Specifications</span>
                  </div>
                  <div className="pd-spec-table">
                    {specificationsList.map((spec, idx) => (
                      <div key={idx} className="pd-spec-table-cell">
                        <span className="pd-spec-key">{spec.title || spec.key || spec.label || spec.name}</span>
                        <span className="pd-spec-val">{spec.value || spec.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Luxury Trust Pillars */}
              <div className="pd-trust-pillars-row">
                <div className="pd-pillar-card">
                  <div className="pd-pillar-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="pd-pillar-meta">
                    <strong>100% Genuine</strong>
                    <span>Atelier Crafted</span>
                  </div>
                </div>

                <div className="pd-pillar-card">
                  <div className="pd-pillar-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </div>
                  <div className="pd-pillar-meta">
                    <strong>14-Day Returns</strong>
                    <span>Doorstep Pickup</span>
                  </div>
                </div>

                <div className="pd-pillar-card">
                  <div className="pd-pillar-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="pd-pillar-meta">
                    <strong>Secure Checkout</strong>
                    <span>Encrypted Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer Ratings & Reviews Section ─────────────────────── */}
      <section id="customer-reviews" className="pd-reviews-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center" }}>
            <div>
              <span className="section-eyebrow">AUTHENTIC FEEDBACK</span>
            </div>
            <h2 className="section-title">Customer Ratings &amp; Reviews</h2>
            <p className="section-subtitle">
              Real opinions from verified buyers on fabric GSM, silhouette drape, and craftsmanship.
            </p>
          </div>

          {/* Rating Summary Card */}
          <div className="pd-reviews-summary-card">
            <div className="pd-reviews-score-col">
              <div className="pd-reviews-big-score">
                {totalReviewsCount > 0 ? averageRatingScore.toFixed(1) : "—"}
                <span className="pd-reviews-score-star">{totalReviewsCount > 0 ? "★" : "☆"}</span>
              </div>
              <div className="pd-reviews-stars-visual">
                {totalReviewsCount > 0
                  ? "★".repeat(Math.min(5, Math.max(1, Math.round(averageRatingScore)))) +
                    "☆".repeat(5 - Math.min(5, Math.max(1, Math.round(averageRatingScore))))
                  : "☆☆☆☆☆"}
              </div>
              <p className="pd-reviews-count-caption">
                {totalReviewsCount > 0
                  ? `Based on ${totalReviewsCount} ${totalReviewsCount === 1 ? "verified patron rating" : "verified patron ratings"}`
                  : "No customer ratings yet"}
              </p>
            </div>

            <div className="pd-reviews-breakdown-col">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = totalReviewsCount > 0 ? (reviewsData?.breakdownPercentages?.[star] ?? 0) : 0;
                const count = totalReviewsCount > 0 ? (reviewsData?.breakdown?.[star] ?? 0) : 0;
                return (
                  <div key={star} className="pd-breakdown-row">
                    <span className="pd-breakdown-label">{star}★</span>
                    <div className="pd-breakdown-track">
                      <div className="pd-breakdown-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="pd-breakdown-pct" title={`${count} reviews`}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="pd-reviews-cta-col">
              <p className="pd-reviews-cta-text">
                {reviewsData?.userEligibility?.alreadyReviewed
                  ? "✓ You have already reviewed this piece."
                  : reviewsData?.userEligibility?.reason === "not_logged_in"
                  ? "Sign in to share your experience with this piece."
                  : "Share your experience and feedback with the community."}
              </p>
              {reviewsData?.userEligibility?.canReview ? (
                <button
                  type="button"
                  className="pd-write-review-btn"
                  onClick={() => {
                    setIsWritingReview((prev) => !prev);
                    setReviewSuccessMsg("");
                    setReviewErrorMsg("");
                  }}
                >
                  {isWritingReview ? "CLOSE FORM" : "WRITE A REVIEW"}
                </button>
              ) : reviewsData?.userEligibility?.reason === "not_logged_in" ? (
                <Link
                  to="/account"
                  className="pd-write-review-btn"
                  style={{ textDecoration: "none", textAlign: "center", display: "inline-block" }}
                >
                  SIGN IN TO REVIEW
                </Link>
              ) : null}
            </div>
          </div>

          {/* Interactive Review Form Card */}
          {isWritingReview && (
            <form className="pd-review-form-card" onSubmit={handleReviewSubmit} noValidate>
              <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--color-ink)" }}>
                Write a Verified Review
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", color: "var(--color-ink)" }}>
                  Overall Rating:
                </label>
                <div className="pd-star-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`pd-star-pick-btn ${star <= (reviewFormHoverRating || reviewFormRating) ? "active" : ""}`}
                      onClick={() => setReviewFormRating(star)}
                      onMouseEnter={() => setReviewFormHoverRating(star)}
                      onMouseLeave={() => setReviewFormHoverRating(0)}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-ink)", marginLeft: "10px" }}>
                    {reviewFormHoverRating || reviewFormRating} of 5 Stars
                  </span>
                </div>
              </div>

              {!customerUser && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "5px", color: "var(--color-ink)" }}>
                    Your Name:
                  </label>
                  <input
                    type="text"
                    className="pd-review-input"
                    placeholder="e.g. Rahul S."
                    value={reviewFormName}
                    onChange={(e) => setReviewFormName(e.target.value)}
                  />
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "5px", color: "var(--color-ink)" }}>
                  Review Headline (Optional):
                </label>
                <input
                  type="text"
                  className="pd-review-input"
                  placeholder="e.g. Sublime drape and premium feel"
                  value={reviewFormTitle}
                  onChange={(e) => setReviewFormTitle(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "5px", color: "var(--color-ink)" }}>
                  Detailed Review:
                </label>
                <textarea
                  className="pd-review-textarea"
                  rows="4"
                  placeholder="Share details on fabric GSM, silhouette drape, sizing, and craftsmanship..."
                  value={reviewFormComment}
                  onChange={(e) => setReviewFormComment(e.target.value)}
                  required
                />
              </div>

              {reviewErrorMsg && (
                <p style={{ color: "#dc2626", fontSize: "12.5px", marginBottom: "12px", fontWeight: "500" }}>
                  {reviewErrorMsg}
                </p>
              )}

              <div className="pd-review-form-actions">
                <button
                  type="submit"
                  className="pd-write-review-btn"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
                </button>
                <button
                  type="button"
                  className="pd-write-review-btn pd-write-review-btn-secondary"
                  style={{ marginTop: 0 }}
                  onClick={() => setIsWritingReview(false)}
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}

          {/* Success Banner */}
          {reviewSuccessMsg && (
            <div className="pd-review-success-banner">
              ✓ {reviewSuccessMsg}
            </div>
          )}

          {/* Individual Reviews List or Empty Card */}
          {isLoadingReviews && !reviewsData ? (
            <div className="pd-reviews-list" aria-busy="true">
              {[1, 2].map((i) => (
                <div key={i} className="pd-review-item-card" style={{ opacity: 0.6 }}>
                  <div className="pd-review-item-header">
                    <div style={{ height: "16px", width: "100px", background: "var(--color-grey-200)", borderRadius: "4px" }} />
                  </div>
                  <div style={{ height: "32px", width: "75%", background: "var(--color-grey-100)", borderRadius: "4px", margin: "10px 0" }} />
                  <div style={{ height: "18px", width: "120px", background: "var(--color-grey-200)", borderRadius: "4px" }} />
                </div>
              ))}
            </div>
          ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
            <div className="pd-reviews-list">
              {reviewsData.reviews.map((rev) => {
                const ratingNum = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));
                const dateStr = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })
                  : null;
                const authorInitial = (rev.customerName || "V").charAt(0).toUpperCase();

                return (
                  <div key={rev.id} className="pd-review-item-card">
                    <div className="pd-review-item-header">
                      <div>
                        <div className="pd-review-item-stars">
                          {"★".repeat(ratingNum)}
                          {"☆".repeat(5 - ratingNum)}
                        </div>
                        {rev.title && <h4 className="pd-review-item-title">{rev.title}</h4>}
                      </div>
                      {dateStr && <span className="pd-review-item-date">{dateStr}</span>}
                    </div>

                    <p className="pd-review-item-comment">{rev.comment}</p>

                    <div className="pd-review-item-author">
                      <span className="pd-author-avatar">{authorInitial}</span>
                      <span className="pd-author-name">{rev.customerName || "Verified Customer"}</span>
                      {rev.verifiedPurchase && (
                        <span className="pd-verified-badge">✓ Verified Buyer</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pd-reviews-empty-card">
              <div className="pd-empty-diamond">✦</div>
              <h4 className="pd-empty-title">No Customer Reviews Yet</h4>
              <p className="pd-empty-subtitle">
                Be the first to share your thoughts on this atelier piece.
              </p>
              {!isWritingReview && (
                reviewsData?.userEligibility?.canReview ? (
                  <button
                    type="button"
                    className="pd-write-review-btn pd-write-review-btn-secondary"
                    onClick={() => setIsWritingReview(true)}
                  >
                    WRITE THE FIRST REVIEW
                  </button>
                ) : reviewsData?.userEligibility?.reason === "not_logged_in" ? (
                  <Link
                    to="/account"
                    className="pd-write-review-btn pd-write-review-btn-secondary"
                    style={{ textDecoration: "none", textAlign: "center", display: "inline-block" }}
                  >
                    SIGN IN TO REVIEW
                  </Link>
                ) : reviewsData?.userEligibility?.alreadyReviewed ? (
                  <span style={{ fontSize: "13px", color: "var(--color-ink-light)", fontWeight: 500 }}>
                    ✓ You have already reviewed this piece.
                  </span>
                ) : (
                  <button
                    type="button"
                    className="pd-write-review-btn pd-write-review-btn-secondary"
                    onClick={() => setIsWritingReview(true)}
                  >
                    WRITE THE FIRST REVIEW
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Recently Viewed Products Section ──────────────────────── */}
      {recentlyViewedProducts.length > 0 && (
        <section className="section-padding pd-recently-viewed-section">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">RECENTLY VIEWED</span>
              <h2 className="section-title">Explore More Pieces</h2>
              <p className="section-subtitle">
                Heavyweight staples and contemporary tailoring crafted for longevity.
              </p>
            </div>
            <div className="product-grid">
              {recentlyViewedProducts.map((p) => (
                <ProductCard key={`recent-${p.id}`} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Interactive Size Guide Modal ────────────────────────────── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        selectedSize={selectedSize}
      />

      {/* ── Interactive Image Preview Modal (Lightbox) ─────────────── */}
      {previewImage && (
        <div className="pd-modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="pd-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pd-lightbox-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Close image preview"
            >
              ✕
            </button>
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="pd-lightbox-arrow pd-lightbox-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    const curIdx = galleryImages.indexOf(previewImage);
                    const prevIdx = curIdx > 0 ? curIdx - 1 : galleryImages.length - 1;
                    setPreviewImage(galleryImages[prevIdx]);
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="pd-lightbox-arrow pd-lightbox-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    const curIdx = galleryImages.indexOf(previewImage);
                    const nextIdx = curIdx < galleryImages.length - 1 ? curIdx + 1 : 0;
                    setPreviewImage(galleryImages[nextIdx]);
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
            <img src={imageUrl(previewImage)} alt={`${product.name} enlarged`} className="pd-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
