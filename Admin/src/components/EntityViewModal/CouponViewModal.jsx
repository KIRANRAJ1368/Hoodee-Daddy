import { useState } from "react";
import { Tag, Percent, IndianRupee, Calendar, CheckCircle2, Copy, Check, Edit2, ShieldAlert, Sparkles } from "lucide-react";
import Modal from "../Modal/Modal";
import StatusBadge from "../StatusBadge/StatusBadge";
import { useToast } from "../../context/ToastContext";
import "./EntityViewModal.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "No Expiration (Lifetime)";

export default function CouponViewModal({ coupon, onClose, onEdit }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const data = coupon || null;

  if (!data) {
    return (
      <Modal title="Coupon Details" onClose={onClose} width={520}>
        <div className="ev-error">
          <p>Coupon details not found.</p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const isPercentage = data.discount_type === "percentage";
  const discountVal = Number(data.discount_value || 0);
  const minSpend = Number(data.min_spend || 0);
  const maxDiscount = Number(data.max_discount || 0);
  const usageLimit = data.usage_limit ? Number(data.usage_limit) : null;
  const timesUsed = Number(data.times_used ?? data.used_count ?? 0);
  const usagePercentage = usageLimit ? Math.min(Math.round((timesUsed / usageLimit) * 100), 100) : 0;

  function copyCode() {
    if (!data.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    toast.success(`Coupon code "${data.code}" copied to clipboard`);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <Modal title="Coupon Voucher Overview" onClose={onClose} width={640}>
      <div className="ev">
        {/* Luxury Voucher Ticket Card */}
        <div className="ev-coupon-pass">
          <div className="ev-coupon-val-col">
            <span className="ev-coupon-tag">
              <Sparkles size={11} style={{ display: "inline", marginRight: 4 }} />
              Exclusive Storefront Privilege
            </span>
            <div className="ev-coupon-val">
              {isPercentage ? `${discountVal}% OFF` : `₹${discountVal.toLocaleString("en-IN")} OFF`}
            </div>
            <span className="ev-coupon-sub">
              {minSpend > 0
                ? `Valid on orders above ₹${minSpend.toLocaleString("en-IN")}`
                : "No minimum spend required"}
            </span>
          </div>

          <div className="ev-coupon-code-box">
            <span className="ev-coupon-code">{data.code}</span>
            <button
              type="button"
              className="ev-coupon-copy-btn"
              onClick={copyCode}
              title="Copy code to clipboard"
            >
              {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Status & Header Info */}
        <div className="ev-header">
          <div className="ev-heading">
            <div className="ev-title-row">
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                {data.description || `Special discount voucher ${data.code}`}
              </h3>
            </div>
            <div className="ev-meta-line">
              <span>Type: <strong>{isPercentage ? "Percentage Discount" : "Fixed Cash Amount"}</strong></span>
              <span className="ev-sep">•</span>
              <span>Created ID: <strong>{data.id}</strong></span>
            </div>
          </div>
          <div className="ev-status-col">
            <StatusBadge
              status={data.is_active ? "active" : "inactive"}
              label={data.is_active ? "Active & Live" : "Disabled"}
            />
          </div>
        </div>

        {/* 4 Specifications Cards */}
        <div>
          <div className="ev-section-label">Redemption Rules & Constraints</div>
          <div className="ev-stat-grid">
            <div className="ev-stat-card">
              <span className="ev-stat-label">Minimum Order Requirement</span>
              <span className="ev-stat-value">
                <IndianRupee size={14} style={{ color: "var(--indigo)" }} />
                <span>{minSpend > 0 ? `₹${minSpend.toLocaleString("en-IN")}` : "₹0 (No Minimum)"}</span>
              </span>
            </div>

            <div className="ev-stat-card">
              <span className="ev-stat-label">Maximum Discount Cap</span>
              <span className="ev-stat-value">
                <Percent size={14} style={{ color: "var(--indigo)" }} />
                <span>{maxDiscount > 0 ? `₹${maxDiscount.toLocaleString("en-IN")}` : "Uncapped (Full Value)"}</span>
              </span>
            </div>

            <div className="ev-stat-card">
              <span className="ev-stat-label">Total Redemptions</span>
              <span className="ev-stat-value">
                <span>
                  <strong>{timesUsed}</strong> {usageLimit ? `/ ${usageLimit} uses` : "redemptions (Unlimited)"}
                </span>
              </span>
              {usageLimit ? (
                <div style={{ width: "100%", height: 5, background: "#e2e8f0", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${usagePercentage}%`,
                      height: "100%",
                      background: usagePercentage > 85 ? "#ef4444" : "var(--indigo)",
                      borderRadius: 3
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="ev-stat-card">
              <span className="ev-stat-label">Expiration Date</span>
              <span className="ev-stat-value" style={{ fontSize: 13 }}>
                <Calendar size={13} style={{ color: "var(--text-subtle)" }} />
                <span>{formatDate(data.expires_at || data.expiresAt)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Storefront Integration Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: data.is_active ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${data.is_active ? "#a7f3d0" : "#fecaca"}`
          }}
        >
          {data.is_active ? (
            <>
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: "#065f46" }}>
                <strong>Verified Storefront Active:</strong> Customers can apply{" "}
                <code style={{ background: "#ffffff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{data.code}</code> at the Cart Drawer or Checkout page to claim this discount.
              </div>
            </>
          ) : (
            <>
              <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: "#991b1b" }}>
                <strong>Voucher Inactive:</strong> This coupon is currently disabled and will be rejected if entered by customers at checkout.
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="ev-footer">
          <div className="ev-footer-meta">
            <span>Coupon ID: <strong>{data.id}</strong></span>
          </div>

          <div className="ev-footer-actions">
            {onEdit && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(data);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Coupon</span>
              </button>
            )}
            <button type="button" className="btn btn-accent btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
