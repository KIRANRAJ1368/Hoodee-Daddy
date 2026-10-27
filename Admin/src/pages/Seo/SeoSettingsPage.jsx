import { useState, useEffect } from "react";
import {
  Globe,
  Search,
  Share2,
  FileCode,
  ShieldAlert,
  Save,
  CheckCircle2,
  ExternalLink,
  Eye,
  Info
} from "lucide-react";
import { seoApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import FormField from "../../components/FormField/FormField";
import LoadingState from "../../components/LoadingState/LoadingState";
import Modal from "../../components/Modal/Modal";
import "./SeoSettingsPage.css";

export default function SeoSettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBlockWarningModal, setShowBlockWarningModal] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // general | homepage | templates | social | robots

  const [form, setForm] = useState({
    default_meta_title: "",
    default_meta_description: "",
    default_meta_keywords: "",
    homepage_title: "",
    homepage_description: "",
    product_title_format: "{name} | HooDee Daddy",
    product_description_format: "{description}",
    category_title_format: "{name} Collection — Luxury Apparel | HooDee Daddy",
    category_description_format: "",
    canonical_base_url: "https://hoodeedaddy.com",
    og_title: "",
    og_description: "",
    og_image_url: "",
    robots_index: true,
    robots_follow: true,
    robots_custom_rules: "",
    organization_name: "HooDee Daddy",
    organization_telephone: "+919876543210",
    organization_email: "support@hoodeedaddy.com"
  });

  const [confirmBlockRobots, setConfirmBlockRobots] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setIsLoading(true);
    try {
      const res = await seoApi.get();
      const data = res?.data || res || {};
      setForm((prev) => ({
        ...prev,
        ...data,
        robots_index: data.robots_index !== false && data.robots_index !== 0,
        robots_follow: data.robots_follow !== false && data.robots_follow !== 0
      }));
    } catch (err) {
      toast.error(err.message || "Failed to load SEO settings");
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field, value) {
    if (field === "robots_index" && value === false) {
      // Trigger safeguard alert
      setShowBlockWarningModal(true);
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleConfirmBlockRobots() {
    setForm((prev) => ({ ...prev, robots_index: false }));
    setConfirmBlockRobots(true);
    setShowBlockWarningModal(false);
    toast.error("Warning: Search engine indexing has been disabled! Don't forget to save changes.");
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    // Check safeguard
    if (form.robots_index === false && !confirmBlockRobots) {
      setShowBlockWarningModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        confirm_block_robots: confirmBlockRobots
      };
      await seoApi.update(payload);
      toast.success("SEO settings and XML sitemap updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update SEO settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading SEO settings..." />;
  }

  const cleanBase = (form.canonical_base_url || "https://hoodeedaddy.com").replace(/\/+$/, "");

  return (
    <div className="seo-page">
      <div className="seo-header">
        <div>
          <h1 className="seo-title">SEO & Metadata Settings</h1>
          <p className="seo-subtitle">
            Configure search engine titles, Open Graph tags, XML sitemaps, and indexing rules for HooDee Daddy.
          </p>
        </div>
        <div className="seo-header-actions">
          <a
            href={`${cleanBase}/sitemap.xml`}
            target="_blank"
            rel="noopener noreferrer"
            className="seo-preview-btn"
            title="View XML Sitemap"
          >
            <FileCode size={16} />
            <span>View sitemap.xml</span>
            <ExternalLink size={13} />
          </a>
          <a
            href={`${cleanBase}/robots.txt`}
            target="_blank"
            rel="noopener noreferrer"
            className="seo-preview-btn"
            title="View robots.txt"
          >
            <Eye size={16} />
            <span>View robots.txt</span>
            <ExternalLink size={13} />
          </a>
          <button
            type="button"
            className="seo-save-btn"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save size={16} />
            <span>{isSaving ? "Saving..." : "Save SEO Settings"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="seo-tabs">
        <button
          type="button"
          className={`seo-tab ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <Globe size={16} />
          <span>General & Defaults</span>
        </button>
        <button
          type="button"
          className={`seo-tab ${activeTab === "homepage" ? "active" : ""}`}
          onClick={() => setActiveTab("homepage")}
        >
          <Search size={16} />
          <span>Homepage SEO</span>
        </button>
        <button
          type="button"
          className={`seo-tab ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <FileCode size={16} />
          <span>Catalog & Templates</span>
        </button>
        <button
          type="button"
          className={`seo-tab ${activeTab === "social" ? "active" : ""}`}
          onClick={() => setActiveTab("social")}
        >
          <Share2 size={16} />
          <span>Social & Open Graph</span>
        </button>
        <button
          type="button"
          className={`seo-tab ${activeTab === "robots" ? "active" : ""}`}
          onClick={() => setActiveTab("robots")}
        >
          <ShieldAlert size={16} />
          <span>Robots & Indexing</span>
        </button>
      </div>

      {/* Main Grid: Form Left, SERP Preview Right */}
      <div className="seo-content-grid">
        <form className="seo-form" onSubmit={handleSubmit}>
          {/* TAB 1: General & Defaults */}
          {activeTab === "general" && (
            <div className="seo-card">
              <h2 className="seo-card-title">Default Website Metadata</h2>
              <p className="seo-card-desc">
                These defaults are used site-wide whenever a specific page does not have a custom meta title or description.
              </p>

              <FormField label="Default Website SEO Title" required>
                <input
                  type="text"
                  className="seo-input"
                  value={form.default_meta_title}
                  onChange={(e) => handleChange("default_meta_title", e.target.value)}
                  placeholder="e.g. HooDee Daddy — Luxury Pret-a-Porter & Haute Couture"
                  maxLength={255}
                />
                <span className="seo-char-count">{form.default_meta_title.length} / 60-70 recommended chars</span>
              </FormField>

              <FormField label="Default Meta Description" required>
                <textarea
                  className="seo-textarea"
                  rows={3}
                  value={form.default_meta_description}
                  onChange={(e) => handleChange("default_meta_description", e.target.value)}
                  placeholder="Handcrafted luxury apparel. Natural fibres, master tailoring, and considered design. Nationwide insured dispatch."
                />
                <span className="seo-char-count">{form.default_meta_description.length} / 150-160 recommended chars</span>
              </FormField>

              <FormField label="Default SEO Keywords (comma separated)">
                <input
                  type="text"
                  className="seo-input"
                  value={form.default_meta_keywords || ""}
                  onChange={(e) => handleChange("default_meta_keywords", e.target.value)}
                  placeholder="HooDee Daddy, kids fashion, streetwear, couture, menswear, womenswear, oversized t-shirts"
                />
              </FormField>

              <FormField label="Canonical Base URL" required>
                <input
                  type="url"
                  className="seo-input"
                  value={form.canonical_base_url}
                  onChange={(e) => handleChange("canonical_base_url", e.target.value)}
                  placeholder="https://hoodeedaddy.com"
                />
                <span className="seo-field-hint">
                  Used to generate self-referential canonical tags and absolute URLs in XML sitemaps.
                </span>
              </FormField>
            </div>
          )}

          {/* TAB 2: Homepage SEO */}
          {activeTab === "homepage" && (
            <div className="seo-card">
              <h2 className="seo-card-title">Homepage SEO & Search Snippet</h2>
              <p className="seo-card-desc">
                Custom SEO title and description targeted for Google ranking on the main storefront homepage.
              </p>

              <FormField label="Homepage SEO Title" required>
                <input
                  type="text"
                  className="seo-input"
                  value={form.homepage_title}
                  onChange={(e) => handleChange("homepage_title", e.target.value)}
                  placeholder="HooDee Daddy — Luxury Fashion, Streetwear & Everyday Essentials"
                  maxLength={255}
                />
                <span className="seo-char-count">{form.homepage_title.length} / 60-70 recommended chars</span>
              </FormField>

              <FormField label="Homepage Meta Description" required>
                <textarea
                  className="seo-textarea"
                  rows={4}
                  value={form.homepage_description}
                  onChange={(e) => handleChange("homepage_description", e.target.value)}
                  placeholder="Discover HooDee Daddy's kids streetwear and couture collections. Handcrafted 240+ GSM oversized t-shirts, 450 GSM hoodies, and tailored apparel."
                />
                <span className="seo-char-count">{form.homepage_description.length} / 150-160 recommended chars</span>
              </FormField>

              <div className="seo-tip-box">
                <Info size={18} />
                <div>
                  <strong>Pro-Tip for Google Ranking:</strong> Include your brand name, core fashion offerings (e.g., oversized tees, heavyweight hoodies), and city/nationwide delivery keywords.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Templates for Products & Categories */}
          {activeTab === "templates" && (
            <div className="seo-card">
              <h2 className="seo-card-title">Dynamic Catalog SEO Templates</h2>
              <p className="seo-card-desc">
                Templates dynamically generate unique SEO tags for all products and categories when individual overrides are not specified.
              </p>

              <div className="seo-template-group">
                <h3>Product Pages</h3>
                <FormField label="Product Title Format" required>
                  <input
                    type="text"
                    className="seo-input"
                    value={form.product_title_format}
                    onChange={(e) => handleChange("product_title_format", e.target.value)}
                    placeholder="{name} | HooDee Daddy"
                  />
                  <span className="seo-field-hint">Available tags: <code>{"{name}"}</code>, <code>{"{category}"}</code>, <code>{"{price}"}</code></span>
                </FormField>

                <FormField label="Product Description Format">
                  <textarea
                    className="seo-textarea"
                    rows={2}
                    value={form.product_description_format || ""}
                    onChange={(e) => handleChange("product_description_format", e.target.value)}
                    placeholder="Buy {name} online at HooDee Daddy. {description}"
                  />
                  <span className="seo-field-hint">Defaults to the product's own description if left blank.</span>
                </FormField>
              </div>

              <div className="seo-template-group" style={{ marginTop: 24 }}>
                <h3>Category Pages</h3>
                <FormField label="Category Title Format" required>
                  <input
                    type="text"
                    className="seo-input"
                    value={form.category_title_format}
                    onChange={(e) => handleChange("category_title_format", e.target.value)}
                    placeholder="{name} Collection — Luxury Apparel | HooDee Daddy"
                  />
                  <span className="seo-field-hint">Available tags: <code>{"{name}"}</code></span>
                </FormField>

                <FormField label="Category Description Format">
                  <textarea
                    className="seo-textarea"
                    rows={2}
                    value={form.category_description_format || ""}
                    onChange={(e) => handleChange("category_description_format", e.target.value)}
                    placeholder="Explore the latest {name} collection at HooDee Daddy. Premium luxury fabrics, considered tailoring, and pan-India delivery."
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* TAB 4: Social Sharing (Open Graph / Twitter) */}
          {activeTab === "social" && (
            <div className="seo-card">
              <h2 className="seo-card-title">Social Media Sharing (Open Graph & Twitter)</h2>
              <p className="seo-card-desc">
                Controls how pages appear when links are shared on WhatsApp, Facebook, LinkedIn, Twitter/X, and iMessage.
              </p>

              <FormField label="Social Share Title (og:title)">
                <input
                  type="text"
                  className="seo-input"
                  value={form.og_title || ""}
                  onChange={(e) => handleChange("og_title", e.target.value)}
                  placeholder="HooDee Daddy — Luxury Pret-a-Porter & Haute Couture"
                />
              </FormField>

              <FormField label="Social Share Description (og:description)">
                <textarea
                  className="seo-textarea"
                  rows={3}
                  value={form.og_description || ""}
                  onChange={(e) => handleChange("og_description", e.target.value)}
                  placeholder="Handcrafted luxury apparel. Natural fibres, master tailoring, and considered design."
                />
              </FormField>

              <FormField label="Social Share Image URL (og:image)">
                <input
                  type="text"
                  className="seo-input"
                  value={form.og_image_url || ""}
                  onChange={(e) => handleChange("og_image_url", e.target.value)}
                  placeholder="/images/hoodee-daddy-logo.png"
                />
                <span className="seo-field-hint">Recommended size: 1200 × 630 pixels (PNG or JPG).</span>
              </FormField>
            </div>
          )}

          {/* TAB 5: Robots & Indexing */}
          {activeTab === "robots" && (
            <div className="seo-card">
              <h2 className="seo-card-title">Robots & Indexing Settings</h2>
              <p className="seo-card-desc">
                Instruct search engine bots (Googlebot, Bingbot) whether to index this store.
              </p>

              <div className="seo-toggle-row">
                <div>
                  <div className="seo-toggle-label">Allow Search Engines to Index Website</div>
                  <div className="seo-toggle-desc">
                    When enabled, Google will crawl and index your public catalog. Disabling this adds <code>noindex</code> and blocks robots in <code>robots.txt</code>.
                  </div>
                </div>
                <label className="seo-switch">
                  <input
                    type="checkbox"
                    checked={form.robots_index}
                    onChange={(e) => handleChange("robots_index", e.target.checked)}
                  />
                  <span className="seo-slider" />
                </label>
              </div>

              <div className="seo-toggle-row" style={{ marginTop: 16 }}>
                <div>
                  <div className="seo-toggle-label">Allow Robots to Follow Internal Links</div>
                  <div className="seo-toggle-desc">
                    Allows search bots to follow links on your pages to discover other products.
                  </div>
                </div>
                <label className="seo-switch">
                  <input
                    type="checkbox"
                    checked={form.robots_follow}
                    onChange={(e) => handleChange("robots_follow", e.target.checked)}
                  />
                  <span className="seo-slider" />
                </label>
              </div>

              <FormField label="Custom Robots.txt Disallow Rules" style={{ marginTop: 20 }}>
                <textarea
                  className="seo-textarea font-mono"
                  rows={6}
                  value={form.robots_custom_rules || ""}
                  onChange={(e) => handleChange("robots_custom_rules", e.target.value)}
                  placeholder={"Disallow: /admin\nDisallow: /checkout\nDisallow: /cart"}
                />
                <span className="seo-field-hint">
                  Private paths (e.g., /admin, /checkout, /cart, /account, /profile) are protected by default.
                </span>
              </FormField>
            </div>
          )}

          <div className="seo-form-footer">
            <button
              type="submit"
              className="seo-save-btn"
              disabled={isSaving}
            >
              <Save size={16} />
              <span>{isSaving ? "Saving Settings..." : "Save SEO Settings"}</span>
            </button>
          </div>
        </form>

        {/* Live SERP & Social Preview Card */}
        <div className="seo-preview-sidebar">
          <div className="seo-preview-card">
            <div className="seo-preview-header">
              <GoogleLogo />
              <span>Google Search Result Preview</span>
            </div>

            <div className="google-serp-box">
              <div className="google-serp-site">
                <div className="google-serp-favicon">Z</div>
                <div>
                  <div className="google-serp-domain">hoodeedaddy.com</div>
                  <div className="google-serp-url">{cleanBase}</div>
                </div>
              </div>
              <h3 className="google-serp-title">
                {activeTab === "homepage"
                  ? form.homepage_title || form.default_meta_title
                  : activeTab === "templates"
                  ? form.product_title_format.replace("{name}", "HooDee Daddy Heavyweight Oversized Tee")
                  : form.default_meta_title || "HooDee Daddy — Luxury Pret-a-Porter & Haute Couture"}
              </h3>
              <p className="google-serp-snippet">
                {activeTab === "homepage"
                  ? form.homepage_description || form.default_meta_description
                  : activeTab === "templates"
                  ? "Engineered from 260 GSM pure combed cotton with a structured drop-shoulder drape and reinforced collar. Pre-shrunk and bio-washed."
                  : form.default_meta_description || "Handcrafted luxury apparel. Natural fibres, master tailoring, and considered design."}
              </p>
            </div>
          </div>

          <div className="seo-preview-card" style={{ marginTop: 20 }}>
            <div className="seo-preview-header">
              <Share2 size={16} />
              <span>Social Media Card Preview</span>
            </div>
            <div className="social-card-preview">
              <div className="social-card-img-placeholder">
                <img
                  src={form.og_image_url || "/images/hoodee-daddy-logo.png"}
                  alt="OG Preview"
                  onError={(e) => {
                    e.currentTarget.src = "/images/hoodee-daddy-logo.png";
                  }}
                />
              </div>
              <div className="social-card-content">
                <span className="social-card-domain">hoodeedaddy.com</span>
                <h4 className="social-card-title">{form.og_title || form.default_meta_title}</h4>
                <p className="social-card-desc">{form.og_description || form.default_meta_description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safeguard Warning Modal for blocking robots */}
      {showBlockWarningModal && (
        <Modal
          title="⚠️ Danger: Block Search Engines?"
          onClose={() => {
            setShowBlockWarningModal(false);
            setForm((prev) => ({ ...prev, robots_index: true }));
          }}
          width={500}
        >
          <div style={{ display: "flex", gap: "16px", padding: "12px 0" }}>
            <div style={{ color: "var(--danger, #DC2626)", flexShrink: 0 }}>
              <AlertTriangle size={32} />
            </div>
            <div>
              <p style={{ color: "var(--text-primary, #0F172A)", fontWeight: 600, margin: "0 0 8px 0", fontSize: "15px" }}>
                You are about to turn off search engine indexing.
              </p>
              <p style={{ color: "var(--text-muted, #64748B)", fontSize: "13.5px", lineHeight: 1.55, margin: 0 }}>
                This will output <code>Disallow: /</code> in robots.txt and <code>noindex</code> in meta tags, causing Google and other search engines to drop your entire website from search results!
              </p>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowBlockWarningModal(false);
                setForm((prev) => ({ ...prev, robots_index: true }));
              }}
            >
              Keep Indexing Enabled
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmBlockRobots}
            >
              Yes, Block Search Engines
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}
