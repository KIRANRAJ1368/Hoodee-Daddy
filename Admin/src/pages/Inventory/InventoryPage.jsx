import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Boxes,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Check,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Edit,
  X
} from "lucide-react";
import { productsApi, categoriesApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { resolveImageUrl } from "../../utils/imageUrl";
import LoadingState from "../../components/LoadingState/LoadingState";
import Pagination from "../../components/Pagination/Pagination";
import { sortNewestFirst } from "../../utils/sortNewestFirst";
import "./InventoryPage.css";

const PRODUCTS_PER_PAGE = 10;

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const highlightProductId = searchParams.get("productId");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [savingProductId, setSavingProductId] = useState(null);
  const [editingProductModal, setEditingProductModal] = useState(null);

  const toast = useToast();

  async function loadData() {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({ limit: 150 }),
        categoriesApi.list()
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Compute Overall Inventory KPI Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalVariants = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      totalUnits += p.stockCount || 0;
      if (p.variants && p.variants.length > 0) {
        totalVariants += p.variants.length;
        p.variants.forEach((v) => {
          const qty = Number(v.stockCount ?? v.stock_count ?? 0);
          if (qty <= 0) outOfStockCount++;
          else if (qty <= 5) lowStockCount++;
          else inStockCount++;
        });
      } else {
        totalVariants += 1;
        const qty = p.stockCount || 0;
        if (qty <= 0) outOfStockCount++;
        else if (qty <= 5) lowStockCount++;
        else inStockCount++;
      }
    });

    return { totalUnits, totalVariants, inStockCount, lowStockCount, outOfStockCount };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchVariant = p.variants?.some(
          (v) =>
            v.size?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q)
        );
        if (!matchName && !matchSku && !matchVariant) return false;
      }

      // Category
      if (selectedCategory !== "all") {
        const catSlug = p.category?.toLowerCase();
        if (catSlug !== selectedCategory.toLowerCase()) return false;
      }

      // Status
      if (selectedStatus === "in_stock") {
        if (p.variants?.length > 0) {
          if (!p.variants.some((v) => (v.stockCount ?? v.stock_count ?? 0) > 5)) return false;
        } else if ((p.stockCount || 0) <= 5) return false;
      } else if (selectedStatus === "low_stock") {
        if (p.variants?.length > 0) {
          if (!p.variants.some((v) => {
            const count = v.stockCount ?? v.stock_count ?? 0;
            return count > 0 && count <= 5;
          })) return false;
        } else if ((p.stockCount || 0) <= 0 || (p.stockCount || 0) > 5) return false;
      } else if (selectedStatus === "out_of_stock") {
        if (p.variants?.length > 0) {
          if (!p.variants.some((v) => (v.stockCount ?? v.stock_count ?? 0) === 0)) return false;
        } else if ((p.stockCount || 0) > 0) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE),
    [filteredProducts, currentPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!highlightProductId) return;
    const index = filteredProducts.findIndex((product) => String(product.id) === String(highlightProductId));
    if (index >= 0) setCurrentPage(Math.floor(index / PRODUCTS_PER_PAGE) + 1);
  }, [highlightProductId, filteredProducts]);

  // Quick variant stock adjuster
  async function handleQuickStockChange(product, variantIdx, nextStock, nextSales = null, shouldPersist = true) {
    const validStock = Math.max(0, parseInt(nextStock, 10) || 0);
    const updatedVariants = product.variants.map((v, i) =>
      i === variantIdx ? {
        ...v,
        stock_count: validStock,
        stockCount: validStock,
        sales_count: nextSales === null ? Number(v.salesCount ?? v.sales_count ?? 0) : Math.max(0, parseInt(nextSales, 10) || 0),
        salesCount: nextSales === null ? Number(v.salesCount ?? v.sales_count ?? 0) : Math.max(0, parseInt(nextSales, 10) || 0)
      } : v
    );

    // Optimistically update UI
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== product.id) return p;
        const totalStock = updatedVariants.reduce((sum, v) => sum + (v.stockCount || 0), 0);
        return {
          ...p,
          variants: updatedVariants,
          stockCount: totalStock,
          salesCount: updatedVariants.reduce((sum, v) => sum + Number(v.salesCount ?? v.sales_count ?? 0), 0),
          inStock: totalStock > 0
        };
      })
    );

    if (!shouldPersist) return;

    try {
      await productsApi.saveVariants(
        product.id,
        updatedVariants.map((v) => ({
          size: v.size,
          color: v.color,
          stock_count: v.stockCount,
          sales_count: v.salesCount ?? v.sales_count ?? 0,
          sku_suffix: v.skuSuffix,
          price_override: v.priceOverride,
          original_price_override: v.originalPriceOverride ?? v.original_price_override,
          created_at: v.createdAt || v.created_at || undefined
        }))
      );
    } catch (err) {
      toast.error(err.message || "Failed to update stock");
      loadData(); // rollback on error
    }
  }

  // Quick single product stock adjuster (for products without variants)
  async function handleSingleProductStock(product, nextStock, nextSales = product.salesCount ?? 0, shouldPersist = true) {
    const validStock = Math.max(0, parseInt(nextStock, 10) || 0);
    const validSales = Math.max(0, parseInt(nextSales, 10) || 0);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stockCount: validStock, salesCount: validSales, inStock: validStock > 0 } : p
      )
    );

    if (!shouldPersist) return;

    try {
      await productsApi.updateStock(product.id, {
        stock_count: validStock,
        sales_count: validSales,
        in_stock: validStock > 0
      });
    } catch (err) {
      toast.error(err.message || "Failed to update stock");
      loadData();
    }
  }

  async function handleSaveVariantsModal(productId, variants) {
    setSavingProductId(productId);
    try {
      const res = await productsApi.saveVariants(productId, variants);
      const updatedProduct = res.data;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updatedProduct } : p))
      );
      toast.success("Variants and stock saved successfully");
      setEditingProductModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to save variants");
    } finally {
      setSavingProductId(null);
    }
  }

  if (isLoading) return <LoadingState label="Loading Stock & Variants Hub..." />;

  return (
    <div className="inventory-hub-page">
      {/* Page Header */}
      <div className="inventory-header">
        <div>
          <div className="inventory-eyebrow">
            <Boxes size={14} />
            <span>Storefront Inventory Operations</span>
          </div>
          <h1 className="page-title">Stock & Variants Hub</h1>
          <p className="page-subtitle">
            Manage inventory levels, size availability, color swatches, and multi-SKU variant matrices across your catalog.
          </p>
        </div>

        <div className="inventory-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} />
            <span>Refresh Inventory</span>
          </button>
        </div>
      </div>

      {/* Luxury Metric Cards */}
      <div className="inventory-kpi-grid">
        <div className="inventory-kpi-card">
          <div className="kpi-icon-box kpi-blue">
            <Package size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Store Stock</span>
            <h3 className="kpi-value">{metrics.totalUnits.toLocaleString()} units</h3>
            <span className="kpi-sub">Across {products.length} catalog products</span>
          </div>
        </div>

        <div
          className={`inventory-kpi-card ${selectedStatus === "in_stock" ? "kpi-selected" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "in_stock" ? "all" : "in_stock")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-green">
            <CheckCircle2 size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">In Stock SKUs</span>
            <h3 className="kpi-value" style={{ color: "#059669" }}>
              {metrics.inStockCount}
            </h3>
            <span className="kpi-sub">&gt; 5 units available (Ready to ship)</span>
          </div>
        </div>

        <div
          className={`inventory-kpi-card ${selectedStatus === "low_stock" ? "kpi-selected" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "low_stock" ? "all" : "low_stock")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-amber">
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Low Stock Alerts</span>
            <h3 className="kpi-value" style={{ color: "#d97706" }}>
              {metrics.lowStockCount}
            </h3>
            <span className="kpi-sub">1 to 5 units left (Restock soon)</span>
          </div>
        </div>

        <div
          className={`inventory-kpi-card ${selectedStatus === "out_of_stock" ? "kpi-selected" : ""}`}
          onClick={() => setSelectedStatus(selectedStatus === "out_of_stock" ? "all" : "out_of_stock")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-red">
            <XCircle size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Sold Out / Zero Stock</span>
            <h3 className="kpi-value" style={{ color: "#dc2626" }}>
              {metrics.outOfStockCount}
            </h3>
            <span className="kpi-sub">0 units available (Purchases blocked)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="inventory-filters-card card">
        <div className="inventory-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU code, or variant size/color..."
            className="inventory-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="inventory-filter-group">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Departments</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">🟢 In Stock (&gt; 5)</option>
            <option value="low_stock">🟡 Low Stock (1–5)</option>
            <option value="out_of_stock">🔴 Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products & Variants List */}
      <div className="inventory-products-list">
        {filteredProducts.length > 0 ? (
          paginatedProducts.map((product) => {
            const hasVariants = product.variants && product.variants.length > 0;
            const isHighlighted = String(product.id) === String(highlightProductId);

            return (
              <div
                key={product.id}
                id={`product-inv-${product.id}`}
                className={`product-inventory-card card ${isHighlighted ? "is-highlighted" : ""}`}
              >
                {/* Product Header Row */}
                <div className="prod-inv-header">
                  <div className="prod-inv-info">
                    <img
                      src={resolveImageUrl(product.image || product.images?.[0])}
                      alt={product.name}
                      className="prod-inv-thumb"
                    />
                    <div>
                      <div className="prod-inv-title-row">
                        <h3 className="prod-inv-name">{product.name}</h3>
                        <span className="prod-inv-cat-pill">
                          {product.category || "Apparel"}
                        </span>
                      </div>
                      <div className="prod-inv-sku-row">
                        <span>SKU: <strong>{product.sku}</strong></span>
                        <span className="sku-divider">•</span>
                        <span>Price: <strong>₹{product.price}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="prod-inv-actions-right">
                    <div className="prod-inv-stock-summary">
                      <span className="inv-summary-label">Total Stock:</span>
                      <span className="inv-summary-units">
                        {product.stockCount || 0} units
                      </span>
                      <span
                        className={`inv-status-pill ${
                          product.stockStatus === "out_of_stock"
                            ? "pill-out"
                            : product.stockStatus === "low_stock"
                            ? "pill-low"
                            : "pill-in"
                        }`}
                      >
                        {product.stockStatus === "out_of_stock"
                          ? "Out of Stock"
                          : product.stockStatus === "low_stock"
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-manage-variants"
                      onClick={() => setEditingProductModal(product)}
                    >
                      <Boxes size={14} />
                      <span>{hasVariants ? "Manage Variants" : "+ Add Variants"}</span>
                    </button>

                    <Link
                      to={`/products/${product.id}/edit`}
                      className="btn btn-ghost btn-sm"
                      title="Edit Product Details"
                    >
                      <Edit size={14} />
                    </Link>
                  </div>
                </div>

                {/* Variants Table or Single Stock Stepper */}
                {hasVariants ? (
                  <div className="variants-inventory-table-wrap">
                    <table className="variants-inventory-table">
                      <thead>
                        <tr>
                          <th>Size</th>
                          <th>Color Swatch</th>
                          <th>Stock Units</th>
                          <th>Sales Units</th>
                          <th>Live Availability Status</th>
                          <th>Quick Adjust</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortNewestFirst(product.variants.map((variant, originalIndex) => ({ ...variant, originalIndex }))).map(({ originalIndex, ...v }, vIdx) => {
                          const stock = Number(v.stockCount ?? v.stock_count ?? 0);
                          const colorObj = product.colors?.find(
                            (c) => c.name?.toLowerCase() === v.color?.toLowerCase()
                          );
                          const colorHex = colorObj?.hex || v.colorHex || "#111827";

                          const status =
                            stock === 0
                              ? { label: "Out of Stock", class: "status-out" }
                              : stock <= 5
                              ? { label: `Low Stock (${stock} left)`, class: "status-low" }
                              : { label: `In Stock (${stock})`, class: "status-in" };

                          return (
                            <tr key={v.id || vIdx}>
                              <td>
                                <span className="size-badge-pill">{v.size || "Standard"}</span>
                              </td>
                              <td>
                                <div className="color-badge-cell">
                                  <span
                                    className="color-dot-indicator"
                                    style={{ backgroundColor: colorHex }}
                                  />
                                  <span>{v.color || "Standard"}</span>
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={stock}
                                  onChange={(e) =>
                                    handleQuickStockChange(product, originalIndex, e.target.value, null, false)
                                  }
                                  onBlur={(e) => handleQuickStockChange(product, originalIndex, e.target.value)}
                                  className="stock-cell-input"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={Number(v.salesCount ?? v.sales_count ?? 0)}
                                  onChange={(e) => handleQuickStockChange(
                                    product,
                                    originalIndex,
                                    stock,
                                    e.target.value,
                                    false
                                  )}
                                  onBlur={(e) => handleQuickStockChange(product, originalIndex, stock, e.target.value)}
                                  className="stock-cell-input"
                                  aria-label={`Sales units for ${product.name} ${v.color || ""} ${v.size || ""}`}
                                />
                              </td>
                              <td>
                                <span className={`variant-stock-status-tag ${status.class}`}>
                                  <span className="tag-dot" />
                                  <span>{status.label}</span>
                                </span>
                              </td>
                              <td>
                                <div className="quick-adjust-group">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStockChange(product, originalIndex, Math.max(0, stock - 1))
                                    }
                                    title="Decrease by 1"
                                    disabled={stock <= 0}
                                  >
                                    -1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStockChange(product, originalIndex, stock + 1)
                                    }
                                    title="Increase by 1"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickStockChange(product, originalIndex, stock + 10)
                                    }
                                    title="Add 10 units"
                                  >
                                    +10
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-set-zero"
                                    onClick={() =>
                                      handleQuickStockChange(product, originalIndex, 0)
                                    }
                                    title="Mark Sold Out"
                                  >
                                    Set 0
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="single-stock-strip">
                    <div className="single-stock-info">
                      <span className="single-stock-label">Single SKU Inventory (no variants configured):</span>
                      <div className="single-stock-input-wrap">
                        <label>Available stock
                        <input
                          type="number"
                          min="0"
                          value={product.stockCount || 0}
                          onChange={(e) => handleSingleProductStock(product, e.target.value, product.salesCount || 0, false)}
                          onBlur={(e) => handleSingleProductStock(product, e.target.value)}
                          className="stock-cell-input"
                        />
                        </label>
                        <label>Sales stock
                          <input
                            type="number"
                            min="0"
                            value={product.salesCount || 0}
                            onChange={(e) => handleSingleProductStock(product, product.stockCount || 0, e.target.value, false)}
                            onBlur={(e) => handleSingleProductStock(product, product.stockCount || 0, e.target.value)}
                            className="stock-cell-input"
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() =>
                            handleSingleProductStock(product, (product.stockCount || 0) + 10)
                          }
                        >
                          +10 Units
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-secondary"
                          onClick={() =>
                            handleSingleProductStock(product, (product.stockCount || 0) + 25)
                          }
                        >
                          +25 Units
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingProductModal(product)}
                    >
                      <Sparkles size={14} />
                      <span>Create Size × Color Variants</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-inventory-state card">
            <Boxes size={36} className="empty-icon" />
            <h3>No products found</h3>
            <p>Try adjusting your search query, department filter, or stock availability filter.</p>
          </div>
        )}
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={filteredProducts.length}
        onChange={(nextPage) => {
          setCurrentPage(nextPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Modal: Full Variants & Stock Matrix Manager */}
      {editingProductModal && (
        <VariantsMatrixModal
          product={editingProductModal}
          isSaving={savingProductId === editingProductModal.id}
          onClose={() => setEditingProductModal(null)}
          onSave={(variants) => handleSaveVariantsModal(editingProductModal.id, variants)}
        />
      )}
    </div>
  );
}

// ── Modal: Dedicated Variants & Stock Matrix Manager ──
function VariantsMatrixModal({ product, isSaving, onClose, onSave }) {
  const initialVariants = (product.variants || []).map((v) => ({
    id: v.id,
    created_at: v.createdAt || v.created_at || undefined,
    size: v.size || "",
    color: v.color || "",
    stock_count: v.stockCount ?? v.stock_count ?? 10,
    sales_count: v.salesCount ?? v.sales_count ?? 0,
    sku_suffix: v.skuSuffix ?? v.sku_suffix ?? "",
    price_override: v.priceOverride ?? v.price_override ?? "",
    original_price_override: v.originalPriceOverride ?? v.original_price_override ?? ""
  }));

  const [variants, setVariants] = useState(initialVariants);
  const [sizes, setSizes] = useState(product.sizes || ["S", "M", "L", "XL"]);
  const [colors, setColors] = useState(
    product.colors && product.colors.length > 0
      ? product.colors
      : [{ name: "Standard", hex: "#111827" }]
  );

  const totalUnits = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock_count) || 0), 0);
  }, [variants]);

  function generateCombinations() {
    const validSizes = sizes.length > 0 ? sizes : ["Standard"];
    const validColors = colors.length > 0 ? colors.map((c) => c.name) : ["Standard"];

    const existingMap = new Map();
    variants.forEach((v) => {
      const key = `${(v.size || "").toLowerCase()}__${(v.color || "").toLowerCase()}`;
      existingMap.set(key, v);
    });

    const generated = [];
    validSizes.forEach((s) => {
      validColors.forEach((c) => {
        const key = `${s.toLowerCase()}__${c.toLowerCase()}`;
        const existing = existingMap.get(key);
        generated.push({
          ...(existing || {}),
          size: s,
          color: c,
          stock_count: existing ? existing.stock_count : 10,
          sales_count: existing ? existing.sales_count : 0,
          sku_suffix: existing?.sku_suffix || "",
          price_override: existing?.price_override ?? ""
        });
      });
    });

    setVariants(generated);
  }

  function addRow() {
    setVariants((prev) => [
      ...prev,
      {
        size: sizes[0] || "M",
        color: colors[0]?.name || "Standard",
        stock_count: 10,
        sales_count: 0,
        sku_suffix: "",
        price_override: ""
      }
    ]);
  }

  function updateRow(idx, field, val) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v))
    );
  }

  function removeRow(idx) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function setBulkStock(qty) {
    setVariants((prev) => prev.map((v) => ({ ...v, stock_count: qty })));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Manage Variants & Stock: {product.name}</h3>
            <p className="modal-subtitle">
              Configure inventory levels for each Size and Color combination. The storefront shows real-time availability.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Action Toolbar */}
          <div className="matrix-toolbar">
            <div className="matrix-toolbar-left">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={generateCombinations}
              >
                <Sparkles size={14} />
                <span>⚡ Auto-Generate Combinations</span>
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addRow}>
                <Plus size={14} />
                <span>Add Single Row</span>
              </button>
              {variants.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger-ghost"
                  onClick={() => setVariants([])}
                >
                  <Trash2 size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {variants.length > 0 && (
              <div className="matrix-toolbar-right">
                <span className="bulk-label">Set all stocks:</span>
                <div className="bulk-btns">
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => setBulkStock(0)}>0 (Sold Out)</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => setBulkStock(5)}>5 (Low)</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => setBulkStock(15)}>15</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => setBulkStock(30)}>30</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => setBulkStock(50)}>50</button>
                </div>
              </div>
            )}
          </div>

          {/* Metric Summary Strip */}
          <div className="matrix-stats-strip">
            <span className="stat-item">Total Variants: <strong>{variants.length}</strong></span>
            <span className="stat-item">Total Units: <strong>{totalUnits} units</strong></span>
            <span className="stat-item pill-green">
              In Stock: <strong>{variants.filter((v) => Number(v.stock_count) > 5).length}</strong>
            </span>
            <span className="stat-item pill-amber">
              Low Stock: <strong>{variants.filter((v) => Number(v.stock_count) > 0 && Number(v.stock_count) <= 5).length}</strong>
            </span>
            <span className="stat-item pill-red">
              Out of Stock: <strong>{variants.filter((v) => !v.stock_count || Number(v.stock_count) === 0).length}</strong>
            </span>
          </div>

          {/* Matrix Rows Table */}
          {variants.length > 0 ? (
            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Stock Units</th>
                    <th>Status</th>
                    <th style={{ width: 44 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => {
                    const count = Math.max(0, parseInt(v.stock_count, 10) || 0);
                    const status =
                      count === 0
                        ? { text: "Out of Stock", class: "status-out" }
                        : count <= 5
                        ? { text: `Low Stock (${count})`, class: "status-low" }
                        : { text: `In Stock (${count})`, class: "status-in" };

                    return (
                      <tr key={idx}>
                        <td>
                          {sizes.length > 0 ? (
                            <select
                              value={v.size}
                              onChange={(e) => updateRow(idx, "size", e.target.value)}
                              className="matrix-select"
                            >
                              {sizes.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={v.size}
                              onChange={(e) => updateRow(idx, "size", e.target.value)}
                              className="matrix-input"
                              placeholder="e.g. M"
                            />
                          )}
                        </td>
                        <td>
                          {colors.length > 0 ? (
                            <select
                              value={v.color}
                              onChange={(e) => updateRow(idx, "color", e.target.value)}
                              className="matrix-select"
                            >
                              {colors.map((c) => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={v.color}
                              onChange={(e) => updateRow(idx, "color", e.target.value)}
                              className="matrix-input"
                              placeholder="e.g. Black"
                            />
                          )}
                        </td>
                        <td>
                          <div className="matrix-stock-cell">
                            <input
                              type="number"
                              min="0"
                              value={v.stock_count}
                              onChange={(e) => updateRow(idx, "stock_count", e.target.value)}
                              className="matrix-stock-input"
                            />
                            <div className="stepper-mini">
                              <button type="button" onClick={() => updateRow(idx, "stock_count", Math.max(0, count - 1))}>-1</button>
                              <button type="button" onClick={() => updateRow(idx, "stock_count", count + 1)}>+1</button>
                              <button type="button" onClick={() => updateRow(idx, "stock_count", count + 10)}>+10</button>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`matrix-status-badge ${status.class}`}>
                            <span className="dot" />
                            <span>{status.text}</span>
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-trash-row"
                            onClick={() => removeRow(idx)}
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="matrix-empty card">
              <Boxes size={32} />
              <h4>No Variants Configured</h4>
              <p>
                Click <strong>Auto-Generate Combinations</strong> to automatically generate inventory rows for all product sizes and colors, or click <strong>Add Single Row</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-accent"
            disabled={isSaving}
            onClick={() => onSave(variants)}
          >
            {isSaving ? "Saving Inventory..." : "Save Variants & Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
