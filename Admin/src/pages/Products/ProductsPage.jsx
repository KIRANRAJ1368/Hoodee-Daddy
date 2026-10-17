import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Image as ImageIcon,
  RotateCcw,
  Search,
  Tag,
  Boxes
} from "lucide-react";
import { productsApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import DataTable from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import Pagination from "../../components/Pagination/Pagination";
import EmptyState from "../../components/EmptyState/EmptyState";
import LoadingState from "../../components/LoadingState/LoadingState";
import ProductViewModal from "../../components/ProductViewModal/ProductViewModal";
import ImageLightboxModal from "../../components/ImageLightboxModal/ImageLightboxModal";
import { resolveImageUrl } from "../../utils/imageUrl";
import { formatINR } from "../../utils/formatPrice";
import "./ProductsPage.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: "", availability: "", sort: "newest" });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();
  const navigate = useNavigate();

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data || []));
  }, []);

  function broadcastCatalogUpdate() {
    try {
      const channel = new BroadcastChannel("zmw_catalog_channel");
      channel.postMessage({ type: "CATALOG_UPDATED", timestamp: Date.now() });
      channel.close();
    } catch {}
    try {
      localStorage.setItem("zmw_catalog_updated_at", String(Date.now()));
    } catch {}
  }

  async function load() {
    setIsLoading(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      if (debouncedSearch) {
        cleaned.search = debouncedSearch;
      }
      const { data, meta } = await productsApi.list({ ...cleaned, page, limit: 10 });
      setProducts(data || []);
      setMeta(meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, debouncedSearch]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function resetFilters() {
    setPage(1);
    setFilters({ category: "", availability: "", sort: "newest" });
    setSearchQuery("");
  }

  async function toggleFlag(product, flagName, apiFn) {
    try {
      await apiFn(product.id, !product[flagName]);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, [flagName]: !p[flagName] } : p))
      );
      toast.success(
        `${product.name} ${flagName === "isBestSeller" ? "best seller" : "new arrival"} updated`
      );
      broadcastCatalogUpdate();
    } catch (err) {
      toast.error(err.message || "Failed to update product status");
    }
  }

  async function handleDelete(product) {
    const ok = await confirm({
      title: "Delete Product from Store?",
      message: `"${product.name}" (SKU: ${product.sku}) and all associated variants will be permanently removed.`
    });
    if (!ok) return;
    try {
      await productsApi.remove(product.id);
      toast.delete(`Product "${product.name}" has been deleted successfully.`);
      broadcastCatalogUpdate();
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  }

  const displayedProducts = products;

  const hasActiveFilters = filters.category || filters.availability || filters.sort !== "newest" || searchQuery;

  return (
    <div className="products-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Products</span>
            <span className="pill-badge badge-gold">{meta.total} Item{meta.total === 1 ? "" : "s"}</span>
          </h1>
          <p className="page-subtitle">
            Manage your store product catalog, upload photos, configure pricing, and control inventory.
          </p>
        </div>
        <div className="page-header-actions">
          {/* <Link
            to="/inventory"
            className="btn btn-secondary btn-lg"
            style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <Boxes size={17} />
            <span>Stock &amp; Variants Hub</span>
          </Link> */}
          <button type="button" className="btn btn-accent btn-lg" onClick={() => navigate("/products/new")}>
            <Plus size={17} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="card products-toolbar-card">
        <div className="products-toolbar">
          <div className="toolbar-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, SKU, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="toolbar-filters">
            <div className="filter-select-wrap">
              <Filter size={14} className="filter-select-icon" />
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrap">
              <select
                value={filters.availability}
                onChange={(e) => updateFilter("availability", e.target.value)}
                aria-label="Filter by stock"
              >
                <option value="">All Stock Statuses</option>
                <option value="in-stock">In Stock Only</option>
                <option value="low-stock">Low Stock (≤ 5 units)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div className="filter-select-wrap filter-sort-wrap">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter("sort", e.target.value)}
                aria-label="Sort products"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
                <option value="rating">Sort: Top Customer Rated</option>
                <option value="popularity">Sort: Most Popular</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm reset-btn"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Rendering: Clean Table View Only (Visual Grid Removed) */}
      {isLoading ? (
        <LoadingState label="Loading products..." />
      ) : displayedProducts.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No products found"
            description="No products matched your current filter criteria. Try clearing filters or add a new piece to your collection."
            action={
              <button type="button" className="btn btn-accent" onClick={() => navigate("/products/new")}>
                <Plus size={16} />
                <span>Add First Product</span>
              </button>
            }
          />
        </div>
      ) : (
        /* ── Modern Table View Matching Reference Design ── */
        <div className="card products-table-card">
          <div className="table-top-bar">
            <span>
              Showing <strong>{displayedProducts.length}</strong> of <strong>{meta.total}</strong> total products
            </span>
          </div>

          <DataTable
            isLoading={false}
            rows={displayedProducts}
            rowKey={(row) => row.id}
            columns={[
              {
                key: "sno",
                label: "S.No",
                width: "55px",
                align: "center",
                render: (_row, idx) => (
                  <span className="table-sno-badge">{(page - 1) * 15 + idx + 1}</span>
                )
              },
              {
                key: "image",
                label: "Image",
                width: "65px",
                align: "center",
                render: (row) => (
                  <div
                    className="product-thumb-wrap"
                    onClick={(e) => {
                      if (row.images?.[0]) {
                        e.stopPropagation();
                        setLightboxImg(resolveImageUrl(row.images[0]));
                      }
                    }}
                    role={row.images?.[0] ? "button" : undefined}
                    tabIndex={row.images?.[0] ? 0 : undefined}
                    title={row.images?.[0] ? "Click to view larger image" : undefined}
                    style={row.images?.[0] ? { cursor: "pointer" } : undefined}
                  >
                    {row.images?.[0] ? (
                      <img
                        src={resolveImageUrl(row.images[0])}
                        alt={row.name}
                        className="product-thumb-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.classList.add("img-fallback-active");
                        }}
                      />
                    ) : null}
                    <div className="product-thumb-empty">
                      <ImageIcon size={18} />
                    </div>
                    {row.images?.length > 1 && (
                      <span className="product-thumb-count">
                        +{row.images.length - 1}
                      </span>
                    )}
                  </div>
                )
              },
              {
                key: "name",
                label: "Product Name",
                width: "220px",
                render: (row) => (
                  <div className="product-details">
                    <span className="cell-title">{row.name}</span>
                    <div className="product-meta-row">
                      <code className="product-sku-badge">{row.sku}</code>
                      {row.productType && (
                        <span className="product-type-badge">
                          {row.productType}
                        </span>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: "category",
                label: "Category",
                width: "150px",
                render: (row) => (
                  <div className="category-cell">
                    <span className="category-tag-ref">
                      <Tag size={11} />
                      <span>{row.category || "—"}</span>
                    </span>
                    {row.subCategory && (
                      <span className="subcategory-tag-ref">{row.subCategory}</span>
                    )}
                  </div>
                )
              },
              {
                key: "price",
                label: "Price",
                width: "90px",
                render: (row) => (
                  <div className="price-cell">
                    <span className="price-current">{formatINR(row.price)}</span>
                    {row.originalPrice && row.originalPrice > row.price && (
                      <span className="price-original">{formatINR(row.originalPrice)}</span>
                    )}
                  </div>
                )
              },
              {
                key: "stockCount",
                label: "Stock & Status",
                width: "145px",
                render: (row) => {
                  const stock = Number(row.stockCount ?? 0);
                  const isOut = !row.inStock || stock === 0;
                  const isLow = !isOut && stock <= 5;
                  return (
                    <span
                      className={`pill-badge ${isOut ? "badge-red" : isLow ? "badge-gold" : "badge-green"}`}
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 9px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: isOut ? "#ef4444" : isLow ? "#f59e0b" : "#10b981",
                          flexShrink: 0
                        }}
                      />
                      <span>
                        {isOut ? "Out of Stock" : isLow ? `Low Stock (${stock})` : `In Stock (${stock})`}
                      </span>
                    </span>
                  );
                }
              },
              {
                key: "isBestSeller",
                label: "Best Seller",
                width: "100px",
                align: "center",
                render: (row) => (
                  <label className="toggle-ref" title="Toggle Best Seller">
                    <input
                      type="checkbox"
                      checked={row.isBestSeller}
                      onChange={() => toggleFlag(row, "isBestSeller", productsApi.toggleBestSeller)}
                    />
                    <span className="toggle-track">
                      <span className="toggle-handle" />
                      <span className="toggle-text">{row.isBestSeller ? "ON" : "OFF"}</span>
                    </span>
                  </label>
                )
              },
              {
                key: "isNewArrival",
                label: "New Drop",
                width: "100px",
                align: "center",
                render: (row) => (
                  <label className="toggle-ref" title="Toggle New Drop">
                    <input
                      type="checkbox"
                      checked={row.isNewArrival}
                      onChange={() => toggleFlag(row, "isNewArrival", productsApi.toggleNewArrival)}
                    />
                    <span className="toggle-track">
                      <span className="toggle-handle" />
                      <span className="toggle-text">{row.isNewArrival ? "ON" : "OFF"}</span>
                    </span>
                  </label>
                )
              },
              {
                key: "actions",
                label: "Actions",
                width: "210px",
                align: "right",
                render: (row) => (
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewing(row)}
                      title="View product details"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                    <Link
                      to={`/products/${row.id}/edit`}
                      className="btn btn-secondary btn-sm"
                      title="Edit Product"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </Link>
                    {/* <Link
                      to={`/inventory?productId=${row.id}`}
                      className="btn btn-secondary btn-sm"
                      title="Manage Sizes, Colors & Stock Variants"
                    >
                      <Boxes size={13} />
                      <span>Stock</span>
                    </Link> */}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(row)}
                      title="Delete Product"
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
      )}

      {/* Pagination Container */}
      <div className="card products-pagination-card">
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </div>

      <ConfirmModal />

      {viewing && (
        <ProductViewModal product={viewing} onClose={() => setViewing(null)} />
      )}

      {lightboxImg && (
        <ImageLightboxModal
          src={lightboxImg}
          alt="Product Preview"
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
}
