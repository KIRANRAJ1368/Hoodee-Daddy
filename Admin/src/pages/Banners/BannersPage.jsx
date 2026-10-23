import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Eye, Image as ImageIcon, Sparkles, Layout, ExternalLink } from "lucide-react";
import { bannersApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import PaginatedDataTable from "../../components/PaginatedDataTable/PaginatedDataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import BannerFormModal from "./BannerFormModal";
import BannerViewModal from "../../components/EntityViewModal/BannerViewModal";
import ImageLightboxModal from "../../components/ImageLightboxModal/ImageLightboxModal";
import { resolveImageUrl } from "../../utils/imageUrl";

export default function BannersPage({ offerOnly = false }) {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeTab, setActiveTab] = useState("hero"); // 'hero'
  const [isCompact, setIsCompact] = useState(true);
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  async function load() {
    setIsLoading(true);
    try {
      const [bannersRes, catsRes] = await Promise.allSettled([
        bannersApi.list(),
        categoriesApi.list({ includeInactive: "false" })
      ]);
      if (bannersRes.status === "fulfilled") {
        setBanners((bannersRes.value.data || []).map((banner) =>
          banner.placement === "home_hero" ? { ...banner, placement: "hero" } : banner
        ));
      }
      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value.data)) {
        setCategories(catsRes.value.data);
      }
      const failures = [bannersRes, catsRes].filter((result) => result.status === "rejected");
      if (failures.length) {
        toast.error(failures.map((result) => result.reason?.message).filter(Boolean).join("; ") || "Failed to load banners and categories");
      }
    } catch (err) {
      toast.error(err.message || "Failed to load banners and categories");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(banner) {
    const ok = await confirm({
      title: "Delete Promotional Banner?",
      message: `The banner "${banner.title}" will be permanently removed from storefront carousels.`
    });
    if (!ok) return;
    try {
      await bannersApi.remove(banner.id);
      toast.delete(`Banner "${banner.title}" has been deleted successfully.`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete banner");
    }
  }

  const filteredBanners = useMemo(() => {
    if (offerOnly) return banners.filter((b) => b.placement === "offers");
    return banners.filter((b) => b.placement === "hero");
  }, [banners, offerOnly]);

  const heroCount = banners.filter((b) => b.placement === "hero").length;
  const offerCount = banners.filter((b) => b.placement === "offers").length;

  function handleAddBanner() {
    if (!offerOnly && heroCount >= 3) {
      toast.error("Maximum 3 Hero Banners can be added.");
      return;
    }
    if (offerOnly && offerCount >= 10) {
      toast.error("Maximum 10 offer banners can be added.");
      return;
    }
    setEditing({
      placement: offerOnly ? "offers" : "hero"
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>{offerOnly ? "Offer Banners" : "Hero Banners"}</span>
            <span className="pill-badge badge-gold">{offerOnly ? `${offerCount}/10` : `${heroCount}/3`} Banner{offerOnly ? (offerCount === 1 ? "" : "s") : (heroCount === 1 ? "" : "s")}</span>
          </h1>
          <p className="page-subtitle">
            {offerOnly
              ? "Create and manage up to 10 storefront offer banners."
              : "Configure storefront homepage hero slider carousels (max 3). Collection banners are managed in Categories."}
          </p>
        </div>
        <button type="button" className="btn btn-accent btn-lg" onClick={handleAddBanner}>
          <Plus size={17} />
          <span>Add New {offerOnly ? "Offer Banner" : "Hero Banner"}</span>
        </button>
      </div>

      <div className="card">
        {/* Navigation Tabs & View Mode Switch */}
        {!offerOnly && <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            borderTopLeftRadius: "inherit",
            borderTopRightRadius: "inherit",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              className="btn btn-sm btn-accent"
              style={{ cursor: "default" }}
            >
              <Sparkles size={14} />
              <span>Hero Slider ({heroCount}/3)</span>
            </span>

            <Link
              to="/categories"
              className="btn btn-sm btn-secondary"
              title="Collection page banners are configured directly within each Category"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", whiteSpace: "normal", textAlign: "left", maxWidth: "100%" }}
            >
              <Layout size={14} style={{ flexShrink: 0 }} />
              <span>Category Collection Banners &rarr; Go to Categories</span>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsCompact(!isCompact)}
              title={isCompact ? "Switch to detailed multiline view" : "Switch to compact view"}
              style={{ fontSize: 12, padding: "5px 12px" }}
            >
              <span>{isCompact ? "Compact Mode: ON" : "Detailed Mode"}</span>
            </button>
          </div>
        </div>}

        <PaginatedDataTable
          isLoading={isLoading}
          rows={filteredBanners}
          sortNewestFirst
          rowKey={(row) => row.id}
          emptyTitle="No banners match this filter"
          emptyDescription="Create high-res hero banners or collection covers to attract customers."
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={handleAddBanner}>
              <Plus size={16} />
              <span>Create Banner</span>
            </button>
          }
          columns={[
            {
              key: "image_url",
              label: "Banner Preview",
              width: "115px",
              align: "center",
              render: (row) =>
                row.image_url ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImg(resolveImageUrl(row.image_url));
                    }}
                    role="button"
                    tabIndex={0}
                    title="Click to view full resolution banner"
                    style={{
                      position: "relative",
                      width: 96,
                      height: 42,
                      overflow: "hidden",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--surface-alt)",
                      cursor: "pointer"
                    }}
                  >
                    <img
                      src={resolveImageUrl(row.image_url)}
                      alt={row.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: row.image_position || "85% top"
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 96,
                      height: 42,
                      borderRadius: 6,
                      background: "var(--surface-alt)",
                      border: "1px dashed var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-subtle)"
                    }}
                  >
                    <ImageIcon size={16} />
                  </div>
                )
            },
            {
              key: "title",
              label: "Title & Copy",
              width: "280px",
              render: (row) =>
                isCompact ? (
                  <div
                    style={{ maxWidth: 280 }}
                    title={`${row.title}\n${row.subtitle || ""}\n${row.tag || ""}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      {row.tag && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#4f46e5",
                            background: "#eef2ff",
                            padding: "1px 6px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {row.tag}
                        </span>
                      )}
                      {row.badge_promo && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#059669",
                            background: "#ecfdf5",
                            padding: "1px 6px",
                            borderRadius: 4,
                            whiteSpace: "nowrap"
                          }}
                        >
                          {row.badge_promo}
                        </span>
                      )}
                    </div>
                    <div
                      className="cell-title"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {row.title}
                    </div>
                    {row.subtitle && (
                      <div
                        className="cell-muted"
                        style={{
                          fontSize: 11.5,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: 2
                        }}
                      >
                        {row.subtitle}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ maxWidth: 320 }}>
                    {row.tag && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#4f46e5",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: 2
                        }}
                      >
                        {row.tag}
                      </div>
                    )}
                    <div className="cell-title">{row.title}</div>
                    {row.subtitle && (
                      <div className="cell-muted" style={{ fontSize: 12 }}>
                        {row.subtitle}
                      </div>
                    )}
                    {row.badge_promo && (
                      <div style={{ marginTop: 4 }}>
                        <span className="pill-badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontSize: 10 }}>
                          {row.badge_promo}
                        </span>
                      </div>
                    )}
                  </div>
                )
            },
            {
              key: "placement",
              label: "Target Placement",
              width: "135px",
              align: "center",
              render: (row) => {
                if (row.placement === "hero") {
                  return (
                    <span
                      className="pill-badge"
                      style={{
                        background: "#eef2ff",
                        color: "#4f46e5",
                        border: "1px solid #c7d2fe",
                        fontSize: 11,
                        whiteSpace: "nowrap"
                      }}
                    >
                      <Sparkles size={11} />
                      <span>Hero Slider</span>
                    </span>
                  );
                }
                const matchedCat = categories.find((c) => c.slug === row.placement);
                const label = matchedCat
                  ? `${matchedCat.name} Header`
                  : row.placement === "offers"
                  ? "Offer Banner"
                  : row.placement === "best-sellers"
                  ? "Best Sellers"
                  : row.placement === "new-arrivals"
                  ? "New Arrivals"
                  : row.placement === "default"
                  ? "Default Fallback"
                  : row.placement;

                return (
                  <span
                    className="pill-badge"
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      fontSize: 11,
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span>{label}</span>
                  </span>
                );
              }
            },
            {
              key: "sort_order",
              label: "Sequence",
              width: "80px",
              align: "center",
              render: (row) => <strong style={{ color: "#475569" }}>{row.sort_order}</strong>
            },
            {
              key: "is_active",
              label: "Status",
              width: "100px",
              align: "center",
              render: (row) => <StatusBadge value={row.is_active ? "active" : "inactive"} />
            },
            {
              key: "actions",
              label: "Actions",
              width: "190px",
              align: "right",
              render: (row) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setViewing(row)}
                    title="View banner details"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditing(row)}
                    title="Edit banner"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(row)}
                    title="Delete banner"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>

      {editing && (
        <BannerFormModal
          banner={editing}
          heroCount={heroCount}
          offerCount={offerCount}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {viewing && (
        <BannerViewModal
          banner={viewing}
          onEdit={(b) => {
            setViewing(null);
            setEditing(b);
          }}
          onClose={() => setViewing(null)}
        />
      )}
      {lightboxImg && (
        <ImageLightboxModal
          src={lightboxImg}
          alt="Banner Preview"
          onClose={() => setLightboxImg(null)}
        />
      )}
      <ConfirmModal />
    </div>
  );
}
