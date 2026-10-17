import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Tag,
  Search,
  Plus,
  ArrowLeft,
  Link2,
  Share2,
  ExternalLink,
  Edit2,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Globe,
  ChevronDown,
  X
} from "lucide-react";
import { seoApi, uploadApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { resolveImageUrl } from "../../utils/imageUrl";
import LoadingState from "../../components/LoadingState/LoadingState";
import "./MetaSettingsPage.css";

const BLANK_FORM = {
  id: null,
  page_name: "",
  page_type: "custom",
  page_slug: "/",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  canonical_url: "",
  og_image_url: "",
  entity_id: null,
  is_active: true
};

export default function MetaSettingsPage() {
  const toast = useToast();

  // View state: "table" or "form"
  const [viewMode, setViewMode] = useState("table"); // "table" | "form"
  const [isEditMode, setIsEditMode] = useState(false);

  // Table state
  const [pages, setPages] = useState([]);
  const [pageOptions, setPageOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    typeCounts: { all: 0, system: 0, category: 0, product: 0, custom: 0 }
  });

  // Selected dropdown value in form
  const [selectedPageKey, setSelectedPageKey] = useState("");

  // Active form state
  const [form, setForm] = useState(BLANK_FORM);

  // Searchable Page Picker Combobox state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerType, setPickerType] = useState("all");
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  useEffect(() => {
    fetchPages();
    fetchPageOptions();
  }, [activeTab, searchQuery, currentPage]);

  async function fetchPages() {
    setIsLoading(true);
    try {
      const res = await seoApi.listPages({
        page: currentPage,
        limit: 25,
        type: activeTab,
        search: searchQuery
      });
      const data = res?.data || [];
      const meta = res?.meta || {};
      setPages(data);
      setPagination({
        total: meta.total || data.length,
        totalPages: meta.totalPages || 1,
        typeCounts: meta.typeCounts || { all: 0, system: 0, category: 0, product: 0, custom: 0 }
      });
    } catch (err) {
      toast.error(err.message || "Failed to load pages");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPageOptions() {
    try {
      const res = await seoApi.getPageOptions();
      const options = res?.data || [];
      setPageOptions(options);
    } catch (err) {
      console.warn("Could not load page options:", err.message);
    }
  }

  function handleOpenAdd() {
    setIsEditMode(false);
    setSelectedPageKey("");
    setForm(BLANK_FORM);
    setViewMode("form");
  }

  function handleOpenEdit(pageItem) {
    setIsEditMode(true);
    setSelectedPageKey(pageItem.id ? `page-${pageItem.id}` : "");
    setForm({
      id: pageItem.id || null,
      page_name: pageItem.page_name || "",
      page_type: pageItem.page_type || "custom",
      page_slug: pageItem.page_slug || "/",
      meta_title: pageItem.meta_title || "",
      meta_description: pageItem.meta_description || "",
      meta_keywords: pageItem.meta_keywords || "",
      canonical_url: pageItem.canonical_url || "",
      og_image_url: pageItem.og_image_url || "",
      entity_id: pageItem.entity_id || null,
      is_active: pageItem.is_active !== false
    });
    setViewMode("form");
  }

  function handleSelectPageOption(key) {
    setSelectedPageKey(key);
    if (!key) {
      setForm(BLANK_FORM);
      return;
    }

    if (key === "custom") {
      setForm({
        id: null,
        page_name: "Custom Landing Page",
        page_type: "custom",
        page_slug: "/new-page",
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        canonical_url: "",
        og_image_url: "",
        entity_id: null,
        is_active: true
      });
      return;
    }

    const pageId = Number(key.replace("page-", ""));
    const match = pageOptions.find((p) => p.id === pageId);
    if (match) {
      setForm({
        id: match.id,
        page_name: match.page_name || "",
        page_type: match.page_type || "custom",
        page_slug: match.page_slug || "/",
        meta_title: match.meta_title || "",
        meta_description: match.meta_description || "",
        meta_keywords: match.meta_keywords || "",
        canonical_url: match.canonical_url || "",
        og_image_url: match.og_image_url || "",
        entity_id: match.entity_id || null,
        is_active: match.is_active !== false
      });
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadApi.upload("seo", [file]);
      const urls = res?.data || res?.urls || [];
      const uploadedUrl = Array.isArray(urls) ? urls[0] : urls;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, og_image_url: uploadedUrl }));
        toast.success("Social share image uploaded successfully");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function handleSaveForm(e) {
    if (e) e.preventDefault();

    if (!form.page_name.trim()) {
      toast.error("Page name is required");
      return;
    }
    if (!form.page_slug.trim()) {
      toast.error("Page slug / URL is required");
      return;
    }

    setIsSaving(true);
    try {
      await seoApi.savePage(form);
      toast.success(
        isEditMode
          ? `Meta settings for "${form.page_name}" updated successfully`
          : `Meta settings for "${form.page_name}" created successfully`
      );
      setViewMode("table");
      fetchPages();
      fetchPageOptions();
    } catch (err) {
      toast.error(err.message || "Failed to save meta settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOrReset(pageItem) {
    const isSystem = pageItem.page_type === "system";
    const msg = isSystem
      ? `Reset SEO metadata for system page "${pageItem.page_name}"?`
      : `Delete SEO metadata record for "${pageItem.page_name}"?`;

    if (!window.confirm(msg)) return;

    try {
      await seoApi.deletePage(pageItem.id);
      toast.success(isSystem ? "Page metadata reset" : "Page meta record deleted");
      fetchPages();
      fetchPageOptions();
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  }

  // Group page options for select dropdown
  const systemPages = pageOptions.filter((p) => p.page_type === "system");
  const categoryPages = pageOptions.filter((p) => p.page_type === "category");
  const productPages = pageOptions.filter((p) => p.page_type === "product");
  const customPages = pageOptions.filter((p) => p.page_type === "custom");

  const filteredPageOptions = pageOptions.filter((p) => {
    const matchesType = pickerType === "all" || p.page_type === pickerType;
    const q = pickerSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (p.page_name && p.page_name.toLowerCase().includes(q)) ||
      (p.page_slug && p.page_slug.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const selectedPageObj = selectedPageKey
    ? selectedPageKey === "custom"
      ? { page_name: form.page_name || "Custom Landing Page", page_slug: form.page_slug, page_type: "custom" }
      : pageOptions.find((p) => `page-${p.id}` === selectedPageKey)
    : null;

  return (
    <div className="meta-settings-page">
      {/* Top Header & Breadcrumbs matching reference screenshot */}
      <div className="meta-top-header">
        <div className="meta-header-left">
          <h1 className="meta-page-title">Meta Settings</h1>
        </div>
        <div className="meta-header-breadcrumbs">
          <span className="crumb-group">SEO Settings</span>
          <span className="crumb-sep">&gt;</span>
          <span className="crumb-active">Meta Settings</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="meta-main-card">
        {/* Card Header Bar */}
        <div className="meta-card-header">
          <div className="meta-card-title-wrap">
            <span className="meta-header-icon-wrap">
              {viewMode === "form" ? (
                isEditMode ? (
                  <Edit2 size={18} className="meta-header-blue-icon" />
                ) : (
                  <Plus size={18} className="meta-header-blue-icon" />
                )
              ) : (
                <Tag size={18} className="meta-header-blue-icon" />
              )}
            </span>
            <h2 className="meta-card-title">
              {viewMode === "form"
                ? isEditMode
                  ? `Edit Meta Settings — ${form.page_name}`
                  : "Add Meta Settings"
                : "Website Pages Meta Settings"}
            </h2>
          </div>

          <div className="meta-card-header-actions">
            {viewMode === "form" ? (
              <button
                type="button"
                className="btn-back-to-table"
                onClick={() => setViewMode("table")}
              >
                <ArrowLeft size={15} />
                <span>Back to Table</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-add-meta-primary"
                onClick={handleOpenAdd}
              >
                <Plus size={16} />
                <span>Add Meta Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* VIEW 1: FORM VIEW (Matching User Screenshot 1:1) */}
        {viewMode === "form" && (
          <form onSubmit={handleSaveForm} className="meta-form-body">
            {/* Row 1: Select Website Page + Page Slug / URL */}
            <div className="meta-form-row two-cols">
              <div className="meta-form-group" ref={pickerRef} style={{ position: "relative" }}>
                <label className="meta-form-label">
                  Select Website Page <span className="meta-req">*</span>
                </label>

                {/* User-Friendly Compact Searchable Trigger Box */}
                <div
                  className={`meta-picker-trigger ${isPickerOpen ? "open" : ""}`}
                  onClick={() => setIsPickerOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsPickerOpen((prev) => !prev);
                    }
                  }}
                >
                  {selectedPageObj ? (
                    <div className="meta-picker-selected-info">
                      <span className={`meta-type-badge type-${selectedPageObj.page_type}`}>
                        {selectedPageObj.page_type}
                      </span>
                      <span className="meta-picker-selected-name">{selectedPageObj.page_name}</span>
                      <code className="meta-slug-code">{selectedPageObj.page_slug}</code>
                    </div>
                  ) : (
                    <div className="meta-picker-placeholder">
                      <Search size={15} className="text-muted" />
                      <span>Choose a website page (or search)...</span>
                    </div>
                  )}
                  <ChevronDown
                    size={16}
                    className={`meta-picker-chevron ${isPickerOpen ? "open" : ""}`}
                  />
                </div>

                {/* Searchable Dropdown Popover */}
                {isPickerOpen && (
                  <div className="meta-picker-dropdown">
                    <div className="meta-picker-search-bar">
                      <Search size={14} className="meta-picker-search-icon" />
                      <input
                        type="text"
                        className="meta-picker-search-input"
                        placeholder="Search page name, product, or slug..."
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        autoFocus
                      />
                      {pickerSearch && (
                        <button
                          type="button"
                          className="meta-picker-clear-btn"
                          onClick={() => setPickerSearch("")}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="meta-picker-pills">
                      {[
                        { id: "all", label: `All (${pageOptions.length})` },
                        { id: "system", label: `System (${systemPages.length})` },
                        { id: "category", label: `Categories (${categoryPages.length})` },
                        { id: "product", label: `Products (${productPages.length})` },
                        { id: "custom", label: "Custom" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`meta-picker-pill ${pickerType === t.id ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickerType(t.id);
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable Results List */}
                    <div className="meta-picker-list">
                      {(pickerType === "all" || pickerType === "custom") && (
                        <div
                          className={`meta-picker-item custom-item ${
                            selectedPageKey === "custom" ? "selected" : ""
                          }`}
                          onClick={() => {
                            handleSelectPageOption("custom");
                            setIsPickerOpen(false);
                          }}
                        >
                          <span className="meta-type-badge type-custom">custom</span>
                          <span className="meta-picker-item-name">+ Create Custom URL / Page</span>
                          {selectedPageKey === "custom" && <Check size={14} className="text-primary" />}
                        </div>
                      )}

                      {filteredPageOptions.length === 0 ? (
                        <div className="meta-picker-empty">No matching pages found</div>
                      ) : (
                        filteredPageOptions.map((p) => {
                          const isSelected = selectedPageKey === `page-${p.id}`;
                          return (
                            <div
                              key={p.id}
                              className={`meta-picker-item ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                handleSelectPageOption(`page-${p.id}`);
                                setIsPickerOpen(false);
                              }}
                            >
                              <span className={`meta-type-badge type-${p.page_type}`}>
                                {p.page_type}
                              </span>
                              <div className="meta-picker-item-text">
                                <span className="meta-picker-item-name">{p.page_name}</span>
                                <code className="meta-slug-code">{p.page_slug}</code>
                              </div>
                              {isSelected && <Check size={14} className="text-primary" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                <p className="meta-form-hint">
                  Select from auto-populated database categories, products, blogs or choose custom.
                </p>
              </div>

              <div className="meta-form-group">
                <label className="meta-form-label">
                  Page Slug / URL <span className="meta-req">*</span>
                </label>
                <div className="meta-url-input-wrap">
                  <span className="meta-url-prefix">URL:</span>
                  <input
                    type="text"
                    className="meta-form-input url-field"
                    value={form.page_slug}
                    onChange={(e) => setForm({ ...form, page_slug: e.target.value })}
                    placeholder="/products/men-cotton-tshirt"
                    required
                  />
                </div>
                {form.page_name && (
                  <p className="meta-form-hint">
                    Page Name: <strong>{form.page_name}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Meta Title (Google SERP) */}
            <div className="meta-form-group">
              <div className="meta-label-with-counter">
                <label className="meta-form-label">Meta Title (Google SERP)</label>
                <span
                  className={`meta-counter ${
                    (form.meta_title || "").length > 60
                      ? "counter-warning"
                      : (form.meta_title || "").length >= 40
                      ? "counter-good"
                      : ""
                  }`}
                >
                  {(form.meta_title || "").length} / 60 characters
                </span>
              </div>
              <input
                type="text"
                className="meta-form-input"
                placeholder="e.g. Luxury Linen Shirts & Automatic Watches | House of KNP"
                value={form.meta_title || ""}
                onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                maxLength={90}
              />
              <p className="meta-form-hint">
                Recommended: <strong>50 - 60 characters</strong>. Avoid stuffing keywords.
              </p>
            </div>

            {/* Row 3: Meta Description (Google Snippet) */}
            <div className="meta-form-group">
              <div className="meta-label-with-counter">
                <label className="meta-form-label">Meta Description (Google Snippet)</label>
                <span
                  className={`meta-counter ${
                    (form.meta_description || "").length > 160
                      ? "counter-warning"
                      : (form.meta_description || "").length >= 120
                      ? "counter-good"
                      : ""
                  }`}
                >
                  {(form.meta_description || "").length} / 160 characters
                </span>
              </div>
              <textarea
                className="meta-form-textarea"
                rows={3}
                placeholder="e.g. Explore artisanal bespoke shirts, handcrafted automatic watches, and signature fragrances crafted for modern gentlemen. Free shipping in India."
                value={form.meta_description || ""}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                maxLength={250}
              />
              <p className="meta-form-hint">
                Recommended: <strong>140 - 160 characters</strong>. Summarize value proposition clearly.
              </p>
            </div>

            {/* Row 4: Canonical URL (Optional) */}
            <div className="meta-form-group">
              <label className="meta-form-label">Canonical URL (Optional)</label>
              <div className="meta-icon-input-wrap">
                <span className="meta-input-icon">
                  <Link2 size={16} />
                </span>
                <input
                  type="url"
                  className="meta-form-input with-icon"
                  placeholder="https://zmwclothing.com/your-preferred-url"
                  value={form.canonical_url || ""}
                  onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                />
              </div>
              <p className="meta-form-hint">
                Defines the master URL for search engines to prevent duplicate content penalties.
              </p>
            </div>

            {/* Row 5: Social Media Share Image Card (OpenGraph / WhatsApp / Twitter) */}
            <div className="meta-share-image-card">
              <div className="meta-share-card-header">
                <Share2 size={16} className="meta-share-icon" />
                <span className="meta-share-card-title">
                  Social Media Share Image (OpenGraph / WhatsApp / Twitter)
                </span>
              </div>

              <div className="meta-share-card-grid">
                {/* Left: Upload and direct URL */}
                <div className="meta-share-left-col">
                  <div className="meta-form-group mb-3">
                    <label className="meta-sublabel">
                      Upload Image File (Recommended 1200x630px JPG/PNG):
                    </label>
                    <div className="meta-file-upload-row">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="meta-file-input"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading && <span className="meta-uploading-text">Uploading...</span>}
                    </div>
                  </div>

                  <div className="meta-form-group">
                    <label className="meta-sublabel">Or Direct Image URL / Path:</label>
                    <input
                      type="text"
                      className="meta-form-input"
                      placeholder="e.g. images/knp/gift_box.png or https://..."
                      value={form.og_image_url || ""}
                      onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right: Live Preview Box */}
                <div className="meta-share-right-col">
                  <label className="meta-sublabel">Image Preview</label>
                  <div className="meta-preview-box">
                    {form.og_image_url ? (
                      <img
                        src={resolveImageUrl(form.og_image_url)}
                        alt="OG Preview"
                        className="meta-preview-img"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fb = e.currentTarget.parentElement.querySelector(
                            ".meta-preview-fallback"
                          );
                          if (fb) fb.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="meta-preview-fallback"
                      style={{ display: form.og_image_url ? "none" : "flex" }}
                    >
                      <ImageIcon size={28} className="meta-preview-icon" />
                      <span className="meta-preview-label">OG Preview</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 6: Meta Keywords (Comma separated) */}
            <div className="meta-form-group">
              <label className="meta-form-label">Meta Keywords (Comma separated)</label>
              <input
                type="text"
                className="meta-form-input"
                placeholder="mens shirts, automatic watches, perfumes, luxury gifting"
                value={form.meta_keywords || ""}
                onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
              />
            </div>

            {/* Row 7: Buttons */}
            <div className="meta-form-actions">
              <button
                type="submit"
                className="btn-save-meta-primary"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Meta Settings"}
              </button>
              <button
                type="button"
                className="btn-cancel-secondary"
                onClick={() => setViewMode("table")}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: TABLE VIEW (Directory of all pages) */}
        {viewMode === "table" && (
          <div className="meta-table-body">
            {/* Top filter pills + Search */}
            <div className="meta-table-toolbar">
              <div className="meta-type-pills">
                <button
                  type="button"
                  className={`meta-pill ${activeTab === "all" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("all");
                    setCurrentPage(1);
                  }}
                >
                  All ({pagination.typeCounts.all})
                </button>
                <button
                  type="button"
                  className={`meta-pill ${activeTab === "system" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("system");
                    setCurrentPage(1);
                  }}
                >
                  System Pages ({pagination.typeCounts.system})
                </button>
                <button
                  type="button"
                  className={`meta-pill ${activeTab === "category" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("category");
                    setCurrentPage(1);
                  }}
                >
                  Categories ({pagination.typeCounts.category})
                </button>
                <button
                  type="button"
                  className={`meta-pill ${activeTab === "product" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("product");
                    setCurrentPage(1);
                  }}
                >
                  Products ({pagination.typeCounts.product})
                </button>
                <button
                  type="button"
                  className={`meta-pill ${activeTab === "custom" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("custom");
                    setCurrentPage(1);
                  }}
                >
                  Custom ({pagination.typeCounts.custom})
                </button>
              </div>

              <div className="meta-table-search-wrap">
                <Search size={16} className="meta-search-icon" />
                <input
                  type="text"
                  className="meta-table-search-input"
                  placeholder="Search page name, slug, or title..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <LoadingState message="Loading page meta settings..." />
            ) : pages.length === 0 ? (
              <div className="meta-empty-state">
                <AlertCircle size={36} className="meta-empty-icon" />
                <h3>No Page Metadata Found</h3>
                <p>Try clearing your search query or add a new meta setting.</p>
                <button
                  type="button"
                  className="btn-add-meta-primary mt-3"
                  onClick={handleOpenAdd}
                >
                  <Plus size={16} />
                  <span>Add Meta Settings</span>
                </button>
              </div>
            ) : (
              <div className="meta-table-responsive">
                <table className="meta-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "24%" }}>Page & URL</th>
                      <th style={{ width: "12%" }}>Type</th>
                      <th style={{ width: "26%" }}>Meta Title (SERP)</th>
                      <th style={{ width: "22%" }}>Snippet Description</th>
                      <th style={{ width: "8%" }}>OG Image</th>
                      <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((item) => {
                      const titleLen = (item.meta_title || "").length;
                      const isTitleGood = titleLen >= 40 && titleLen <= 60;
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="meta-page-cell">
                              <span className="meta-page-name">{item.page_name}</span>
                              <span className="meta-page-slug-row">
                                <code className="meta-slug-code">{item.page_slug}</code>
                                <a
                                  href={`http://localhost:3000${item.page_slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="meta-slug-link"
                                  title="Open in storefront"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className={`meta-type-badge type-${item.page_type}`}>
                              {item.page_type}
                            </span>
                          </td>

                          <td>
                            <div className="meta-title-cell">
                              <span className="meta-title-text" title={item.meta_title || "None"}>
                                {item.meta_title || <em className="text-muted">Not specified</em>}
                              </span>
                              {item.meta_title && (
                                <span
                                  className={`meta-len-chip ${
                                    isTitleGood ? "len-good" : titleLen > 60 ? "len-warn" : "len-short"
                                  }`}
                                >
                                  {titleLen} chars
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <p className="meta-desc-snippet" title={item.meta_description || ""}>
                              {item.meta_description || (
                                <em className="text-muted">Using default site description</em>
                              )}
                            </p>
                          </td>

                          <td>
                            {item.og_image_url ? (
                              <img
                                src={resolveImageUrl(item.og_image_url)}
                                alt=""
                                className="meta-thumb-img"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="meta-no-thumb">—</span>
                            )}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div className="meta-actions-group">
                              <button
                                type="button"
                                className="meta-action-btn edit"
                                title="Edit meta settings"
                                onClick={() => handleOpenEdit(item)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="meta-action-btn reset"
                                title={item.page_type === "system" ? "Reset metadata" : "Delete"}
                                onClick={() => handleDeleteOrReset(item)}
                              >
                                {item.page_type === "system" ? (
                                  <RotateCcw size={14} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="meta-pagination-bar">
                <span className="meta-pagination-info">
                  Showing {(currentPage - 1) * 25 + 1} to{" "}
                  {Math.min(currentPage * 25, pagination.total)} of {pagination.total} pages
                </span>
                <div className="meta-pagination-buttons">
                  <button
                    type="button"
                    className="meta-page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="meta-page-num">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="meta-page-btn"
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
