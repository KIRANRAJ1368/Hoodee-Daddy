import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import FormField from "../../components/FormField/FormField";
import ImageUploadField from "../../components/ImageUploadField/ImageUploadField";
import { subcategoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../services/api";
import { slugify } from "../../utils/slugify";
import { broadcastCatalogUpdate } from "../../utils/broadcastCatalogUpdate";

export default function SubcategoryFormModal({ subcategory, categories, onClose, onSaved }) {
  const isEdit = !!subcategory.id;
  const [form, setForm] = useState({
    category_id: subcategory.category_id || subcategory.category?.id || categories[0]?.id || "",
    name: subcategory.name || "",
    slug: subcategory.slug || "",
    image_url: subcategory.image_url || "",
    sort_order: subcategory.sort_order ?? 0,
    is_active: subcategory.is_active ?? true,
    show_on_homepage: subcategory.show_on_homepage ?? true
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
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

  function handleNameChange(value) {
    update("name", value);
    if (!slugTouched) update("slug", slugify(value));
  }

  function validate() {
    const errs = {};
    const trimmedName = (form.name || "").trim();
    const trimmedSlug = (form.slug || "").trim();
    const catId = Number(form.category_id);

    if (!catId) {
      errs.category_id = "Please select a parent category";
    }

    if (!trimmedName) {
      errs.name = "Please enter the subcategory title";
    } else if (trimmedName.length > 80) {
      errs.name = "Subcategory title must be under 80 characters";
    }

    if (!trimmedSlug) {
      errs.slug = "Please enter the URL slug";
    } else if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      errs.slug = "Slug may only contain lowercase letters, numbers, and hyphens";
    }

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || "Please fill in all required fields.");
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        category_id: Number(form.category_id),
        name: form.name.trim(),
        slug: form.slug.trim(),
        image_url: form.image_url && form.image_url.trim() ? form.image_url.trim() : null,
        sort_order: Number(form.sort_order) || 0,
        is_active: Boolean(form.is_active),
        show_on_homepage: Boolean(form.show_on_homepage)
      };

      if (isEdit) {
        await subcategoriesApi.update(subcategory.id, payload);
        broadcastCatalogUpdate({ action: "SUBCATEGORY_UPDATED", subcategoryId: subcategory.id, slug: payload.slug });
        toast.success(`Subcategory "${payload.name}" updated successfully!`);
      } else {
        const res = await subcategoriesApi.create(payload);
        broadcastCatalogUpdate({ action: "SUBCATEGORY_CREATED", subcategoryId: res?.data?.id, slug: payload.slug });
        toast.success(`Subcategory "${payload.name}" created successfully!`);
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      toast.error(err.message || "Failed to save subcategory");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Subcategory" : "Add New Subcategory"}
      onClose={onClose}
      width={600}
    >
      <form noValidate onSubmit={handleSubmit}>
        <FormField label="Parent Category *" htmlFor="sub-category" error={errors.category_id}>
          <select
            id="sub-category"
            value={form.category_id}
            onChange={(e) => update("category_id", e.target.value)}
            className={errors.category_id ? "has-error" : ""}
            required
          >
            <option value="">Select a Parent Category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="form-grid">
          <FormField label="Subcategory Title *" htmlFor="sub-name" error={errors.name}>
            <input
              id="sub-name"
              placeholder="e.g. Oversized Hoodies, Vintage Tees, Cargos"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={errors.name ? "has-error" : ""}
              required
            />
          </FormField>

          <FormField label="URL Slug *" htmlFor="sub-slug" error={errors.slug} hint="Collection filter path">
            <input
              id="sub-slug"
              placeholder="oversized-hoodies"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", e.target.value);
              }}
              className={errors.slug ? "has-error" : ""}
              required
            />
          </FormField>
        </div>

        {/* Subcategory Image Upload */}
        <ImageUploadField
          label="Subcategory Image (Optional)"
          value={form.image_url}
          onChange={(url) => update("image_url", url)}
          folder="subcategories"
          aspectRatio="4/5"
          previewHeight={170}
          hint="Optional: Upload a clean photo for this subcategory card (Recommended: 600 × 750px portrait). Once uploaded, it will appear on the Homepage."
          error={errors.image_url}
        />

        <div className="form-grid">
          <FormField label="Display Order" htmlFor="sub-sort" hint="Sequence within parent category">
            <input
              id="sub-sort"
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
            />
          </FormField>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 20 }}>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input
                id="sub-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update("is_active", e.target.checked)}
              />
              <span>
                <strong>Active in Storefront Filter Pills</strong>
              </span>
            </label>

            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input
                id="sub-homepage"
                type="checkbox"
                checked={form.show_on_homepage}
                onChange={(e) => update("show_on_homepage", e.target.checked)}
              />
              <span>
                <strong>Show on Homepage</strong>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  Display this subcategory tile in its category section on the customer storefront homepage. If more than 4 subcategories are enabled in a category, that section switches to a horizontal carousel.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Subcategory" : "Create Subcategory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
