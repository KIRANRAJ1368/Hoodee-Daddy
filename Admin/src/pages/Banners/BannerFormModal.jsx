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
    primary_cta_link: banner?.primary_cta_link || "/collection",
    secondary_cta_text: banner?.secondary_cta_text || "",
    secondary_cta_link: banner?.secondary_cta_link || "",
    sort_order: banner?.sort_order ?? 0,
    is_active: banner?.is_active ?? true
  });

  const isHeroPlacement = form.placement === "hero";
  const isOfferPlacement = form.placement === "offers";
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const dimensionRule = useMemo(() => {
    if (form.placement === "offers") {
      return {
        minWidth: 500,
        minHeight: 500,
        minRatio: 0.92,
        maxRatio: 1.08,
        label: "800 × 800px (1:1 Square, min 500×500px)"
      };
    }
    // Hero, category collection headers, and promo placements:
    return {
      minWidth: 1200,
      minHeight: 450,
      minRatio: 2.0,
      maxRatio: 2.6,
      label: "1920 × 800px (2.4:1 ratio, min 1200px wide)"
    };
  }, [form.placement]);

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

    const valErrors = {};
    if (!form.placement) valErrors.placement = "Banner placement is required";
    if (!form.image_url) valErrors.image_url = "Banner image is required";
    if (!form.title || !form.title.trim()) valErrors.title = "Headline Title is required";
    if (form.sort_order === "" || form.sort_order === null || isNaN(Number(form.sort_order))) {
      valErrors.sort_order = "Display Order Sequence is required";
    }
    if (!form.primary_cta_link || !form.primary_cta_link.trim()) {
      valErrors.primary_cta_link = "Destination Link is required";
    }

    if (isOfferPlacement) {
      if (!form.badge_promo || !form.badge_promo.trim()) {
        valErrors.badge_promo = "Promo Badge Tag is required (e.g. FLAT 20% OFF)";
      }
      if (!form.subtitle || !form.subtitle.trim()) {
        valErrors.subtitle = "Offer Subtitle / Details are required";
      }
    }

    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      const first = Object.values(valErrors)[0];
      toast.error(first);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        placement: form.placement,
        sort_order: Number(form.sort_order) || 0,
        image_url: form.image_url.trim(),
        is_active: form.is_active ?? true,
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || null,
        tag: form.tag?.trim() || null,
        badge_promo: form.badge_promo?.trim() || null,
        primary_cta_text: form.primary_cta_text?.trim() || (isOfferPlacement ? "Claim Offer" : "Shop Now"),
        primary_cta_link: form.primary_cta_link.trim(),
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

          <FormField label="Display Order Sequence *" htmlFor="b-sort" error={errors.sort_order} hint="Lower number appears first (e.g. 0, 1, 2)">
            <input
              id="b-sort"
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
              required
            />
          </FormField>
        </div>

        {/* 2. Banner Image * */}
        <ImageUploadField
          label="Banner Image *"
          value={form.image_url}
          onChange={(url) => update("image_url", url)}
          folder="banners"
          aspectRatio={isOfferPlacement ? "1/1" : "16/9"}
          previewHeight={isOfferPlacement ? 180 : 200}
          dimensionRule={dimensionRule}
          hint={
            isOfferPlacement
              ? "Upload square offer image (Required: 800 × 800px, 1:1 ratio). Other sizes will be rejected."
              : "Upload high-resolution landscape banner image (Required: 1920 × 800px, 2.4:1 ratio). Other sizes will be rejected."
          }
          error={errors.image_url}
          required
        />

        {/* 3. Headline Title * */}
        <div style={{ marginTop: 14 }}>
          <FormField label="Headline Title *" htmlFor="b-title" error={errors.title} hint="Title for the campaign / carousel slide">
            <input
              id="b-title"
              placeholder={isHeroPlacement ? "e.g. Pure Streetwear Drop 2026" : "e.g. Redefine Your Wardrobe"}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </FormField>
        </div>

        {/* 4. Destination Link * */}
        <FormField label="Destination URL Link *" htmlFor="b-cta1-link" error={errors.primary_cta_link} hint="Link opened when banner is clicked">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              id="b-cta1-link"
              placeholder="/collection or /categories/kidshoodies"
              value={form.primary_cta_link}
              onChange={(e) => update("primary_cta_link", e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <select
              style={{ width: "160px" }}
              onChange={(e) => e.target.value && update("primary_cta_link", e.target.value)}
              value=""
            >
              <option value="">Quick Presets...</option>
              <option value="/collection">All Collections</option>
              {categories.map((cat) => (
                <option key={cat.id} value={`/categories/${cat.slug}`}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </FormField>

        {/* Offer Placements Specific Required Fields */}
        {isOfferPlacement && (
          <div style={{ background: "#fff7ed", padding: "14px", borderRadius: 8, border: "1px solid #ffedd5", marginTop: 12 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: 700, color: "#c2410c" }}>
              Offer Card Content &amp; Badges (All Required)
            </h4>
            <div className="form-grid">
              <FormField label="Promo Badge Tag *" htmlFor="b-badge" error={errors.badge_promo}>
                <input
                  id="b-badge"
                  placeholder="e.g. FLAT 20% OFF or BUY 2 @ ₹999"
                  value={form.badge_promo}
                  onChange={(e) => update("badge_promo", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Tagline / Eyebrow Text" htmlFor="b-tag">
                <input
                  id="b-tag"
                  placeholder="e.g. LIMITED TIME OFFER"
                  value={form.tag}
                  onChange={(e) => update("tag", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Offer Subtitle / Details *" htmlFor="b-subtitle" error={errors.subtitle}>
              <textarea
                id="b-subtitle"
                rows={2}
                placeholder="e.g. On all premium pure cotton graphic hoodies and streetwear tees."
                value={form.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
                required
              />
            </FormField>

            <FormField label="Button Label (CTA)" htmlFor="b-cta-text">
              <input
                id="b-cta-text"
                placeholder="e.g. Claim Offer"
                value={form.primary_cta_text}
                onChange={(e) => update("primary_cta_text", e.target.value)}
              />
            </FormField>
          </div>
        )}

        {/* Non-Hero / Non-Offer Extra Fields */}
        {!isHeroPlacement && !isOfferPlacement && (
          <div className="form-grid" style={{ marginTop: 12 }}>
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
