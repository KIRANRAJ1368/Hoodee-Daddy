import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import FormField from "../../components/FormField/FormField";
import ImageUploadField from "../../components/ImageUploadField/ImageUploadField";
import { categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../services/api";
import { slugify } from "../../utils/slugify";
import { broadcastCatalogUpdate } from "../../utils/broadcastCatalogUpdate";

export default function CategoryFormModal({ category, onClose, onSaved, defaultSortOrder = 0 }) {
  const isEdit = !!category?.id;
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? (defaultSortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(category?.show_on_homepage ?? true);

  // Integrated Collection Page Hero Banner
  const [bannerImageUrl, setBannerImageUrl] = useState(category?.banner_image_url || "");
  const [bannerImagePosition, setBannerImagePosition] = useState(category?.banner_image_position || "center center");
  const [bannerTag, setBannerTag] = useState(category?.banner_tag || "");
  const [bannerBadgePromo, setBannerBadgePromo] = useState(category?.banner_badge_promo || "");
  const [bannerTitle, setBannerTitle] = useState(category?.banner_title || "");
  const [bannerSubtitle, setBannerSubtitle] = useState(category?.banner_subtitle || "");
  const [bannerPrimaryCtaText, setBannerPrimaryCtaText] = useState(category?.banner_primary_cta_text || "");



  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  function handleNameChange(value) {
    setName(value);
    if (!isEdit && (!slug || slug === slugify(name))) {
      setSlug(slugify(value));
    }
    if (error) setError("");
  }

  function validate() {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return "Please enter the category name";
    }
    if (trimmed.length > 80) {
      return "Category name must be under 80 characters";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const cleanName = name.trim();
      const generatedSlug = (slug || "").trim().toLowerCase() || slugify(cleanName);

      const payload = {
        name: cleanName,
        slug: generatedSlug,
        description: description.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: Boolean(isActive),
        show_on_homepage: Boolean(showOnHomepage),
        banner_image_url: bannerImageUrl.trim() || null,
        banner_image_position: bannerImagePosition.trim() || "center center",
        banner_tag: bannerTag.trim() || cleanName,
        banner_badge_promo: bannerBadgePromo.trim() || "New Collection",
        banner_title: bannerTitle.trim() || `${cleanName.toUpperCase()} COLLECTION`,
        banner_subtitle:
          bannerSubtitle.trim() ||
          description.trim() ||
          `Explore our premium ${cleanName.toLowerCase()} essentials crafted for everyday comfort and modern style.`,
        banner_primary_cta_text: bannerPrimaryCtaText.trim() || `Shop ${cleanName}`,
        banner_primary_cta_link: category?.banner_primary_cta_link || `/collection?category=${generatedSlug}`
      };

      if (isEdit) {
        await categoriesApi.update(category.id, payload);
        broadcastCatalogUpdate({ action: "CATEGORY_UPDATED", categoryId: category.id, slug: payload.slug });
        toast.success(`Category "${payload.name}" updated successfully!`);
      } else {
        const res = await categoriesApi.create(payload);
        broadcastCatalogUpdate({ action: "CATEGORY_CREATED", categoryId: res?.data?.id, slug: payload.slug });
        toast.success(`Category "${payload.name}" created successfully!`);
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const first = err.details[0]?.message;
        if (first) setError(first);
      }
      toast.error(err.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Category & Collection Banner" : "Add New Category & Collection Banner"}
      onClose={onClose}
      width={720}
    >
      <form noValidate onSubmit={handleSubmit}>
        {/* Category Basics */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            1. Category Details
          </div>

          <div className="form-grid">
            <FormField
              label="Category Name *"
              htmlFor="cat-name"
              error={error}
              hint="Primary storefront category title (e.g. Men, Women, Kids)"
            >
              <input
                id="cat-name"
                placeholder="e.g. Men, Women, Kids, Unisex"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={error ? "has-error" : ""}
                autoFocus
                required
              />
            </FormField>

            <FormField
              label="URL Slug"
              htmlFor="cat-slug"
              hint="URL parameter: /collection?category=slug"
            >
              <input
                id="cat-slug"
                placeholder="e.g. mens, women, kids"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
              />
            </FormField>
          </div>

          <div className="form-grid">
            <FormField
              label="Display Order Sequence"
              htmlFor="cat-sort-order"
              hint="Lower number appears first on navbar & storefront"
            >
              <input
                id="cat-sort-order"
                type="number"
                min="0"
                placeholder="e.g. 0, 1, 2"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </FormField>

            <FormField
              label="Short Description"
              htmlFor="cat-desc"
              hint="Category description used across storefront"
            >
              <input
                id="cat-desc"
                placeholder="e.g. Premium pure cotton drops and streetwear fits"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
            <div className="checkbox-row">
              <input
                id="cat-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="cat-active">
                <strong>Active & Visible in Navbar</strong>
              </label>
            </div>

            <div className="checkbox-row">
              <input
                id="cat-home"
                type="checkbox"
                checked={showOnHomepage}
                onChange={(e) => setShowOnHomepage(e.target.checked)}
              />
              <label htmlFor="cat-home">
                <strong>Show Category Carousel on Homepage</strong>
              </label>
            </div>
          </div>
        </div>

        {/* Collection Hero Banner Section (Pic 2) */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              2. Collection Page Hero Banner
            </div>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
              Appears atop /collection?category={slug || "..."}
            </span>
          </div>

          <ImageUploadField
            label="Banner Image"
            value={bannerImageUrl}
            onChange={(url) => setBannerImageUrl(url)}
            folder="banners"
            aspectRatio="16/9"
            previewHeight={160}
            hint="Upload a high-resolution landscape banner (Recommended: 1920 × 800px). Supports JPG, PNG, WEBP."
          />

          {/* <FormField
            label="Image Focal Position"
            htmlFor="cat-b-pos"
            hint="CSS object-position (e.g. center center, 85% top, center 20%)"
          >
            <input
              id="cat-b-pos"
              placeholder="center center"
              value={bannerImagePosition}
              onChange={(e) => setBannerImagePosition(e.target.value)}
            />
          </FormField> */}

          <div className="form-grid">
            <FormField
              label="Promo Badge Tag"
              htmlFor="cat-b-badge"
              hint="e.g. FLAT 25% OFF · AUTO-APPLIED"
            >
              <input
                id="cat-b-badge"
                placeholder="e.g. FLAT 25% OFF · AUTO-APPLIED"
                value={bannerBadgePromo}
                onChange={(e) => setBannerBadgePromo(e.target.value)}
              />
            </FormField>

            <FormField
              label="Tagline / Eyebrow Text"
              htmlFor="cat-b-tag"
              hint="e.g. ★ PREMIUM MEN'S APPAREL · SEASON 2026"
            >
              <input
                id="cat-b-tag"
                placeholder={name ? `★ PREMIUM ${name.toUpperCase()} · SEASON 2026` : "e.g. ★ PREMIUM COLLECTION"}
                value={bannerTag}
                onChange={(e) => setBannerTag(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            label="Headline Title"
            htmlFor="cat-b-title"
            hint="e.g. MEN'S COLLECTION"
          >
            <input
              id="cat-b-title"
              placeholder={name ? `${name.toUpperCase()} COLLECTION` : "e.g. NEW SEASON COLLECTION"}
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
            />
          </FormField>

          <FormField
            label="Subtitle / Description Copy"
            htmlFor="cat-b-subtitle"
            hint="Support copy under the headline"
          >
            <textarea
              id="cat-b-subtitle"
              rows={2}
              placeholder={name ? `Explore our premium ${name.toLowerCase()} essentials crafted for elevated comfort and everyday style.` : "Explore our latest drops."}
              value={bannerSubtitle}
              onChange={(e) => setBannerSubtitle(e.target.value)}
            />
          </FormField>

          <FormField
            label="Primary CTA Text"
            htmlFor="cat-b-cta1"
            hint="e.g. Shop Men's, Explore Now"
          >
            <input
              id="cat-b-cta1"
              placeholder={name ? `Shop ${name}` : "Shop Now"}
              value={bannerPrimaryCtaText}
              onChange={(e) => setBannerPrimaryCtaText(e.target.value)}
            />
          </FormField>
        </div>


        <div className="form-actions" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Category & Banner" : "Create Category & Banner"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
