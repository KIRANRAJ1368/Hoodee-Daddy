import { useState } from "react";
import { ZoomIn, Hash, Layers, Eye, Tag, Filter } from "lucide-react";
import Modal from "../Modal/Modal";
import StatusBadge from "../StatusBadge/StatusBadge";
import ImageLightboxModal from "../ImageLightboxModal/ImageLightboxModal";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./EntityViewModal.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

export default function SubcategoryViewModal({ subcategory, onEdit, onClose }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const data = subcategory || null;

  if (!data) {
    return (
      <Modal title="Subcategory Details" onClose={onClose} width={560}>
        <div className="ev-error">
          <p>Subcategory not found.</p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const parent = data.category || null;
  const rawImage = data.image_url && typeof data.image_url === "string" ? data.image_url.trim() : "";
  const resolvedImg = rawImage ? resolveImageUrl(rawImage) : "";

  return (
    <Modal title="Subcategory Overview" onClose={onClose} width={740}>
      <div className="ev">
        {/* Header Banner */}
        <div className="ev-header">
          <div className="ev-heading">
            <div className="ev-title-row">
              <h2 className="ev-name">{data.name}</h2>
              <span className="pill-badge badge-gold">{parent?.name || "Apparel Group"}</span>
            </div>
            <div className="ev-meta-line">
              <code>{data.slug || "—"}</code>
              <span className="ev-sep">•</span>
              <span>Parent: {parent?.name || "Unassigned"}</span>
            </div>
          </div>
          <div className="ev-status-col">
            <StatusBadge value={data.is_active ? "active" : "inactive"} />
          </div>
        </div>

        {/* 2-Column Body */}
        <div className="ev-grid">
          <div className="ev-media">
            <div className="ev-section-label">Item Group Thumbnail</div>
            {resolvedImg ? (
              <div
                className="ev-image-frame ev-image-frame-tall ev-image-clickable"
                onClick={() => setShowLightbox(true)}
                title="Click to inspect in Full HD"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowLightbox(true)}
              >
                <span className="ev-image-badge">Filter Pill Thumbnail</span>
                <img
                  src={resolvedImg}
                  alt={data.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="ev-image-hover-hint">
                  <ZoomIn size={14} />
                  <span>Enlarge HD</span>
                </div>
              </div>
            ) : (
              <div
                className="ev-image-frame ev-image-frame-tall"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--surface-muted, #f8fafc)",
                  border: "1.5px dashed var(--border, #e2e8f0)",
                  color: "var(--text-muted, #64748b)"
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, textAlign: "center", padding: "0 16px" }}>
                  No image uploaded
                  <br />
                  <span style={{ fontSize: 11, opacity: 0.8 }}>Default badge used on storefront</span>
                </p>
              </div>
            )}
          </div>

          <div className="ev-details">
            <div className="ev-section-label">Classification Specs</div>

            <div className="ev-stat-grid">
              <div className="ev-stat-card">
                <span className="ev-stat-label">Parent Department</span>
                <span className="ev-stat-value">
                  <Layers size={14} style={{ color: "var(--indigo)" }} />
                  <span>{parent?.name || "Unassigned"}</span>
                </span>
              </div>

              <div className="ev-stat-card">
                <span className="ev-stat-label">URL Slug</span>
                <span className="ev-stat-value">
                  <code>{data.slug || "—"}</code>
                </span>
              </div>

              <div className="ev-stat-card">
                <span className="ev-stat-label">Sort Priority</span>
                <span className="ev-stat-value">
                  <Hash size={14} style={{ color: "var(--indigo)" }} />
                  <span>Sequence {data.sort_order ?? 0}</span>
                </span>
              </div>

              <div className="ev-stat-card">
                <span className="ev-stat-label">Filter Pill Status</span>
                <span className="ev-stat-value">
                  <Filter size={14} style={{ color: data.is_active ? "#059669" : "#94a3b8" }} />
                  <span>{data.is_active ? "Active in Pills" : "Hidden"}</span>
                </span>
              </div>
            </div>

            {/* Storefront Integration Note */}
            <div>
              <div className="ev-section-label">Storefront Integration</div>
              <div className="ev-desc-card">
                <p>
                  Products tagged under <strong>{data.name}</strong> will automatically appear under the{" "}
                  <strong>{parent?.name || "Selected Category"}</strong> collection filter pills and department feature
                  grids on the ZMW storefront.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="ev-footer">
          <div className="ev-footer-meta">
            <span>
              Subcategory ID: <strong>{data.id}</strong>
            </span>
            {data.category_id && (
              <>
                <span className="ev-sep">•</span>
                <span>
                  Department ID: <strong>{data.category_id}</strong>
                </span>
              </>
            )}
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
                Edit Subcategory
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
          alt={data.name}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </Modal>
  );
}
