import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { ShopProvider, useShop } from "./context/ShopContext";
import { isCategoryMatch, resolveFallbackCategory } from "./utils/categoryFallback";
import { imageUrl } from "./utils/imageUrl";
import "./styles/global.css";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import SocialFloatWidget from "./components/Widgets/SocialFloatWidget";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ComingSoon from "./pages/ComingSoon";
import ProductDetail from "./pages/ProductDetail";

import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ReturnRefundPolicy from "./pages/ReturnRefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import SizeGuide from "./pages/SizeGuide";
import CustomerProfile from "./pages/CustomerProfile";

// Modals & Drawers (lazy-loaded for performance) — these only render on
// demand, so lazy-loading does not cause any navigation/route flash.
const CartDrawer = lazy(() => import("./components/Modals/CartDrawer"));
const WishlistDrawer = lazy(() => import("./components/Modals/WishlistDrawer"));
const QuickViewModal = lazy(() => import("./components/Modals/QuickViewModal"));
const SearchModal = lazy(() => import("./components/Modals/SearchModal"));
const AuthModal = lazy(() => import("./components/Modals/AuthModal"));
const OrderTrackModal = lazy(() => import("./components/Modals/OrderTrackModal"));
const LightboxModal = lazy(() => import("./components/Modals/LightboxModal"));
const ToastContainer = lazy(() => import("./components/Widgets/ToastContainer"));
const FirstVisitModal = lazy(() => import("./components/Modals/FirstVisitModal"));

/**
 * CategoryRedirect preserves any existing query parameters when redirecting
 * from legacy paths like /men?category=Oversized%20T-Shirts to /collection?category=Oversized%20T-Shirts.
 */
function CategoryAliasRedirect() {
  const { categorySlug, subcategorySlug } = useParams();
  const target = subcategorySlug
    ? `/categories/${categorySlug}/${subcategorySlug}`
    : `/categories/${categorySlug}`;
  return <Navigate to={target} replace />;
}

function CategoryRedirect({ defaultCategory, defaultCollection }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { homeData } = useShop();

  const homeCategories = homeData?.categories || [];
  let resolvedCategory = defaultCategory;

  if (defaultCategory && homeCategories.length > 0) {
    const exists = homeCategories.some((c) => isCategoryMatch(c.slug, defaultCategory));
    if (!exists) {
      const fallbackCat = resolveFallbackCategory(defaultCategory, homeCategories);
      if (fallbackCat?.slug) {
        resolvedCategory = fallbackCat.slug === "men" ? "mens" : fallbackCat.slug;
      }
    }
  }

  if (resolvedCategory && !searchParams.has("category")) {
    searchParams.set("category", resolvedCategory);
  }
  if (defaultCollection && !searchParams.has("collection")) {
    searchParams.set("collection", defaultCollection);
  }

  // If redirecting a standard category without other query filters, send to clean canonical URL
  if (resolvedCategory && !defaultCollection && Array.from(searchParams.keys()).length === 1 && searchParams.get("category") === resolvedCategory) {
    return <Navigate to={`/categories/${resolvedCategory}`} replace />;
  }

  const query = searchParams.toString();
  return <Navigate to={`/collection${query ? `?${query}` : ""}`} replace />;
}

/** Keep the unfiltered catalog from exposing the former Shop All page. */
function CollectionEntry() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");

  if ((!category || category.toLowerCase() === "all") && !collection) {
    searchParams.set("category", "mens");
    return <Navigate to={`/collection?${searchParams.toString()}`} replace />;
  }

  return <Collection />;
}

function AuthRouteHandler({ state }) {
  const { setAuthModalState } = useShop();
  useEffect(() => {
    setAuthModalState(state);
  }, [state, setAuthModalState]);
  return <Navigate to="/" replace />;
}

