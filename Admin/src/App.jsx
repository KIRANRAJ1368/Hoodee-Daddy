import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import CategoriesPage from "./pages/Categories/CategoriesPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ProductFormPage from "./pages/Products/ProductFormPage";
import InventoryPage from "./pages/Inventory/InventoryPage";
import VariantManagementPage from "./pages/Variants/VariantManagementPage";
import StockManagementPage from "./pages/Stock/StockManagementPage";
import BannersPage from "./pages/Banners/BannersPage";
import AnnouncementsPage from "./pages/Announcements/AnnouncementsPage";
import HomepageSectionsPage from "./pages/HomepageSections/HomepageSectionsPage";
import OrdersPage from "./pages/Orders/OrdersPage";
import OrderDetailPage from "./pages/Orders/OrderDetailPage";
import ShippingPage from "./pages/Shipping/ShippingPage";
import ShippingDetailPage from "./pages/Shipping/ShippingDetailPage";
import CustomersPage from "./pages/Customers/CustomersPage";
import ContactPage from "./pages/Contact/ContactPage";
import CouponsPage from "./pages/Coupons/CouponsPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import ReviewsPage from "./pages/Reviews/ReviewsPage";
import OffersPage from "./pages/Offers/OffersPage";
import OfferBannersPage from "./pages/Banners/OfferBannersPage";
import SeoSettingsPage from "./pages/Seo/SeoSettingsPage";
import MetaSettingsPage from "./pages/Seo/MetaSettingsPage";
import SitemapPage from "./pages/Seo/SitemapPage";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="variants" element={<VariantManagementPage />} />
            <Route path="stock" element={<StockManagementPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="offer-banners" element={<OfferBannersPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="homepage-sections" element={<HomepageSectionsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="shipping" element={<ShippingPage />} />
            <Route path="shipping/:id" element={<ShippingDetailPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="seo" element={<MetaSettingsPage />} />
            <Route path="seo/meta" element={<MetaSettingsPage />} />
            <Route path="seo/sitemap" element={<SitemapPage />} />
            <Route path="seo/general" element={<SeoSettingsPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
