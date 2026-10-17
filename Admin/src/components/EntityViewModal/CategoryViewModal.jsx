import { FolderTree, Hash, Layers, Eye } from "lucide-react";
import Modal from "../Modal/Modal";
import StatusBadge from "../StatusBadge/StatusBadge";
import "./EntityViewModal.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

export default function CategoryViewModal({ category, onEdit, onClose }) {
  const data = category || null;

  if (!data) {
    return (
      <Modal title="Category Details" onClose={onClose} width={560}>
        <div className="ev-error">
          <p>Category not found.</p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const subcategories = data.subcategories || [];

  return (
    <Modal title="Category Overview" onClose={onClose} width={620}>
      <div className="ev">
        {/* Header Banner */}
        <div className="ev-header">
          <div className="ev-heading">
            <div className="ev-title-row">
              <h2 className="ev-name">{data.name}</h2>
              <span className="pill-badge badge-gold">Primary Department</span>
            </div>
            <div className="ev-meta-line">
              <code>/{data.slug || "—"}</code>
              <span className="ev-sep">•</span>
              <span>
                {subcategories.length} item group{subcategories.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="ev-status-col">
            <StatusBadge value={data.is_active ? "active" : "inactive"} />
          </div>
        </div>

        {/* Specifications & Overview */}
        <div className="ev-details" style={{ width: "100%" }}>
          <div className="ev-section-label">Storefront Specifications</div>

          <div className="ev-stat-grid">
            <div className="ev-stat-card">
              <span className="ev-stat-label">Navigation Slug</span>
              <span className="ev-stat-value">
                <code>/{data.slug || "—"}</code>
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
              <span className="ev-stat-label">Subcategories</span>
              <span className="ev-stat-value">
                <Layers size={14} style={{ color: "var(--indigo)" }} />
                <span>{subcategories.length} Classified Groups</span>
              </span>
            </div>

            <div className="ev-stat-card">
              <span className="ev-stat-label">Catalog Status</span>
              <span className="ev-stat-value">
                <Eye size={14} style={{ color: data.is_active ? "#059669" : "#94a3b8" }} />
                <span>{data.is_active ? "Live on Store" : "Hidden"}</span>
              </span>
            </div>

            <div className="ev-stat-card">
              <span className="ev-stat-label">Show on Homepage</span>
              <span className="ev-stat-value">
                <Eye size={14} style={{ color: data.show_on_homepage !== false ? "#059669" : "#94a3b8" }} />
                <span>{data.show_on_homepage !== false ? "Visible on Homepage" : "Hidden from Homepage"}</span>
              </span>
            </div>
          </div>

          {(data.banner_image_url || data.banner_title) && (
            <div style={{ marginTop: 14 }}>
              <div className="ev-section-label">Collection Page Hero Banner</div>
              <div
                style={{
                  background: "#0F172A",
                  borderRadius: 10,
                  overflow: "hidden",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative"
                }}
              >
                {data.banner_image_url && (
                  <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                    <img
                      src={data.banner_image_url}
                      alt={data.banner_title || data.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: data.banner_image_position || "center center"
                      }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to right, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.6) 60%, transparent 100%)"
                      }}
                    />
                  </div>
                )}
                <div style={{ padding: "14px 18px", position: "relative", zIndex: 1 }}>
                  {data.banner_tag && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#FAA703", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      {data.banner_tag}
                    </div>
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "0.02em" }}>
                    {data.banner_title || `${data.name.toUpperCase()} COLLECTION`}
                  </h3>
                  {data.banner_subtitle && (
                    <p style={{ fontSize: 12.5, color: "#94A3B8", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                      {data.banner_subtitle}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {data.banner_badge_promo && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#FAA703", color: "#0F172A", padding: "3px 8px", borderRadius: 4 }}>
                        {data.banner_badge_promo}
                      </span>
                    )}
                    {data.banner_primary_cta_text && (
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "3px 10px", borderRadius: 4 }}>
                        {data.banner_primary_cta_text} →
                      </span>
                    )}
                    {data.banner_secondary_cta_text && (
                      <span style={{ fontSize: 11, color: "#CBD5E1" }}>
                        {data.banner_secondary_cta_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.description && (
            <div>
              <div className="ev-section-label">Department Overview</div>
              <div className="ev-desc-card">
                <p>{data.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Subcategories Chips */}
        {subcategories.length > 0 && (
          <div>
            <div className="ev-section-label">
              <FolderTree size={13} />
              <span>Assigned Subcategories & Item Groups</span>
              <span className="ev-section-count">({subcategories.length})</span>
            </div>
            <div className="ev-chip-row">
              {subcategories.map((s) => (
                <span className="ev-chip" key={s.id || s.slug}>
                  <span className="ev-chip-dot" />
                  <span>{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Meta & Actions */}
        <div className="ev-footer">
          <div className="ev-footer-meta">
            <span>
              Category ID: <strong>{data.id}</strong>
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
                Edit Category
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
