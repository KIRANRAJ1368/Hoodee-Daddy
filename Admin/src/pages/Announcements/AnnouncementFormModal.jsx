import React, { useState, useEffect } from "react";
import { Check, Eye } from "lucide-react";
import Modal from "../../components/Modal/Modal";
import FormField from "../../components/FormField/FormField";
import { announcementsApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";

const STATIC_LINK_OPTIONS = [
  { value: "", label: "None (Text Only — No Redirect Link)" },
  {
    group: "Collections & Highlights",
    options: [
      { value: "/collection", label: "All Collections (/collection)" },
      { value: "/collection?collection=new-arrivals", label: "New Arrivals (/collection?collection=new-arrivals)" },
      { value: "/collection?collection=best-sellers", label: "Best Sellers (/collection?collection=best-sellers)" }
    ]
  },
  {
    group: "Core Categories",
    options: [
      { value: "/categories/mens", label: "Men's Collection (/categories/mens)" },
      { value: "/categories/women", label: "Women's Collection (/categories/women)" },
      { value: "/categories/kids", label: "Kids Collection (/categories/kids)" },
      { value: "/categories/boys", label: "Boys Collection (/categories/boys)" },
      { value: "/categories/girls", label: "Girls Collection (/categories/girls)" },
      { value: "/categories/babies", label: "Babies Collection (/categories/babies)" }
    ]
  },
  {
    group: "Store Information & Policies",
    options: [
      { value: "/about", label: "About Us (/about)" },
      { value: "/contact", label: "Contact Us (/contact)" },
      { value: "/faq", label: "Frequently Asked Questions (/faq)" },
      { value: "/size-guide", label: "Size Guide (/size-guide)" },
      { value: "/return-refund-policy", label: "Return & Refund Policy (/return-refund-policy)" },
      { value: "/shipping-policy", label: "Shipping Policy (/shipping-policy)" }
    ]
  }
];

export default function AnnouncementFormModal({ announcement, onClose, onSaved }) {
  const isEdit = Boolean(announcement?.id);
  const toast = useToast();

  const [message, setMessage] = useState(announcement?.message || "");
  const [linkUrl, setLinkUrl] = useState(announcement?.link_url || "");
  const [isActive, setIsActive] = useState(announcement?.is_active ?? true);
  const [categories, setCategories] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load active categories to include in link dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoriesApi.list({ includeInactive: "false" });
        if (Array.isArray(res?.data)) {
          setCategories(res.data);
        }
      } catch {
        // Fallback gracefully to static links
      }
    }
    loadCategories();
  }, []);

  function broadcastAnnouncementUpdate(actionType) {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("zmw_catalog_channel");
        bc.postMessage({ action: actionType, timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!message || !message.trim()) {
      setErrors({ message: "Announcement message is required" });
      toast.error("Please enter the announcement message");
      return;
    }

    setErrors({});
    setIsSaving(true);

    const payload = {
      message: message.trim(),
      link_url: linkUrl ? linkUrl.trim() : null,
      is_active: isActive
    };

    try {
      if (isEdit) {
        await announcementsApi.update(announcement.id, payload);
        toast.success("Top announcement updated successfully");
        broadcastAnnouncementUpdate("ANNOUNCEMENT_UPDATED");
      } else {
        await announcementsApi.create(payload);
        toast.success("Top announcement saved successfully");
        broadcastAnnouncementUpdate("ANNOUNCEMENT_CREATED");
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || "Failed to save announcement");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit Top Announcement" : "Create Top Announcement"}
      onClose={onClose}
      width={620}
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Live Storefront Preview in Red Bar */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8
            }}
          >
            <Eye size={13} />
            <span>Storefront Announcement Preview (Red Bar)</span>
          </label>

          <div
            style={{
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "9px 36px 9px 16px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.03em",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
              minHeight: 38,
              overflow: "hidden"
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {message || "Type your promotional announcement message below..."}
            </span>
            {linkUrl && (
              <span style={{ marginLeft: 6, opacity: 0.9 }}>&rarr;</span>
            )}
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                opacity: 0.9
              }}
            >
              ✕
            </span>
          </div>
        </div>

        {/* 1. Announcement Message */}
        <FormField
          label="Announcement Message *"
          htmlFor="ann-msg"
          error={errors.message}
          hint="Supports promotional tags and emojis (e.g. ⚡ SPECIAL OFFER: FREE SHIPPING ON ALL ORDERS ABOVE ₹499 | USE CODE: FREESHIP)"
        >
          <textarea
            id="ann-msg"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. ⚡ SPECIAL OFFER: FREE SHIPPING ON ALL ORDERS ABOVE ₹499 | USE CODE: FREESHIP"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              fontSize: 13.5,
              fontFamily: "inherit",
              resize: "vertical",
              lineHeight: 1.4
            }}
          />
        </FormField>

        {/* 3. Active & Visible Checkbox */}
        <div
          className="checkbox-row"
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0"
          }}
        >
          <input
            id="ann-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="ann-active" style={{ cursor: "pointer", fontSize: 13 }}>
            <strong>Active & Visible at Top of Website</strong>
            <span style={{ display: "block", fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
              Display this red announcement bar across all storefront pages
            </span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="form-actions" style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-accent"
            disabled={isSaving}
          >
            <Check size={16} />
            <span>{isSaving ? "Saving..." : isEdit ? "Save Changes" : "Save Announcement"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