function AppLoadingManager() {
  const { storefrontStatus, homeData } = useShop();

  useEffect(() => {
    if (storefrontStatus === "loading") return;

    let isCancelled = false;

    // Failsafe timer so the user is never kept waiting longer than 1.8s once status is ready
    const fallbackTimer = setTimeout(() => {
      performDismiss();
    }, 1800);

    const performDismiss = () => {
      if (isCancelled) return;
      clearTimeout(fallbackTimer);
      // Double rAF ensures the browser DOM updates and styles have rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isCancelled && typeof window.__dismissZmwLoader === "function") {
            window.__dismissZmwLoader();
          }
        });
      });
    };

    const checkFullPageReady = () => {
      if (isCancelled) return;

      if (document.readyState !== "complete") {
        window.addEventListener("load", checkFullPageReady, { once: true });
        return;
      }

      // Check critical above-the-fold hero image if available
      const heroBanner =
        homeData?.banners?.hero?.[0] ||
        homeData?.banners?.home_hero?.[0];
      const heroRawImg = heroBanner?.image_url || "/images/dept-family-banner.jpg";
      const resolvedHeroUrl = heroRawImg ? imageUrl(heroRawImg) : null;

      if (resolvedHeroUrl && typeof window !== "undefined") {
        const img = new Image();
        img.src = resolvedHeroUrl;
        if (img.complete) {
          performDismiss();
        } else {
          img.onload = performDismiss;
          img.onerror = performDismiss;
        }
      } else {
        performDismiss();
      }
    };

    checkFullPageReady();

    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [storefrontStatus, homeData]);

  return null;
}

export default function App() {
  return (
    <ShopProvider>
      <AppLoadingManager />
      <ScrollToTop />
      <Navbar />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<CollectionEntry />} />
          <Route path="/shop-all" element={<Navigate to="/categories/mens" replace />} />

          {/* Clean SEO-friendly Category URLs & Subcategories */}
          <Route path="/categories/:categorySlug" element={<Collection />} />
          <Route path="/categories/:categorySlug/:subcategorySlug" element={<Collection />} />
          <Route path="/category/:categorySlug" element={<CategoryAliasRedirect />} />
          <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryAliasRedirect />} />

          {/* Query-preserving category redirects */}
          <Route path="/men" element={<CategoryRedirect defaultCategory="mens" />} />
          <Route path="/mens" element={<CategoryRedirect defaultCategory="mens" />} />
          <Route path="/women" element={<CategoryRedirect defaultCategory="women" />} />
          <Route path="/kids" element={<CategoryRedirect defaultCategory="kids" />} />
          <Route path="/boys" element={<CategoryRedirect defaultCategory="boys" />} />
          <Route path="/girls" element={<CategoryRedirect defaultCategory="girls" />} />
          <Route path="/babies" element={<CategoryRedirect defaultCategory="babies" />} />
          <Route path="/best-sellers" element={<CategoryRedirect defaultCollection="best-sellers" />} />
          <Route path="/best-seller" element={<CategoryRedirect defaultCollection="best-sellers" />} />
          <Route path="/new-arrivals" element={<CategoryRedirect defaultCollection="new-arrivals" />} />
          <Route path="/new-arrival" element={<CategoryRedirect defaultCollection="new-arrivals" />} />

          {/* New Informational & Policy Pages */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/return-refund-policy" element={<ReturnRefundPolicy />} />
          <Route path="/returns" element={<ReturnRefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/size-chart" element={<SizeGuide />} />

          {/* SEO-friendly Product URLs */}
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<CustomerProfile />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/my-orders" element={<CustomerProfile />} />
          <Route path="/login" element={<AuthRouteHandler state="login" />} />
          <Route path="/register" element={<AuthRouteHandler state="register" />} />
          <Route path="/signup" element={<AuthRouteHandler state="register" />} />
          <Route path="/forgot-password" element={<AuthRouteHandler state="forgot" />} />
          <Route path="/reset-password" element={<AuthRouteHandler state="forgot" />} />
          <Route path="*" element={<ComingSoon title="Page Not Found" />} />
        </Routes>
      </main>

      <Footer />

      <SocialFloatWidget />

      {/* Global Interactive Layer — Modals, Drawers, Toasts */}
      <Suspense fallback={null}>
        <CartDrawer />
        <WishlistDrawer />
        <QuickViewModal />
        <SearchModal />
        <AuthModal />
        <OrderTrackModal />
        <LightboxModal />
        <ToastContainer />
        <FirstVisitModal />
      </Suspense>
    </ShopProvider>
  );
}
