import { useState } from "react";
import { Sparkles, ZoomIn, ArrowUpRight, Layers, Eye, Edit2, Compass } from "lucide-react";
import Modal from "../Modal/Modal";
import StatusBadge from "../StatusBadge/StatusBadge";
import ImageLightboxModal from "../ImageLightboxModal/ImageLightboxModal";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./EntityViewModal.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

export default function BannerViewModal({ banner, onEdit, onClose }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const data = banner || null;

  if (!data) {
    return (
      <Modal title="Banner Details" onClose={onClose} width={560}>
        <div className="ev-error">
          <p>Banner not found.</p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const resolvedImg = resolveImageUrl(data.image_url);

  return (
    <Modal title="Campaign Banner Overview" onClose={onClose} width={860}>
      <div className="ev">
        {/* Header */}
        <div className="ev-header">
          <div className="ev-heading">
            <div className="ev-title-row">
              <h2 className="ev-name">{data.title}</h2>
              {data.placement === "hero" ? (
                <span className="pill-badge badge-gold">
                  <Sparkles size={11} />
                  <span>Hero Slider Showcase</span>
                </span>
              ) : (
                <span className="pill-badge badge-dark">
                  <span>{data.placement}</span>
                </span>
              )}
            </div>
            <div className="ev-meta-line">
              {data.tag && (
                <>
                  <span style={{ fontWeight: 700, color: "var(--indigo)" }}>{data.tag}</span>
                  <span className="ev-sep">•</span>
                </>
              )}
              <code>Placement: {data.placement}</code>
            </div>
          </div>
          <div className="ev-status-col">
            <StatusBadge value={data.is_active ? "active" : "inactive"} />
          </div>
        </div>

        {/* Live Storefront Overlay Simulation */}
        <div>
          <div className="ev-section-label">
            <Eye size={13} />
            <span>Live Storefront Visual Simulation</span>
          </div>

          <div
            className="ev-image-frame ev-image-frame-banner ev-image-clickable"
            onClick={() => setShowLightbox(true)}
            title="Click to inspect in Full HD"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setShowLightbox(true)}
          >
            <span className="ev-image-badge">Campaign Spotlight</span>

            {/* Live Banner Overlay (Matches Storefront Home Hero Slider) */}
            <div className="ev-banner-overlay-preview">
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {data.tag && <span className="ev-banner-eyebrow">{data.tag}</span>}
                {data.badge_promo && (
                  <span className="pill-badge" style={{ fontSize: 10, padding: "2px 8px", background: "rgba(250, 167, 3, 0.25)", color: "#FFD166", border: "1px solid rgba(250, 167, 3, 0.6)", fontWeight: 700, letterSpacing: "0.04em" }}>
                    {data.badge_promo}
                  </span>
                )}
              </div>
              <h3 className="ev-banner-title">{data.title}</h3>
              {data.subtitle && <p className="ev-banner-subtitle">{data.subtitle}</p>}

              <div className="ev-banner-btn-row">
                {data.primary_cta_text && (
                  <span className="ev-banner-preview-btn ev-banner-preview-btn-primary">
                    <span>{data.primary_cta_text}</span>
                    <ArrowUpRight size={12} />
                  </span>
                )}
              </div>
            </div>

            <img
              src={resolvedImg}
              alt={data.title}
              loading="lazy"
              style={{ objectPosition: data.image_position || "85% top" }}
              onError={(e) => {
                e.currentTarget.src = "/images/hero-mens-oversized-tee.jpg";
              }}
            />

            <div className="ev-image-hover-hint">
              <ZoomIn size={14} />
              <span>Enlarge HD</span>
            </div>
          </div>
        </div>

        {/* Interactive Specs & Storefront Settings */}
        <div className="ev-stat-grid-3">
          <div className="ev-stat-card">
            <span className="ev-stat-label">Slide Placement</span>
            <span className="ev-stat-value">
              <Layers size={14} style={{ color: "var(--indigo)" }} />
              <span style={{ textTransform: "capitalize" }}>{data.placement}</span>
            </span>
          </div>

          {/* <div className="ev-stat-card">
            <span className="ev-stat-label">Focal Position</span>
            <span className="ev-stat-value" style={{ fontSize: 13 }}>
              <Compass size={13} style={{ color: "var(--text-subtle)" }} />
              <span>{data.image_position || "center center"}</span>
            </span>
          </div> */}

          <div className="ev-stat-card">
            <span className="ev-stat-label">Storefront Visibility</span>
            <span className="ev-stat-value" style={{ fontSize: 13, color: data.is_active ? "#059669" : "#94a3b8" }}>
              <Eye size={13} />
              <span>{data.is_active ? "Live in Rotation" : "Hidden"}</span>
            </span>
          </div>
        </div>

        {/* Call to Action Navigation Links */}
        <div>
          <div className="ev-section-label">Interactive Call-to-Action Destination</div>
          <div className="ev-stat-card">
            <span className="ev-stat-label">Primary Action Button</span>
            <div style={{ marginTop: 4 }}>
              <strong style={{ fontSize: 14, color: "var(--text-main)" }}>
                {data.primary_cta_text || "—"}
              </strong>
              {data.primary_cta_link && data.primary_cta_link !== "#collection-catalog" && !data.primary_cta_link.startsWith("#") && (
                <div style={{ marginTop: 4 }}>
                  <code style={{ fontSize: 11.5 }}>{data.primary_cta_link}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="ev-footer">
          <div className="ev-footer-meta">
            <span>
              Banner ID: <strong>{data.id}</strong>
            </span>
            <span className="ev-sep">•</span>
            <span>Created {formatDate(data.createdAt || data.created_at)}</span>
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
                <span>Edit Banner</span>
              </button>
            )}
            <button type="button" className="btn btn-accent btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>

      {showLightbox && (
        <ImageLightboxModal
          src={resolvedImg}
          alt={data.title}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </Modal>
  );
}
