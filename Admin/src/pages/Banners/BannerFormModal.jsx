import { useState, useEffect, useMemo } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import FormField from "../../components/FormField/FormField";
import ImageUploadField from "../../components/ImageUploadField/ImageUploadField";
import { bannersApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../services/api";

const CORE_PLACEMENTS = [
  { value: "hero", label: "Hero Carousel (Storefront Homepage Top)" },
  { value: "best-sellers", label: "Best Sellers Promo Banner" },
  { value: "new-arrivals", label: "New Arrivals Promo Banner" },
  { value: "default", label: "Default Fallback Banner" }
];

export default function BannerFormModal({ banner, heroCount = 0, offerCount = 0, onClose, onSaved }) {
  const isEdit = !!banner.id;
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoriesApi
      .list({ includeInactive: "false" })
      .then((catRes) => {
        if (Array.isArray(catRes?.data)) setCategories(catRes.data);
      })
      .catch(() => setCategories([]));
  }, []);

  const dynamicPlacements = useMemo(() => {
    const list = [
      { value: "hero", label: "Hero Carousel (Storefront Homepage Top)" }
    ];
    list.push({ value: "offers", label: "Offer Banners (Storefront Offers Row)" });
    categories.forEach((cat) => {
      list.push({
        value: cat.slug,
        label: `${cat.name}'s Collection Header`
      });
    });
    list.push(
      { value: "best-sellers", label: "Best Sellers Promo Banner" },
      { value: "new-arrivals", label: "New Arrivals Promo Banner" },
      { value: "default", label: "Default Fallback Banner" }
    );
    // If editing a banner whose placement isn't in the list, keep it visible
    if (banner?.placement && !list.some((p) => p.value === banner.placement)) {
      list.push({
        value: banner.placement,
        label: `${banner.placement.charAt(0).toUpperCase() + banner.placement.slice(1)} Header`
      });
    }
    return list;
  }, [categories, banner]);

  function defaultPlacement() {
    if (banner.placement) return banner.placement;
    if (heroCount >= 3) return "mens";
    return "hero";
  }

  const [form, setForm] = useState({
    placement: defaultPlacement(),
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    tag: banner.tag || "",
    badge_promo: banner.badge_promo || "",
    image_url: banner.image_url || "",
    image_position: banner.image_position || "center center",
    primary_cta_text: banner.primary_cta_text || "",
    primary_cta_link: banner.primary_cta_link || "",
    secondary_cta_text: banner.secondary_cta_text || "",
    secondary_cta_link: banner.secondary_cta_link || "",
    sort_order: banner.sort_order ?? 0,
    is_active: banner.is_active ?? true
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.placement === "hero" && (!isEdit || banner.placement !== "hero") && heroCount >= 3) {
      toast.error("Maximum 3 Hero Banners can be added.");
      setErrors((prev) => ({ ...prev, placement: "Maximum 3 Hero Banners can be added." }));
      return;
    }
    if (form.placement === "offers" && (!isEdit || banner.placement !== "offers") && offerCount >= 10) {
      toast.error("Maximum 10 offer banners can be added.");
      setErrors((prev) => ({ ...prev, placement: "Maximum 10 offer banners can be added." }));
      return;
    }

    if (!form.image_url) {
      toast.error("Please upload a banner image");
      setErrors((prev) => ({ ...prev, image_url: "Please upload a banner image" }));
      return;
    }

    if (!form.title || !form.title.trim()) {
      toast.error("Please enter the headline title");
      setErrors((prev) => ({ ...prev, title: "Please enter the headline title" }));
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const payload = { ...form };

      if (isEdit) {
        await bannersApi.update(banner.id, payload);
        toast.success(`Banner "${payload.title}" updated successfully!`);
      } else {
        await bannersApi.create(payload);
        toast.success(`Banner "${payload.title}" created successfully!`);
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      toast.error(err.message || "Failed to save banner");
    } finally {
      setIsSaving(false);
    }
  }

  const currentIsHeroCapped =
    form.placement === "hero" && (!isEdit || banner.placement !== "hero") && heroCount >= 3;

  return (
    <Modal
      title={isEdit ? "Edit Banner" : "Create New Banner"}
      onClose={onClose}
      width={700}
    >
      <form noValidate onSubmit={handleSubmit}>
        {currentIsHeroCapped && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span><strong>Maximum 3 Hero Banners can be added.</strong> Please choose another placement or remove an existing hero banner first.</span>
          </div>
        )}

        {/* Placement & Sequence */}
        <div className="form-grid">
          <FormField
            label="Banner Placement / Target *"
            htmlFor="b-placement"
            error={errors.placement || (currentIsHeroCapped ? "Maximum 3 Hero Banners can be added." : null)}
          >
            <select
              id="b-placement"
              value={form.placement}
              onChange={(e) => update("placement", e.target.value)}
            >
              {dynamicPlacements.map((p) => {
                const isHeroOptionDisabled =
                  p.value === "hero" && (!isEdit || banner.placement !== "hero") && heroCount >= 3;
                return (
                  <option key={p.value} value={p.value} disabled={isHeroOptionDisabled}>
                    {p.label}{isHeroOptionDisabled ? " — (Max 3 reached)" : ""}
                  </option>
                );
              })}
            </select>
          </FormField>

          <FormField label="Display Order Sequence" htmlFor="b-sort" hint="Lower appears first in slider">
            <input
              id="b-sort"
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
            />
          </FormField>
        </div>

        {/* Banner Imagery */}
        <ImageUploadField
          label="Banner Image"
          value={form.image_url}
          onChange={(url) => update("image_url", url)}
          folder="banners"
          aspectRatio="16/9"
          previewHeight={180}
          hint="Upload a high-resolution landscape banner (Recommended: 1920 × 800px or 16:9 ratio). Supports JPG, PNG, WEBP up to 10MB."
          error={errors.image_url}
          required
        />

        <div className="form-grid">
          {/* <FormField
            label="Image Focal Position"
            htmlFor="b-image-position"
            hint="CSS object-position, e.g. center center, right top"
          >
            <input
              id="b-image-position"
              value={form.image_position}
              onChange={(e) => update("image_position", e.target.value)}
              placeholder="center center"
            />
          </FormField> */}

          <FormField
            label="Promo Badge Tag"
            htmlFor="b-badge"
            hint="e.g. FLAT 20% OFF &bull; LIMITED DROP"
          >
            <input
              id="b-badge"
              placeholder="e.g. LUXURY EDITION &bull; NEW SEASON"
              value={form.badge_promo}
              onChange={(e) => update("badge_promo", e.target.value)}
            />
          </FormField>
        </div>

        {/* Copy / Typography */}
        <FormField
          label="Tagline / Eyebrow Text"
          htmlFor="b-tag"
          hint="Small uppercase kicker above headline, e.g. AUTUMN / WINTER 2026"
        >
          <input
            id="b-tag"
            placeholder="e.g. AUTUMN / WINTER 2026"
            value={form.tag}
            onChange={(e) => update("tag", e.target.value)}
          />
        </FormField>

        <FormField label="Headline Title *" htmlFor="b-title" error={errors.title}>
          <input
            id="b-title"
            placeholder="e.g. Redefine Your Wardrobe"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </FormField>

        <FormField label="Subtitle / Description Copy" htmlFor="b-subtitle">
          <textarea
            id="b-subtitle"
            rows={2}
            placeholder="Crafted with 450+ GSM heavyweight cotton for timeless silhouette and warmth."
            value={form.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
          />
        </FormField>

        {/* Buttons / CTA */}
        <div className="form-grid">
          <FormField label="Primary CTA Text" htmlFor="b-cta1-text">
            <input
              id="b-cta1-text"
              placeholder="e.g. Shop Collection"
              value={form.primary_cta_text}
              onChange={(e) => update("primary_cta_text", e.target.value)}
            />
          </FormField>

          <FormField
            label="Primary CTA Link"
            htmlFor="b-cta1-link"
            hint="Choose where visitors go when clicking this banner"
            error={errors.primary_cta_link}
          >
            <select
              id="b-cta1-link"
              value={form.primary_cta_link || ""}
              onChange={(e) => {
                const val = e.target.value;
                update("primary_cta_link", val);
                if (!form.primary_cta_text && val) {
                  const matchedCat = categories.find(
                    (c) => `/collection?category=${encodeURIComponent(c.slug)}` === val
                  );
                  if (matchedCat) update("primary_cta_text", `Shop ${matchedCat.name}`);
                  else if (val === "/collection") update("primary_cta_text", "Shop All");
                }
              }}
            >
              <option value="">-- Select Category --</option>
              <option value="/collection">All Categories (Shop All)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={`/collection?category=${encodeURIComponent(cat.slug)}`}>
                  {cat.name}
                </option>
              ))}
              {form.primary_cta_link &&
                form.primary_cta_link !== "/collection" &&
                !categories.some((c) => `/collection?category=${encodeURIComponent(c.slug)}` === form.primary_cta_link) && (
                  <option value={form.primary_cta_link}>{form.primary_cta_link}</option>
              )}
            </select>
            {form.primary_cta_link && (
              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                <span>Target:</span>
                <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, color: "#334155", fontSize: 11 }}>
                  {form.primary_cta_link}
                </code>
              </div>
            )}
          </FormField>
        </div>

        <div className="checkbox-row" style={{ marginTop: 6 }}>
          <input
            id="b-active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          <label htmlFor="b-active">
            <strong>Active & Visible on Storefront</strong>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={isSaving || currentIsHeroCapped}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
