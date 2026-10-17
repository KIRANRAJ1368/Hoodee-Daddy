import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import FormField from "../../components/FormField/FormField";
import { couponsApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";

export default function CouponFormModal({ coupon, onClose, onSaved }) {
  const isEdit = !!coupon.id;
  const [form, setForm] = useState({
    code: coupon.code || "",
    description: coupon.description || "",
    discount_type: coupon.discount_type || "percentage",
    discount_value: coupon.discount_value ?? 10,
    min_spend: coupon.min_spend ?? 0,
    max_discount: coupon.max_discount ?? "",
    usage_limit: coupon.usage_limit ?? "",
    is_active: coupon.is_active ?? true
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};

    if (!form.code || !form.code.trim()) {
      errs.code = "Please enter the coupon code";
    }
    const val = Number(form.discount_value);
    if (form.discount_value === "" || form.discount_value === null || !Number.isFinite(val) || val <= 0) {
      errs.discount_value = "Please enter a valid discount value";
    } else if (form.discount_type === "percentage" && val > 100) {
      errs.discount_value = "Percentage discount cannot exceed 100%";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error(Object.values(errs)[0]);
      return;
    }

    setErrors({});
    setIsSaving(true);

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discount_value: Number(form.discount_value),
      min_spend: Number(form.min_spend || 0),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null
    };

    try {
      if (isEdit) {
        await couponsApi.update(coupon.id, payload);
        toast.success(`Coupon code "${payload.code}" updated successfully!`);
      } else {
        await couponsApi.create(payload);
        toast.success(`Coupon code "${payload.code}" created successfully!`);
      }
      if (typeof onSaved === "function") {
        await onSaved();
      }
      onClose();
    } catch (err) {
      if (err.details?.length) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      }
      toast.error(err.message || "Failed to save coupon");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit Coupon: ${coupon.code}` : "Create New Discount Coupon"}
      onClose={onClose}
      width={580}
    >
      <form noValidate onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <FormField
            label="Coupon Code *"
            description="Customers will enter this at checkout."
            error={errors.code}
          >
            <input
              type="text"
              className="input-field"
              required
              placeholder="e.g. LUXURY20"
              style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
            />
          </FormField>

          <FormField label="Discount Type *" error={errors.discount_type}>
            <select
              className="input-field"
              value={form.discount_type}
              onChange={(e) => update("discount_type", e.target.value)}
            >
              <option value="percentage">Percentage (%) Discount</option>
              <option value="fixed">Fixed Amount (₹) Off</option>
            </select>
          </FormField>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
          <FormField
            label={form.discount_type === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
            error={errors.discount_value}
          >
            <input
              type="number"
              className="input-field"
              required
              min="0"
              max={form.discount_type === "percentage" ? "100" : undefined}
              step="any"
              value={form.discount_value}
              onChange={(e) => update("discount_value", e.target.value)}
            />
          </FormField>

          <FormField
            label="Minimum Spend (₹)"
            description="Order subtotal required to apply."
            error={errors.min_spend}
          >
            <input
              type="number"
              className="input-field"
              min="0"
              placeholder="0 for no minimum"
              value={form.min_spend}
              onChange={(e) => update("min_spend", e.target.value)}
            />
          </FormField>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
          <FormField
            label="Maximum Cap (₹)"
            description="Max discount ceiling (optional)."
            error={errors.max_discount}
          >
            <input
              type="number"
              className="input-field"
              min="0"
              placeholder="Leave blank for uncapped"
              value={form.max_discount}
              onChange={(e) => update("max_discount", e.target.value)}
            />
          </FormField>

          <FormField
            label="Usage Limit"
            description="Max total redemptions permitted."
            error={errors.usage_limit}
          >
            <input
              type="number"
              className="input-field"
              min="1"
              placeholder="Unlimited if empty"
              value={form.usage_limit}
              onChange={(e) => update("usage_limit", e.target.value)}
            />
          </FormField>
        </div>

        <div style={{ marginTop: "12px" }}>
          <FormField label="Internal Description" description="Notes or campaign reference.">
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 10% off for first-time shoppers"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </FormField>
        </div>

        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            id="coupon_active"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#6366F1", cursor: "pointer" }}
          />
          <label htmlFor="coupon_active" style={{ fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }}>
            Enable Coupon (Active for customer checkouts)
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent" disabled={isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
