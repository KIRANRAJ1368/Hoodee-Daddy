import { useEffect, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Eye, Filter } from "lucide-react";
import { subcategoriesApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import PaginatedDataTable from "../../components/PaginatedDataTable/PaginatedDataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import SubcategoryFormModal from "./SubcategoryFormModal";
import SubcategoryViewModal from "../../components/EntityViewModal/SubcategoryViewModal";
import ImageLightboxModal from "../../components/ImageLightboxModal/ImageLightboxModal";
import { resolveImageUrl } from "../../utils/imageUrl";
import { broadcastCatalogUpdate } from "../../utils/broadcastCatalogUpdate";

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  async function loadCategories() {
    try {
      const { data } = await categoriesApi.list();
      setCategories(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load categories for subcategories");
    }
  }

  async function load() {
    setIsLoading(true);
    try {
      const { data } = await subcategoriesApi.list(categoryFilter ? { category: categoryFilter } : {});
      setSubcategories(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load subcategories");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const sortedSubcategories = useMemo(() => {
    return [...subcategories].sort((a, b) => {
      const seqA = Number(a.sort_order ?? 0);
      const seqB = Number(b.sort_order ?? 0);
      if (seqA !== seqB) return seqA - seqB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, [subcategories]);

  async function handleDelete(subcategory) {
    const ok = await confirm({
      title: "Delete Subcategory?",
      message: `"${subcategory.name}" will be removed. Ensure no products are currently assigned to this category.`
    });
    if (!ok) return;
    try {
      await subcategoriesApi.remove(subcategory.id);
      broadcastCatalogUpdate({ action: "SUBCATEGORY_DELETED", subcategoryId: subcategory.id, slug: subcategory.slug });
      toast.delete(`Subcategory "${subcategory.name}" has been deleted successfully.`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete subcategory");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Subcategories & Item Groups</span>
            <span className="pill-badge badge-gold">
              {subcategories.length} Group{subcategories.length === 1 ? "" : "s"}
            </span>
          </h1>
          <p className="page-subtitle">
            Manage product classifications within each category (e.g. Hoodies, T-Shirts, Bottoms, Jackets).
          </p>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => setEditing({})}
          disabled={categories.length === 0}
        >
          <Plus size={17} />
          <span>Add Subcategory</span>
        </button>
      </div>

      <div className="card">
        {/* Filter Toolbar */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            background: "var(--surface)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", maxWidth: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Filter size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)", whiteSpace: "nowrap" }}>Filter by Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                minWidth: 150,
                maxWidth: "100%",
                flex: "1 1 160px",
                padding: "8px 12px",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface)",
                fontSize: "13px",
                fontWeight: 500
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <span className="hint">
            Showing {subcategories.length} subcategor{subcategories.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <PaginatedDataTable
          isLoading={isLoading}
          rows={sortedSubcategories}
          rowKey={(row) => row.id}
          emptyTitle="No subcategories found"
          emptyDescription={
            categories.length === 0
              ? "Create a category first before adding subcategories."
              : "Add a subcategory to organize products in this category."
          }
          emptyAction={
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => setEditing({})}
              disabled={categories.length === 0}
            >
              <Plus size={16} />
              <span>Add Subcategory</span>
            </button>
          }
          columns={[
            {
              key: "image_url",
              label: "Image",
              width: "75px",
              align: "center",
              render: (row) => {
                const img = row.image_url && typeof row.image_url === "string" && row.image_url.trim();
                if (!img) {
                  return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
                }
                return (
                  <img
                    src={resolveImageUrl(img)}
                    alt={row.name}
                    className="cell-thumb"
                    style={{ width: 44, height: 54, borderRadius: 8, objectFit: "cover", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImg(resolveImageUrl(img));
                    }}
                    title="Click to inspect image in Full HD"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                );
              }
            },
            {
              key: "name",
              label: "Subcategory Name",
              align: "left",
              render: (row) => <span className="cell-title">{row.name}</span>
            },
            {
              key: "category",
              label: "Parent Category",
              width: "140px",
              align: "center",
              render: (row) => (
                <span className="pill-badge badge-gold">
                  {row.category?.name || "Unassigned"}
                </span>
              )
            },
            {
              key: "slug",
              label: "URL Slug",
              align: "left",
              render: (row) => <code>{row.slug}</code>
            },
            {
              key: "sort_order",
              label: "Sequence",
              width: "90px",
              align: "center",
              render: (row) => <strong>{row.sort_order}</strong>
            },
            {
              key: "is_active",
              label: "Filter Pill Status",
              width: "150px",
              align: "center",
              render: (row) => <StatusBadge value={row.is_active ? "active" : "inactive"} />
            },
            {
              key: "show_on_homepage",
              label: "Homepage",
              width: "130px",
              align: "center",
              render: (row) =>
                row.show_on_homepage === false ? (
                  <StatusBadge value="inactive" label="Hidden" />
                ) : (
                  <StatusBadge value="active" label="On Homepage" />
                )
            },
            {
              key: "actions",
              label: "Actions",
              width: "220px",
              align: "right",
              render: (row) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setViewing(row)}
                    title="View subcategory details"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditing(row)}
                    title="Edit subcategory"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(row)}
                    title="Delete subcategory"
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
        <SubcategoryFormModal
          subcategory={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {viewing && (
        <SubcategoryViewModal
          subcategory={viewing}
          onEdit={(sub) => setEditing(sub)}
          onClose={() => setViewing(null)}
        />
      )}
      {lightboxImg && (
        <ImageLightboxModal
          src={lightboxImg}
          alt="Subcategory Preview"
          onClose={() => setLightboxImg(null)}
        />
      )}
      <ConfirmModal />
    </div>
  );
}
