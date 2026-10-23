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

          {data.banner_image_url && (
            <div style={{ marginTop: 14 }}>
              <div className="ev-section-label">Collection Page Hero Banner (Original Quality)</div>
              <div
                style={{
                  background: "#0F172A",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--border, #e2e8f0)",
                  position: "relative"
                }}
              >
                <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                  <img
                    src={data.banner_image_url}
                    alt={data.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center center",
                      filter: "none"
                    }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
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
