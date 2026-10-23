import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Sparkles,
  Shirt,
  Image as ImageIcon,
  Flame,
  Clock,
  Edit3,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  ShoppingBag
} from "lucide-react";
import { homepageApi, productsApi, categoriesApi, bannersApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { resolveImageUrl } from "../../utils/imageUrl";
import ImageUploadField from "../../components/ImageUploadField/ImageUploadField";
import LoadingState from "../../components/LoadingState/LoadingState";
import "./HomepageSectionsPage.css";

// Section definitions with human-friendly descriptions and metadata
const SECTION_METADATA = {
  hero: {
    name: "Hero Banners Slider",
    category: "Hero Showcase",
    description: "The primary rotating visual banners displayed at the very top of the homepage to showcase new collections and flagship promotions.",
    icon: ImageIcon,
    manageLink: "/banners"
  },
  category_visuals: {
    name: "Explore by Department",
    category: "Visual Navigation",
    description: "The 5 flagship visual department cards (Men, Women, Boys, Girls, Babies). This block is currently hidden from the storefront home page; its configuration is kept here for reference.",
    icon: Layers
  },
  new_arrivals: {
    name: "New Arrivals Drop",
    category: "Curated Showcase",
    description: "Showcases the latest apparel drops. Choose automatic mode (recent items) or hand-pick specific products to feature.",
    icon: Clock
  },
  mens_categories: {
    name: "Men Categories Showcase",
    category: "Department Feature",
    description: "Features Men's department headline, tagline, and subcategory filter pills connected directly to the database.",
    categorySlug: "mens",
    icon: Shirt
  },
  womens_categories: {
    name: "Women Categories Showcase",
    category: "Department Feature",
    description: "Features Women's department headline, tagline, and subcategory filter pills connected directly to the database.",
    categorySlug: "women",
    icon: Shirt
  },
  boys_categories: {
    name: "Boys Categories Showcase",
    category: "Department Feature",
    description: "Features Boys' department headline, tagline, and subcategory filter pills connected directly to the database.",
    categorySlug: "boys",
    icon: Shirt
  },
  girls_categories: {
    name: "Girls Categories Showcase",
    category: "Department Feature",
    description: "Features Girls' department headline, tagline, and subcategory filter pills connected directly to the database.",
    categorySlug: "girls",
    icon: Shirt
  },
  babies_categories: {
    name: "Babies Categories Showcase",
    category: "Department Feature",
    description: "Features Babies' department headline, tagline, and subcategory filter pills connected directly to the database.",
    categorySlug: "babies",
    icon: Shirt
  },
  best_sellers: {
    name: "Best Sellers Collection",
    category: "Curated Showcase",
    description: "Showcases high-demand customer favorites. Automatically pulls top-reviewed products or allows custom selection.",
    icon: Flame
  }
};

const DEFAULT_DEPARTMENTS = [
  {
    id: "cat-men",
    badge: "⚡ TRENDING",
    title: "MEN",
    subtitle: "Oversized Tees, Polos & Hoodies",
    cta: "Shop Men",
    image: "/images/dept-mens.jpg",
    link: "/men",
    is_active: true
  },
  {
    id: "cat-women",
    badge: "🔥 HOT DROP",
    title: "WOMEN",
    subtitle: "Crop Tops, Tees & Chic Fits",
    cta: "Explore Women",
    image: "/images/dept-womens.jpg",
    link: "/women",
    is_active: true
  },
  {
    id: "cat-boys",
    badge: "✨ STREETWEAR",
    title: "BOYS",
    subtitle: "Skate Tees, Sets & Shorts",
    cta: "Shop Boys",
    image: "/images/dept-boys.jpg",
    link: "/kids?category=Boys",
    is_active: true
  },
  {
    id: "cat-girls",
    badge: "🌸 NEW STYLES",
    title: "GIRLS",
    subtitle: "Dresses, Sets & Pretty Tees",
    cta: "Shop Girls",
    image: "/images/dept-girls.jpg",
    link: "/kids?category=Girls",
    is_active: true
  },
  {
    id: "cat-babies",
    badge: "🍼 100% SOFT",
    title: "BABIES",
    subtitle: "Rompers, Pyjamas & Soft Knits",
    cta: "Shop Babies",
    image: "/images/dept-babies.jpg",
    link: "/kids?category=Babies",
    is_active: true
  }
];

export default function HomepageSectionsPage() {
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [heroBanners, setHeroBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // { type: 'curated' | 'department' | 'category' | 'hero', section }
  const toast = useToast();

  async function loadData() {
    setIsLoading(true);
    try {
      const [secRes, catRes, prodRes, banRes] = await Promise.all([
        homepageApi.sections(),
        categoriesApi.list(),
        productsApi.list({ limit: 100 }),
        bannersApi.list()
      ]);
      setSections(secRes.data || []);
      setCategories(catRes.data || []);
      setAllProducts(prodRes.data || []);
      setHeroBanners(banRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load storefront configuration");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleActive(section, is_active) {
    setSavingKey(section.section_key);
    try {
      const { data } = await homepageApi.updateSection(section.section_key, { is_active });
      setSections((prev) => prev.map((s) => (s.section_key === section.section_key ? data : s)));
      toast.success(
        is_active
          ? `"${SECTION_METADATA[section.section_key]?.name || section.section_key}" is now LIVE on storefront`
          : `"${SECTION_METADATA[section.section_key]?.name || section.section_key}" is now hidden`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveSection(sectionKey, changes) {
    setSavingKey(sectionKey);
    try {
      const { data } = await homepageApi.updateSection(sectionKey, changes);
      setSections((prev) => prev.map((s) => (s.section_key === sectionKey ? data : s)));
      toast.success("Section updated successfully");
      setActiveModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to save section changes");
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading) return <LoadingState label="Loading Storefront Homepage control center..." />;

  // Display only the primary 9 homepage sections in storefront order.
  // "category_visuals" is still listed here so it stays fully manageable,
  // even though the storefront no longer renders it on the home page.
  const ORDERED_KEYS = [
    "hero",
    "new_arrivals",
    "mens_categories",
    "womens_categories",
    "boys_categories",
    "girls_categories",
    "babies_categories",
    "best_sellers",
    "category_visuals"
  ];

  const primarySections = ORDERED_KEYS.map((key) => {
    const found = sections.find((s) => s.section_key === key);
    return found || { section_key: key, is_active: true, sort_order: ORDERED_KEYS.indexOf(key), title: "", config: {} };
  });

  return (
    <div className="storefront-homepage-page">
      {/* Page Header */}
      <div className="storefront-header">
        <div className="header-text-group">
          <div className="header-badge-row">
            <span className="live-status-pill">
              <span className="live-indicator-dot" />
              Storefront Control
            </span>
            <span className="pill-badge badge-gold">{primarySections.filter((s) => s.is_active).length} of {primarySections.length} Sections Active</span>
          </div>
          <h1 className="page-title">Storefront Homepage Management</h1>
          <p className="page-subtitle">
            Manage, reorder, and configure dynamic content for every section of your customer-facing homepage. Changes reflect instantly on your live store.
          </p>
        </div>
      </div>

      {/* Main Section Cards List */}
      <div className="homepage-sections-grid">
        {primarySections.map((section, idx) => {
          const meta = SECTION_METADATA[section.section_key] || {
            name: section.title || section.section_key,
            description: "Storefront Homepage Block",
            icon: Layers
          };
          const IconComponent = meta.icon;

          return (
            <SectionCard
              key={section.section_key}
              index={idx + 1}
              section={section}
              meta={meta}
              icon={IconComponent}
              isSaving={savingKey === section.section_key}
              allProducts={allProducts}
              categories={categories}
              heroBanners={heroBanners}
              onToggle={(active) => handleToggleActive(section, active)}
              onEdit={() => setActiveModal({ type: getModalType(section.section_key), section })}
            />
          );
        })}
      </div>

      {/* Static Invariant Notice */}
      <div className="static-sections-notice">
        <div className="static-notice-icon">
          <ShoppingBag size={20} />
        </div>
        <div className="static-notice-content">
          <h4>Static Brand Elements</h4>
          <p>
            The <strong>Shopping Benefits Banner</strong> (Free Shipping, Express Delivery, Easy Returns, Secure Payment) and the <strong>Global Storefront Footer</strong> are permanent brand trust anchors and remain active on your storefront at all times.
          </p>
        </div>
      </div>

      {/* Dynamic Edit Modals */}
      {activeModal && activeModal.type === "department" && (
        <DepartmentModal
          section={activeModal.section}
          isSaving={savingKey === activeModal.section.section_key}
          onClose={() => setActiveModal(null)}
          onSave={(changes) => handleSaveSection(activeModal.section.section_key, changes)}
        />
      )}

      {activeModal && activeModal.type === "curated" && (
        <CuratedProductsModal
          section={activeModal.section}
          allProducts={allProducts}
          isSaving={savingKey === activeModal.section.section_key}
          onClose={() => setActiveModal(null)}
          onSave={(changes) => handleSaveSection(activeModal.section.section_key, changes)}
        />
      )}

      {activeModal && activeModal.type === "category" && (
        <CategoryModal
          section={activeModal.section}
          categories={categories}
          isSaving={savingKey === activeModal.section.section_key}
          onClose={() => setActiveModal(null)}
          onSave={(changes) => handleSaveSection(activeModal.section.section_key, changes)}
        />
      )}

      {activeModal && activeModal.type === "hero" && (
        <HeroModal
          section={activeModal.section}
          heroBanners={heroBanners}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

function getModalType(key) {
  if (key === "hero") return "hero";
  if (key === "category_visuals") return "department";
  if (key === "new_arrivals" || key === "best_sellers") return "curated";
  return "category";
}

// ── Individual Section Card ──
function SectionCard({
  index,
  section,
  meta,
  icon: Icon,
  isSaving,
  allProducts,
  categories,
  heroBanners,
  onToggle,
  onEdit
}) {
  const isActive = Boolean(section.is_active);

  return (
    <div className={`section-manage-card card ${isActive ? "card-live" : "card-disabled"}`}>
      {/* Top Bar: Sequence + Name + Toggle */}
      <div className="card-top-bar">
        <div className="section-title-wrap">
          <span className="sequence-badge">{index}</span>
          <div className="section-icon-box">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="section-name">{meta.name}</h3>
            <span className="section-type-tag">{meta.category}</span>
          </div>
        </div>

        <div className="card-actions-top">
          <label className="toggle-switch-compact" title={isActive ? "Visible on homepage" : "Hidden from homepage"}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => onToggle(e.target.checked)}
              disabled={isSaving}
            />
            <span />
          </label>
          <span className={`status-pill ${isActive ? "pill-live" : "pill-off"}`}>
            {isActive ? "LIVE" : "OFF"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="section-description">{meta.description}</p>

      {/* Preview Container */}
      <div className="section-preview-container">
        {!isActive ? (
          <div className="preview-empty-state">
            <EyeOff size={16} />
            <span>Section is currently OFF • Hidden from storefront visitors</span>
          </div>
        ) : (
          <SectionPreviewContent
            sectionKey={section.section_key}
            section={section}
            allProducts={allProducts}
            categories={categories}
            heroBanners={heroBanners}
          />
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="card-bottom-footer">
        <div className="footer-status-text">
          {isActive ? (
            <span className="text-success-hint">
              <CheckCircle2 size={13} /> Active on storefront
            </span>
          ) : (
            <span className="text-off-hint">
              <AlertCircle size={13} /> Disabled
            </span>
          )}
        </div>

        <button type="button" className="btn btn-secondary btn-sm btn-edit-section" onClick={onEdit}>
          <Edit3 size={14} />
          <span>Edit Section Content</span>
        </button>
      </div>
    </div>
  );
}

// ── Preview Content Renderer ──
function SectionPreviewContent({ sectionKey, section, allProducts, categories, heroBanners }) {
  if (sectionKey === "hero") {
    const activeBanners = heroBanners.filter((b) => b.is_active && ["hero", "home_hero"].includes(b.placement));
    return (
      <div className="preview-hero-strip">
        <span className="preview-summary-label">
          {activeBanners.length} active hero {activeBanners.length === 1 ? "banner" : "banners"} rotating
        </span>
        <div className="preview-banner-thumbnails">
          {activeBanners.slice(0, 4).map((b, i) => (
            <div key={b.id || i} className="preview-banner-thumb">
              <img src={resolveImageUrl(b.image_url)} alt={b.title || "Banner"} />
              <span className="thumb-title">{b.title || `Slide ${i + 1}`}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sectionKey === "category_visuals") {
    const depts = section.config?.departments || DEFAULT_DEPARTMENTS;
    const activeCount = depts.filter((d) => d.is_active !== false).length;
    return (
      <div className="preview-depts-strip">
        <div className="preview-summary-row">
          <span className="preview-summary-label">Department Cards ({activeCount} active):</span>
          <span className="preview-heading-preview">"{section.title || "Explore by Department"}"</span>
        </div>
        <div className="preview-dept-chips">
          {depts.map((d, i) => (
            <span
              key={d.id || i}
              className={`preview-dept-chip ${d.is_active !== false ? "chip-active" : "chip-disabled"}`}
            >
              <span className="chip-badge">{d.badge || "TAG"}</span>
              <strong>{d.title}</strong>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (sectionKey === "new_arrivals" || sectionKey === "best_sellers") {
    const mode = section.config?.mode || "auto";
    const limit = section.config?.limit || 8;
    const isManual = mode === "manual";
    const manualIds = section.config?.product_ids || [];

    let displayProducts = [];
    if (isManual) {
      displayProducts = allProducts.filter((p) => manualIds.includes(p.id));
    } else if (sectionKey === "new_arrivals") {
      displayProducts = allProducts.filter((p) => p.isNewArrival).slice(0, limit);
      if (displayProducts.length === 0) displayProducts = allProducts.slice(0, limit);
    } else {
      displayProducts = allProducts.filter((p) => p.isBestSeller).slice(0, limit);
      if (displayProducts.length === 0) displayProducts = allProducts.slice(0, limit);
    }

    if (isManual && displayProducts.length === 0) {
      return (
        <div className="preview-empty-state">
          <AlertCircle size={16} />
          <span>Manual mode selected, but no products are selected. Click Edit to pick items.</span>
        </div>
      );
    }

    return (
      <div className="preview-curated-strip">
        <div className="curated-meta-row">
          <span className="preview-summary-label">
            Mode: <strong>{isManual ? "🎯 Manual Product Selection" : "⚡ Automatic (Latest / Top Rated)"}</strong>
          </span>
          <span className="curated-count-badge">{displayProducts.length} items shown (Limit: {limit})</span>
        </div>
        <div className="preview-product-scroll">
          {displayProducts.slice(0, 5).map((p) => (
            <div key={p.id} className="preview-product-card">
              <img src={resolveImageUrl(p.image || p.images?.[0])} alt={p.name} />
              <div className="preview-product-info">
                <span className="preview-p-name">{p.name}</span>
                <span className="preview-p-price">₹{p.price}</span>
              </div>
            </div>
          ))}
          {displayProducts.length > 5 && (
            <div className="preview-more-card">+{displayProducts.length - 5} more</div>
          )}
        </div>
      </div>
    );
  }

  // Category feature section preview (Men, Women, Boys, Girls, Babies)
  const meta = SECTION_METADATA[sectionKey];
  const catSlug = meta?.categorySlug || "mens";
  const matchedCategory = categories.find(
    (c) => c.slug?.toLowerCase() === catSlug.toLowerCase() || c.name?.toLowerCase().includes(catSlug)
  );
  const subcats = matchedCategory?.subcategories || [];

  return (
    <div className="preview-category-strip">
      <div className="preview-summary-row">
        <span className="preview-summary-label">
          Heading: <strong>"{section.title || matchedCategory?.name || "Department Edit"}"</strong>
        </span>
        <span className="cat-db-source-tag">Connected to DB Category: {matchedCategory?.name || catSlug}</span>
      </div>
      <div className="subcat-pills-row">
        {subcats.length > 0 ? (
          subcats.map((sc) => (
            <span key={sc.id} className="subcat-preview-pill">
              {sc.name}
            </span>
          ))
        ) : (
          <span className="no-subcats-hint">No active subcategories found for this category</span>
        )}
      </div>
    </div>
  );
}

// ── Modal 1: Explore by Department Modal ──
function DepartmentModal({ section, isSaving, onClose, onSave }) {
  const initialDepts = section.config?.departments && section.config.departments.length > 0
    ? section.config.departments
    : DEFAULT_DEPARTMENTS;

  const [title, setTitle] = useState(section.title || "Explore by Department");
  const [subtitle, setSubtitle] = useState(
    section.subtitle || "Curated wardrobe essentials crafted for iconic style — Men, Women, Boys, Girls & Babies."
  );
  const [departments, setDepartments] = useState(initialDepts);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  function updateDepartment(field, val) {
    setDepartments((prev) =>
      prev.map((d, i) => (i === activeTabIdx ? { ...d, [field]: val } : d))
    );
  }

  const currentDept = departments[activeTabIdx] || departments[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Edit "Explore by Department" Cards</h3>
            <p className="modal-subtitle">
              Manage imagery, titles, short tags, and visibility for the 5 flagship department cards.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Section Heading & Subtitle */}
          <div className="form-grid" style={{ marginBottom: 20 }}>
            <div className="field">
              <label>Section Heading Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Explore by Department"
              />
            </div>
            <div className="field">
              <label>Section Subtitle / Tagline</label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Curated wardrobe essentials crafted for iconic style"
              />
            </div>
          </div>

          {/* Department Tabs */}
          <div className="dept-tabs-nav">
            {departments.map((dept, idx) => (
              <button
                key={dept.id || idx}
                type="button"
                className={`dept-tab-btn ${activeTabIdx === idx ? "active" : ""}`}
                onClick={() => setActiveTabIdx(idx)}
              >
                <span>{dept.title || `Card ${idx + 1}`}</span>
                {dept.is_active === false && <span className="tab-off-pill">OFF</span>}
              </button>
            ))}
          </div>

          {/* Active Card Edit Form */}
          <div className="dept-card-edit-box card">
            <div className="dept-card-edit-header">
              <div className="dept-card-title-row">
                <h4>Editing {currentDept.title} Card</h4>
                <label className="checkbox-row" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={currentDept.is_active !== false}
                    onChange={(e) => updateDepartment("is_active", e.target.checked)}
                  />
                  <span>Show Card on Homepage</span>
                </label>
              </div>
            </div>

            <div className="dept-card-form-grid">
              <div className="dept-form-left">
                <div className="field">
                  <label>Department Title</label>
                  <input
                    value={currentDept.title}
                    onChange={(e) => updateDepartment("title", e.target.value)}
                    placeholder="e.g. MEN"
                  />
                </div>

                <div className="field">
                  <label>Short Tag / Badge</label>
                  <input
                    value={currentDept.badge}
                    onChange={(e) => updateDepartment("badge", e.target.value)}
                    placeholder="e.g. ⚡ TRENDING, 🔥 HOT DROP"
                  />
                </div>

                <div className="field">
                  <label>Description Subtitle</label>
                  <input
                    value={currentDept.subtitle}
                    onChange={(e) => updateDepartment("subtitle", e.target.value)}
                    placeholder="e.g. Oversized Tees, Polos & Hoodies"
                  />
                </div>

                <div className="field">
                  <label>Button CTA Label</label>
                  <input
                    value={currentDept.cta}
                    onChange={(e) => updateDepartment("cta", e.target.value)}
                    placeholder="e.g. Shop Men"
                  />
                </div>
              </div>

              <div className="dept-form-right">
                <ImageUploadField
                  label="Department Card Image"
                  value={currentDept.image}
                  onChange={(url) => updateDepartment("image", url)}
                  folder="departments"
                  aspectRatio="4/5"
                  previewHeight={180}
                  hint="High-resolution fashion photo (Portrait 4:5 ratio)"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-accent"
            disabled={isSaving}
            onClick={() =>
              onSave({
                title,
                subtitle,
                config: { ...(section.config || {}), departments }
              })
            }
          >
            {isSaving ? "Saving Changes..." : "Save Department Cards"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal 2: Curated Products Modal (New Arrivals & Best Sellers) ──
function CuratedProductsModal({ section, allProducts, isSaving, onClose, onSave }) {
  const isNewArrivals = section.section_key === "new_arrivals";
  const defaultTitle = isNewArrivals ? "New Arrivals" : "Best Sellers";
  const defaultSubtitle = isNewArrivals
    ? "Freshly dropped streetwear silhouettes and limited editions"
    : "Most coveted designs, verified customer favorites";

  const [title, setTitle] = useState(section.title || defaultTitle);
  const [subtitle, setSubtitle] = useState(section.subtitle || defaultSubtitle);
  const [mode, setMode] = useState(section.config?.mode || "auto");
  const [limit, setLimit] = useState(section.config?.limit || 8);
  const [selectedIds, setSelectedIds] = useState(section.config?.product_ids || []);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  }, [allProducts, searchQuery]);

  function toggleProduct(productId) {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Configure {defaultTitle} Section</h3>
            <p className="modal-subtitle">
              Choose whether to display automatic catalog picks or hand-selected products.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Title & Subtitle */}
          <div className="form-grid" style={{ marginBottom: 20 }}>
            <div className="field">
              <label>Section Heading Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${defaultTitle}`}
              />
            </div>
            <div className="field">
              <label>Section Subtitle / Tagline</label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Handcrafted luxury streetwear drops"
              />
            </div>
          </div>

          {/* Mode Selector */}
          <div className="curated-mode-selector">
            <label className="mode-selector-label">Product Selection Mode:</label>
            <div className="mode-options-grid">
              <label className={`mode-option-card ${mode === "auto" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="curated_mode"
                  value="auto"
                  checked={mode === "auto"}
                  onChange={() => setMode("auto")}
                />
                <div className="mode-card-content">
                  <div className="mode-card-title-row">
                    <Sparkles size={16} />
                    <strong>⚡ Automatic Selection (Recommended)</strong>
                  </div>
                  <p>
                    {isNewArrivals
                      ? "Automatically shows products marked as New Arrival or the most recently added items."
                      : "Automatically shows products marked as Best Seller or items with the highest review scores."}
                  </p>
                </div>
              </label>

              <label className={`mode-option-card ${mode === "manual" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="curated_mode"
                  value="manual"
                  checked={mode === "manual"}
                  onChange={() => setMode("manual")}
                />
                <div className="mode-card-content">
                  <div className="mode-card-title-row">
                    <CheckCircle2 size={16} />
                    <strong>🎯 Manual Product Selection</strong>
                  </div>
                  <p>Hand-pick the exact products you want to feature from your active catalog checklist below.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Display Limit Dropdown */}
          <div className="curated-limit-row">
            <label>Maximum items to display on storefront:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="limit-dropdown"
            >
              <option value={4}>4 Products</option>
              <option value={8}>8 Products (Standard)</option>
              <option value={12}>12 Products</option>
              <option value={16}>16 Products</option>
            </select>
          </div>

          {/* Manual Checklist Selector */}
          {mode === "manual" && (
            <div className="manual-product-picker">
              <div className="picker-header">
                <span className="picker-title">
                  Catalog Checklist ({selectedIds.length} products selected)
                </span>
                <div className="picker-search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, category, or SKU..."
                  />
                </div>
              </div>

              <div className="picker-list-scroll">
                {filteredProducts.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`picker-product-row ${isChecked ? "is-selected" : ""}`}
                      onClick={() => toggleProduct(p.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <img
                        src={resolveImageUrl(p.image || p.images?.[0])}
                        alt={p.name}
                        className="picker-img"
                      />
                      <div className="picker-info">
                        <span className="picker-name">{p.name}</span>
                        <div className="picker-sub">
                          <span className="picker-cat">{p.category || "Apparel"}</span>
                          <span className="picker-price">₹{p.price}</span>
                          <span className={`picker-stock ${p.inStock ? "in" : "out"}`}>
                            {p.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-accent"
            disabled={isSaving}
            onClick={() =>
              onSave({
                title,
                subtitle,
                config: {
                  ...(section.config || {}),
                  mode,
                  limit,
                  product_ids: selectedIds
                }
              })
            }
          >
            {isSaving ? "Saving..." : "Save Section Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal 3: Category Feature Grid Modal ──
function CategoryModal({ section, categories, isSaving, onClose, onSave }) {
  const meta = SECTION_METADATA[section.section_key];
  const catSlug = meta?.categorySlug || "mens";
  const matchedCategory = categories.find(
    (c) => c.slug?.toLowerCase() === catSlug.toLowerCase() || c.name?.toLowerCase().includes(catSlug)
  );

  const [title, setTitle] = useState(section.title || matchedCategory?.name || "Department Edit");
  const [subtitle, setSubtitle] = useState(
    section.subtitle || "Oversized Tees, Graphic Hoodies & Streetwear Staples"
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Edit {meta?.name || "Category Showcase"}</h3>
            <p className="modal-subtitle">
              Configure heading and tagline for this department's feature showcase on the storefront.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Heading Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Men's Edit, Women's Drop"
            />
          </div>

          <div className="field">
            <label>Subheading / Tagline</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Oversized Tees, Graphic Hoodies & Streetwear Staples"
            />
          </div>

          {/* Database Integration Context Card */}
          <div className="db-integration-card">
            <div className="db-card-icon">
              <FolderTree size={18} />
            </div>
            <div className="db-card-content">
              <strong>Connected Directly to Database</strong>
              <p>
                This section dynamically displays the active subcategories and products under{" "}
                <strong>"{matchedCategory?.name || catSlug}"</strong> in your database.
              </p>
              <div className="db-subcategories-list">
                {matchedCategory?.subcategories?.map((sc) => (
                  <span key={sc.id} className="db-subcat-badge">
                    {sc.name}
                  </span>
                ))}
              </div>
              <Link to="/subcategories" className="db-manage-link" onClick={onClose}>
                <span>Manage Subcategories in Catalog</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-accent"
            disabled={isSaving}
            onClick={() => onSave({ title, subtitle })}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal 4: Hero Banners Helper Modal ──
function HeroModal({ heroBanners, onClose }) {
  const activeBanners = heroBanners.filter((b) => b.is_active && ["hero", "home_hero"].includes(b.placement));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Hero Banners Slider</h3>
            <p className="modal-subtitle">
              Review active banners or launch the full Hero & Banners visual editor.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="hero-banners-overview">
            <span className="hero-overview-title">
              Active Storefront Hero Banners ({activeBanners.length}):
            </span>
            <div className="hero-banners-list">
              {activeBanners.map((b, i) => (
                <div key={b.id || i} className="hero-banner-item">
                  <img src={resolveImageUrl(b.image_url)} alt={b.title} />
                  <div className="hero-banner-item-details">
                    <strong>{b.title || `Slide ${i + 1}`}</strong>
                    <span>{b.subtitle || b.cta_text || "Featured Hero Slide"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <Link to="/banners" className="btn btn-accent" onClick={onClose}>
            <Sliders size={15} />
            <span>Open Hero & Banners Manager</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
