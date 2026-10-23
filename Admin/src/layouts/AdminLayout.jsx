import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Shirt,
  FolderTree,
  Tags,
  Image as ImageIcon,
  ShoppingBag,
  Mail,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Tag,
  TrendingUp,
  ExternalLink,
  Layers,
  Package2,
  Truck,
  Star,
  Sparkles,
  Percent,
  Network
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/reports", label: "Reports & Analytics", icon: TrendingUp }
    ]
  },

    {
    title: "Banners",
    items: [
      { to: "/banners", label: "Hero & Banners", icon: ImageIcon },
      { to: "/offer-banners", label: "Offer Banners", icon: Sparkles },
      { to: "/offers", label: "Product Offers", icon: Percent },
      { to: "/coupons", label: "Coupons & Discounts", icon: Tag }
    ]
  },

  {
    title: "Catalog Management",
    items: [
      { to: "/products", label: "Products", icon: Shirt },
      { to: "/categories", label: "Categories", icon: FolderTree },
      { to: "/subcategories", label: "Sub Categories", icon: Tags },
      { to: "/variants", label: "Variants", icon: Layers },
      { to: "/stock", label: "Stock Management", icon: Package2 }
    ]
  },
  {
    title: "Sales & Orders",
    items: [
      { to: "/orders", label: "Orders", icon: ShoppingBag },
      { to: "/shipping", label: "Shipping", icon: Truck },
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/contact", label: "Customer Inquiries", icon: Mail },
      { to: "/reviews", label: "Reviews", icon: Star }
    ]
  },
  {
    title: "SEO & Settings",
    items: [
      { to: "/seo", label: "Meta Settings", icon: Tag, end: true },
      { to: "/seo/sitemap", label: "Sitemap", icon: Network }
    ]
  }
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Current section title for breadcrumb
  const allNavItems = NAV_SECTIONS.flatMap((sec) => sec.items);
  const currentItem = allNavItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop */}
      {mobileNavOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Grouped Sidebar */}
      <aside className={`admin-sidebar ${mobileNavOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand">
          <div className="admin-brand-center">
            <img
              src="/images/zmw-logo-transparent.png"
              alt="ZMW Clothing"
              className="admin-sidebar-logo-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span className="admin-brand-badge">ADMIN</span>
          </div>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="admin-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="admin-nav-group">
              <div className="admin-nav-section-title">{section.title}</div>
              <div className="admin-nav-group-items">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        "admin-nav-link" + (isActive ? " active" : "")
                      }
                    >
                      <span className="admin-nav-icon-wrap">
                        <Icon size={17} className="admin-nav-icon" />
                      </span>
                      <span className="admin-nav-text">{item.label}</span>
                      <span className="admin-nav-active-pip" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout Card Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-profile-footer-card">
            <div className="admin-footer-avatar">AD</div>
            <div className="admin-footer-meta">
              <span className="admin-footer-name">ZMW Administrator</span>
              <span className="admin-footer-role">Super Admin</span>
            </div>
            <button
              type="button"
              className="admin-footer-logout-btn"
              onClick={logout}
              title="Sign out of Admin Portal"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <div className="admin-breadcrumbs">
              <span className="breadcrumb-root">Admin Console</span>
              <ChevronRight size={14} className="breadcrumb-arrow" />
              <span className="breadcrumb-current">{currentItem?.label || "Console"}</span>
            </div>
          </div>

          <div className="admin-header-user">

            <div className="admin-profile-pill">
              <div className="admin-avatar">
                AD
              </div>
              <div className="admin-profile-info">
                <span className="admin-profile-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
