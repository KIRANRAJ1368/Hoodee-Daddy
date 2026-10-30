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
  const isEdit = Boolean(category?.id);
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [description, setDescription] = useState(category?.description || "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? (defaultSortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [showOnHomepage, setShowOnHomepage] = useState(category?.show_on_homepage ?? true);
  const [bannerImageUrl, setBannerImageUrl] = useState(category?.banner_image_url || "");

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  function handleNameChange(value) {
    setName(value);
    if (!isEdit && (!slug || slug === slugify(name))) {
      setSlug(slugify(value));
    }
    if (error) setError("");
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: "" }));
    }
  }

  function validate() {
    const errs = {};
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      errs.name = "Category Name is required";
    } else if (trimmedName.length > 80) {
      errs.name = "Category Name must be under 80 characters";
    }

    const trimmedSlug = (slug || "").trim();
    if (!trimmedSlug) {
      errs.slug = "URL Slug is required";
    }

    if (sortOrder === "" || sortOrder === null || isNaN(Number(sortOrder))) {
      errs.sortOrder = "Display Order Sequence is required";
    }

    const trimmedDesc = (description || "").trim();
    if (!trimmedDesc) {
      errs.description = "Category Short Description is required";
    }

    if (!bannerImageUrl || !bannerImageUrl.trim()) {
      errs.bannerImageUrl = "Collection Page Hero Banner image is required (1920 × 800px)";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.values(errs)[0];
      return first;
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
        description: description.trim(),
        sort_order: Number(sortOrder) || 0,
        is_active: Boolean(isActive),
        show_on_homepage: Boolean(showOnHomepage),
        banner_image_url: bannerImageUrl.trim(),
        banner_image_position: "center center",
        banner_tag: null,
        banner_badge_promo: null,
        banner_title: `${cleanName.toUpperCase()} COLLECTION`,
        banner_subtitle: description.trim(),
        banner_primary_cta_text: null,
        banner_primary_cta_link: `/collection?category=${generatedSlug}`
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
      width={680}
    >
      <form noValidate onSubmit={handleSubmit}>
        {/* 1. Category Name & Slug */}
        <div className="form-grid">
          <FormField
            label="Category Name *"
            htmlFor="cat-name"
            error={fieldErrors.name || error}
            hint="Primary storefront category title (e.g. Men, Women, Kids)"
          >
            <input
              id="cat-name"
              placeholder="e.g. Men, Women, Kids, Unisex"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={fieldErrors.name ? "has-error" : ""}
              autoFocus
              required
            />
          </FormField>

          <FormField
            label="URL Slug *"
            htmlFor="cat-slug"
            error={fieldErrors.slug}
            hint="URL parameter: /categories/:slug"
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                id="cat-slug"
                placeholder="e.g. newborn-babies, kidshoodies"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
                  if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
                }}
                className={fieldErrors.slug ? "has-error" : ""}
                style={{ flex: 1 }}
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "11px", padding: "8px 12px", whiteSpace: "nowrap" }}
                onClick={() => setSlug(slugify(name))}
                title="Generate slug from category name"
              >
                Sync Slug
              </button>
            </div>
          </FormField>
        </div>

        {/* 2. Display Order Sequence & Short Description */}
        <div className="form-grid">
          <FormField
            label="Display Order Sequence *"
            htmlFor="cat-sort-order"
            error={fieldErrors.sortOrder}
            hint="Lower number appears first on navbar & storefront"
          >
            <input
              id="cat-sort-order"
              type="number"
              min="0"
              placeholder="e.g. 0, 1, 2"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                if (fieldErrors.sortOrder) setFieldErrors((p) => ({ ...p, sortOrder: "" }));
              }}
              className={fieldErrors.sortOrder ? "has-error" : ""}
              required
            />
          </FormField>

          <FormField
            label="Short Description *"
            htmlFor="cat-desc"
            error={fieldErrors.description}
            hint="Category description used across storefront"
          >
            <input
              id="cat-desc"
              placeholder="e.g. Premium pure cotton drops and streetwear fits"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((p) => ({ ...p, description: "" }));
              }}
              className={fieldErrors.description ? "has-error" : ""}
              required
            />
          </FormField>
        </div>

        {/* 3. Collection Page Hero Banner (Pure Banner Image) */}
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <ImageUploadField
            label="Collection Page Hero Banner"
            value={bannerImageUrl}
            onChange={(url) => {
              setBannerImageUrl(url);
              if (fieldErrors.bannerImageUrl) setFieldErrors((p) => ({ ...p, bannerImageUrl: "" }));
            }}
            folder="banners"
            aspectRatio="16/9"
            previewHeight={180}
            required
            error={fieldErrors.bannerImageUrl}
            dimensionRule={{
              minWidth: 1200,
              minRatio: 2.0,
              maxRatio: 2.6,
              label: "1920 × 800px (2.4:1 ratio, min 1200px wide)"
            }}
            hint="Upload a high-resolution landscape banner image for this category collection page (Required: 1920 × 800px, 2.4:1 ratio). Other sizes will be rejected."
          />
        </div>

        {/* 4. Active & Show Category Checkboxes */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 8,
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0"
          }}
        >
          <div className="checkbox-row">
            <input
              id="cat-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="cat-active" style={{ cursor: "pointer", fontSize: 13 }}>
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
            <label htmlFor="cat-home" style={{ cursor: "pointer", fontSize: 13 }}>
              <strong>Show Category Carousel on Homepage</strong>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions" style={{ marginTop: 22 }}>
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
