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

export default function BannerFormModal({ banner = {}, heroCount = 0, offerCount = 0, onClose, onSaved }) {
  const isEdit = Boolean(banner?.id);
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
    if (banner?.placement) return banner.placement;
    if (heroCount >= 3) return "mens";
    return "hero";
  }

  const [form, setForm] = useState({
    placement: defaultPlacement(),
    title: banner?.title || "",
    subtitle: banner?.subtitle || "",
    tag: banner?.tag || "",
    badge_promo: banner?.badge_promo || "",
    image_url: banner?.image_url || "",
    image_position: banner?.image_position || "center center",
    primary_cta_text: banner?.primary_cta_text || "",
    primary_cta_link: banner?.primary_cta_link || "",
    secondary_cta_text: banner?.secondary_cta_text || "",
    secondary_cta_link: banner?.secondary_cta_link || "",
    sort_order: banner?.sort_order ?? 0,
    is_active: banner?.is_active ?? true
  });

  const isHeroPlacement = form.placement === "hero";
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

    // For Hero Banners: automatically set a clean reference title if not provided
    const finalTitle = form.title?.trim() || (isHeroPlacement ? `Hero Banner ${(form.sort_order ?? 0) + 1}` : "Campaign Banner");

    if (!isHeroPlacement && (!form.title || !form.title.trim())) {
      toast.error("Please enter the headline title");
      setErrors((prev) => ({ ...prev, title: "Please enter the headline title" }));
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        placement: form.placement,
        sort_order: form.sort_order ?? 0,
        image_url: form.image_url,
        is_active: form.is_active ?? true,
        title: finalTitle,
        subtitle: isHeroPlacement ? null : (form.subtitle?.trim() || null),
        tag: isHeroPlacement ? null : (form.tag?.trim() || null),
        badge_promo: isHeroPlacement ? null : (form.badge_promo?.trim() || null),
        primary_cta_text: isHeroPlacement ? null : (form.primary_cta_text?.trim() || null),
        primary_cta_link: isHeroPlacement ? (form.primary_cta_link || null) : (form.primary_cta_link || null),
        secondary_cta_text: null,
        secondary_cta_link: null
      };

      if (isEdit) {
        await bannersApi.update(banner.id, payload);
        toast.success(`Banner updated successfully!`);
      } else {
        await bannersApi.create(payload);
        toast.success(`Banner created successfully!`);
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
      title={isEdit ? (isHeroPlacement ? "Edit Hero Banner" : "Edit Banner") : (isHeroPlacement ? "Create Hero Banner" : "Create New Banner")}
      onClose={onClose}
      width={680}
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

        {/* 1. Banner Placement & Sequence */}
        <div className="form-grid">
          <FormField
            label="Banner Placement *"
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

          <FormField label="Display Order Sequence" htmlFor="b-sort" hint="Lower number appears first (e.g. 0, 1, 2)">
            <input
              id="b-sort"
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
            />
          </FormField>
        </div>

        {/* 2. Banner Image * */}
        <ImageUploadField
          label="Banner Image *"
          value={form.image_url}
          onChange={(url) => update("image_url", url)}
          folder="banners"
          aspectRatio="16/9"
          previewHeight={200}
          hint="Upload a high-resolution landscape banner image (Recommended: 1920 × 800px or 16:9 ratio). Supports JPG, PNG, WEBP."
          error={errors.image_url}
          required
        />

        {/* Non-Hero Placements Only: Headline, Tag, Subtitle, CTA */}
        {!isHeroPlacement && (
          <>
            <FormField label="Headline Title *" htmlFor="b-title" error={errors.title}>
              <input
                id="b-title"
                placeholder="e.g. Redefine Your Wardrobe"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </FormField>

            <div className="form-grid">
              <FormField label="Tagline / Eyebrow Text" htmlFor="b-tag">
                <input
                  id="b-tag"
                  placeholder="e.g. NEW SEASON DROP"
                  value={form.tag}
                  onChange={(e) => update("tag", e.target.value)}
                />
              </FormField>

              <FormField label="Promo Badge Tag" htmlFor="b-badge">
                <input
                  id="b-badge"
                  placeholder="e.g. FLAT 20% OFF"
                  value={form.badge_promo}
                  onChange={(e) => update("badge_promo", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Subtitle / Description Copy" htmlFor="b-subtitle">
              <textarea
                id="b-subtitle"
                rows={2}
                placeholder="Description copy for banner"
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </FormField>

            <div className="form-grid">
              <FormField label="Button Text (CTA)" htmlFor="b-cta1-text">
                <input
                  id="b-cta1-text"
                  placeholder="e.g. Shop Now"
                  value={form.primary_cta_text}
                  onChange={(e) => update("primary_cta_text", e.target.value)}
                />
              </FormField>

              <FormField label="Button Link" htmlFor="b-cta1-link">
                <select
                  id="b-cta1-link"
                  value={form.primary_cta_link || ""}
                  onChange={(e) => update("primary_cta_link", e.target.value)}
                >
                  <option value="">-- Select Destination --</option>
                  <option value="/collection">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={`/collection?category=${encodeURIComponent(cat.slug)}`}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </>
        )}

        {/* 3. Active Checkbox */}
        <div className="checkbox-row" style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
          <input
            id="b-active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          <label htmlFor="b-active" style={{ cursor: "pointer", fontSize: 13 }}>
            <strong>Active & Visible on Storefront</strong>
          </label>
        </div>

        {/* Form Actions */}
        <div className="form-actions" style={{ marginTop: 20 }}>
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
