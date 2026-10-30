import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Boxes,
  Search,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  TrendingDown
} from "lucide-react";
import { productsApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { resolveImageUrl } from "../../utils/imageUrl";
import LoadingState from "../../components/LoadingState/LoadingState";
import Pagination from "../../components/Pagination/Pagination";
import { sortNewestFirst } from "../../utils/sortNewestFirst";
import "./StockManagementPage.css";

const PRODUCTS_PER_PAGE = 10;

export default function StockManagementPage() {
  const [searchParams] = useSearchParams();
  const highlightProductId = searchParams.get("productId");

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMap, setExpandedMap] = useState({});

  // Adjust modal
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  const toast = useToast();

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const firstPage = await productsApi.list({ page: 1, limit: 100 });
        const pageCount = Number(firstPage.meta?.totalPages) || 1;
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            productsApi.list({ page: index + 2, limit: 100 })
          )
        );
        setProducts([...(firstPage.data || []), ...remainingPages.flatMap((page) => page.data || [])]);
      } catch (err) {
        setProducts([]);
        toast.error(err.message || "Failed to load stock data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((prod) => {
      const matchName = prod.name?.toLowerCase().includes(q);
      const matchSku = prod.sku?.toLowerCase().includes(q);
      const matchVar = prod.variants?.some(
        (v) =>
          v.size?.toLowerCase().includes(q) ||
          v.color?.toLowerCase().includes(q) ||
          v.skuSuffix?.toLowerCase().includes(q)
      );
      return matchName || matchSku || matchVar;
    });
  }, [products, searchQuery]);

  // Auto-expand and navigate to highlighted product if given
  useEffect(() => {
    if (highlightProductId && filteredProducts.length > 0) {
      const idx = filteredProducts.findIndex(
        (p) => String(p.id) === String(highlightProductId)
      );
      if (idx !== -1) {
        const targetPage = Math.floor(idx / PRODUCTS_PER_PAGE) + 1;
        setCurrentPage(targetPage);
        setExpandedMap((prev) => ({ ...prev, [highlightProductId]: true }));
      }
    }
  }, [highlightProductId, filteredProducts]);

  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, totalProducts);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  function isExpanded(productId, idx) {
    if (expandedMap[productId] !== undefined) return expandedMap[productId];
    if (highlightProductId && String(highlightProductId) === String(productId)) return true;
    return idx === 0 && currentPage === 1;
  }

  function toggleExpand(productId, idx) {
    setExpandedMap((prev) => ({
      ...prev,
      [productId]: !isExpanded(productId, idx),
    }));
  }

  const allExpanded =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p, i) => isExpanded(p.id, i));

  function handleToggleAll() {
    const shouldExpand = !allExpanded;
    const next = {};
    paginatedProducts.forEach((p) => {
      next[p.id] = shouldExpand;
    });
    setExpandedMap((prev) => ({ ...prev, ...next }));
  }

  // Summary stats
  const stats = useMemo(() => {
    let totalVariants = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let totalStock = 0;
    let totalSales = 0;
    products.forEach((prod) => {
      (prod.variants || []).forEach((v) => {
        totalVariants++;
        const qty = Number(v.stockCount ?? v.stock_count ?? 0);
        totalStock += qty;
        totalSales += Number(v.salesCount ?? v.sales_count ?? 0);
        if (qty === 0) outOfStock++;
        else if (qty <= 5) lowStock++;
      });
      if (!(prod.variants || []).length) {
        totalStock += Number(prod.stockCount ?? prod.stock_count ?? 0);
        totalSales += Number(prod.salesCount ?? prod.sales_count ?? 0);
      }
    });
    return { totalVariants, outOfStock, lowStock, totalStock, totalSales };
  }, [products]);

  // Update stock quantity for a variant
  async function handleUpdateVariantStock(product, variantIdx, newQty, newSalesQty = null) {
    const validQty = Math.max(0, parseInt(newQty, 10) || 0);
    const validSalesQty = newSalesQty === null
      ? Number(product.variants?.[variantIdx]?.salesCount ?? product.variants?.[variantIdx]?.sales_count ?? 0)
      : Math.max(0, parseInt(newSalesQty, 10) || 0);

    const updatedVariants = (product.variants || []).map((v, idx) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      sku_suffix: v.skuSuffix || v.sku_suffix || null,
      stock_count: idx === variantIdx ? validQty : Number(v.stockCount ?? v.stock_count ?? 0),
      sales_count: idx === variantIdx ? validSalesQty : Number(v.salesCount ?? v.sales_count ?? 0),
      price_override: v.priceOverride ?? v.price_override ?? null,
      original_price_override: v.originalPriceOverride ?? v.original_price_override ?? null,
      created_at: v.createdAt || v.created_at || undefined,
      image_url: v.imageUrl || v.image_url || null,
      gallery_images: v.galleryImages || v.gallery_images || [],
    }));

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== product.id) return p;
        const updatedVars = (p.variants || []).map((v, idx) => {
          if (idx !== variantIdx) return v;
          return {
            ...v,
            stockCount: validQty,
            stock_count: validQty,
            salesCount: validSalesQty,
            sales_count: validSalesQty,
          };
        });
        const totalStock = updatedVars.reduce(
          (sum, v) => sum + Number(v.stockCount ?? v.stock_count ?? 0),
          0
        );
        return {
          ...p,
          variants: updatedVars,
          stockCount: totalStock,
          salesCount: updatedVars.reduce((sum, v) => sum + Number(v.salesCount ?? v.sales_count ?? 0), 0),
          inStock: totalStock > 0,
        };
      })
    );

    try {
      await productsApi.saveVariants(product.id, updatedVariants);
      toast.success("Stock updated");
    } catch (err) {
      toast.error(err.message || "Failed to update stock");
      loadData();
    }
  }

  // Open adjust modal
  function handleOpenAdjust(product, variant, variantIdx) {
    const currentStock = Number(
      variant.stockCount ?? variant.stock_count ?? 0
    );
    const currentSales = Number(variant.salesCount ?? variant.sales_count ?? 0);
    setAdjustingItem({ product, variant, variantIdx, currentQty: currentStock, currentSales });
    setAdjustQtyInput(String(currentStock));
    setAdjustNote("");
  }

  // Save adjust from modal
  async function handleSaveAdjust() {
    if (!adjustingItem) return;
    const finalQty = Math.max(0, parseInt(adjustQtyInput, 10) || 0);
    setIsSavingAdjust(true);
    await handleUpdateVariantStock(
      adjustingItem.product,
      adjustingItem.variantIdx,
      finalQty
    );
    setIsSavingAdjust(false);
    setAdjustingItem(null);
  }

  async function handleUpdateProductStock(product, quantity) {
    const nextStock = Math.max(0, Number.parseInt(quantity, 10) || 0);
    setProducts((previous) => previous.map((item) => item.id === product.id
      ? { ...item, stockCount: nextStock, stock_count: nextStock, inStock: nextStock > 0 }
      : item));
    try {
      await productsApi.updateStock(product.id, { stock_count: nextStock, in_stock: nextStock > 0 });
      toast.success("Available stock updated");
    } catch (err) {
      toast.error(err.message || "Failed to update stock");
      loadData(true);
    }
  }

  if (isLoading && products.length === 0) {
    return <LoadingState label="Loading Stock Management..." />;
  }

  return (
    <div className="s-page">
      {/* Top Header */}
      <div className="s-header-banner">
        <div className="s-header-left">
          <span className="s-eyebrow">INVENTORY & STOCK</span>
          <div className="s-title-wrap">
            <span className="s-icon-symbol">
              <Boxes size={26} color="var(--primary-text)" />
            </span>
            <h1 className="s-main-title">Stock Management</h1>
          </div>
        </div>

        <div className="s-header-actions">
          <div className="s-search-bar">
            <Search size={15} className="s-search-icon" />
            <input
              type="text"
              placeholder="Search products or variants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="s-search-input"
              aria-label="Search stock"
            />
            {searchQuery && (
              <button
                type="button"
                className="s-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="s-btn-secondary"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Refresh stock data"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "spin" : ""}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link to="/variants" className="s-btn-outline">
            <Layers size={14} />
            <span>Variants</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="s-stats-bar">
        <div className="s-stat-card">
          <span className="s-stat-value">{stats.totalVariants}</span>
          <span className="s-stat-label">Total Variants</span>
        </div>
        <div className="s-stat-card">
          <span className="s-stat-value">{stats.totalStock.toLocaleString("en-IN")}</span>
          <span className="s-stat-label">Available Units</span>
        </div>
        <div className="s-stat-card">
          <span className="s-stat-value">{stats.totalSales.toLocaleString("en-IN")}</span>
          <span className="s-stat-label">Units Sold</span>
        </div>
        {stats.lowStock > 0 && (
          <div className="s-stat-card s-stat-warning">
            <TrendingDown size={14} />
            <span className="s-stat-value">{stats.lowStock}</span>
            <span className="s-stat-label">Low Stock</span>
          </div>
        )}
        {stats.outOfStock > 0 && (
          <div className="s-stat-card s-stat-danger">
            <AlertTriangle size={14} />
            <span className="s-stat-value">{stats.outOfStock}</span>
            <span className="s-stat-label">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product List Header / Pagination Info */}
      <div className="s-pagination-bar-top">
        <span className="s-pagination-summary">
          Showing <strong>{totalProducts === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong>{totalProducts}</strong> products
        </span>
        {paginatedProducts.length > 0 && (
          <button
            type="button"
            className="s-btn-ghost-sm"
            onClick={handleToggleAll}
          >
            {allExpanded ? "Collapse All on Page" : "Expand All on Page"}
          </button>
        )}
      </div>

      {/* Product Cards */}
      <div className="s-cards-list">
        {paginatedProducts.length > 0 ? (
          paginatedProducts.map((prod, idx) => {
            const sourceVariants = prod.variants || [];
            const defaultVariantId = sourceVariants[0]?.id;
            const variants = sortNewestFirst(sourceVariants.map((variant, originalIndex) => ({ ...variant, originalIndex })));
            const expanded = isExpanded(prod.id, idx);

            return (
              <div
                key={prod.id}
                className={`s-prod-card ${
                  String(prod.id) === String(highlightProductId)
                    ? "is-highlighted"
                    : ""
                }`}
              >
                {/* Product Card Header */}
                <div
                  className="s-prod-header"
                  onClick={() => toggleExpand(prod.id, idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(prod.id, idx);
                    }
                  }}
                  aria-expanded={expanded}
                >
                  <div className="s-prod-header-left">
                    <button
                      type="button"
                      className="s-arrow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(prod.id, idx);
                      }}
                      aria-label={expanded ? `Collapse ${prod.name}` : `Expand ${prod.name}`}
                    >
                      {expanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    <img
                      src={resolveImageUrl(prod.image || prod.images?.[0])}
                      alt={prod.name}
                      className="s-prod-avatar"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <h2 className="s-prod-title">{prod.name}</h2>
                  </div>

                  <div className="s-prod-header-right">
                    <span className="s-variants-count-badge">
                      {variants.length}{" "}
                      {variants.length === 1 ? "variant" : "variants"}{" "}
                      <span className="s-mini-chevron">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Stock Table */}
                {expanded && (
                  <div className="s-table-container">
                    {variants.length > 0 ? (
                      <table className="s-table">
                        <thead>
                          <tr>
                            <th className="s-th-sno">S.NO</th>
                            <th className="s-th-variant">VARIANT</th>
                            <th className="s-th-colorsize">COLOR / SIZE</th>
                            <th className="s-th-sku">SKU</th>
                            <th className="s-th-stock">AVAILABLE</th>
                            <th className="s-th-sales">SOLD</th>
                            <th className="s-th-actions">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map(({ originalIndex, ...v }, vIdx) => {
                            const isDefault = defaultVariantId ? v.id === defaultVariantId : originalIndex === 0;
                            const stockCount = Number(
                              v.stockCount ?? v.stock_count ?? 0
                            );
                            const lowThreshold = Number(v.lowStockThreshold ?? v.low_stock_threshold ?? 5);
                            const isLow = stockCount > 0 && stockCount <= lowThreshold;
                            const isOut = stockCount === 0;
                            const fullSku =
                              v.skuSuffix || v.sku_suffix
                                ? `${prod.sku}-${v.skuSuffix || v.sku_suffix}`
                                : prod.sku;
                            const variantTitle =
                              v.color ||
                              (isDefault ? "Default" : `Variant ${vIdx + 1}`);
                            const salesStock = Number(
                              v.salesStock ?? v.salesCount ?? v.sales_stock ?? v.sales_count ?? 0
                            );

                            return (
                              <tr
                                key={v.id || vIdx}
                                className={
                                  isOut
                                    ? "s-row-out"
                                    : isLow
                                    ? "s-row-low"
                                    : ""
                                }
                              >
                                {/* S.NO */}
                                <td className="s-cell-sno">{vIdx + 1}</td>

                                {/* VARIANT */}
                                <td>
                                  <div className="s-variant-info-cell">
                                    <img
                                      src={resolveImageUrl(
                                        v.imageUrl ||
                                          v.image_url ||
                                          prod.image ||
                                          prod.images?.[0]
                                      )}
                                      alt={variantTitle}
                                      className="s-variant-thumb"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <div className="s-variant-meta">
                                      <span className="s-variant-name">
                                        {variantTitle}
                                      </span>
                                      {isDefault && (
                                        <span className="s-badge-default">
                                          DEFAULT
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* COLOR / SIZE */}
                                <td>
                                  <div className="s-color-size-cell">
                                    <span
                                      className="s-color-dot"
                                      style={{
                                        backgroundColor:
                                          v.colorHex || "#181715",
                                      }}
                                    />
                                    <span className="s-color-size-label">
                                      {v.color || "Standard"} /{" "}
                                      {v.size || "Standard"}
                                    </span>
                                  </div>
                                </td>

                                {/* SKU */}
                                <td>
                                  <span className="s-sku-tag">{fullSku}</span>
                                </td>

                                {/* STOCK QTY */}
                                <td style={{ textAlign: "center" }}>
                                  <div className="s-stock-qty-wrap">
                                    <button type="button" className="s-stepper-btn s-inline-stepper" onClick={(event) => { event.stopPropagation(); handleUpdateVariantStock(prod, originalIndex, stockCount - 1); }} disabled={stockCount <= 0} aria-label={`Decrease available stock for ${variantTitle}`}><Minus size={13} /></button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={stockCount}
                                      onChange={(e) => {
                                        const newQty = parseInt(e.target.value, 10) || 0;
                                        setProducts((prev) =>
                                          prev.map((p) => {
                                            if (p.id !== prod.id) return p;
                                            const updatedVars = (p.variants || []).map(
                                              (vv, ii) => {
                                                if (ii !== originalIndex) return vv;
                                                return {
                                                  ...vv,
                                                  stockCount: newQty,
                                                  stock_count: newQty,
                                                };
                                              }
                                            );
                                            return { ...p, variants: updatedVars };
                                          })
                                        );
                                      }}
                                      onBlur={(e) => {
                                        handleUpdateVariantStock(
                                          prod,
                                          originalIndex,
                                          e.target.value
                                        );
                                      }}
                                      className="s-stock-qty-input"
                                      aria-label={`Stock for ${prod.name} ${variantTitle}`}
                                    />
                                    <button type="button" className="s-stepper-btn s-inline-stepper" onClick={(event) => { event.stopPropagation(); handleUpdateVariantStock(prod, originalIndex, stockCount + 1); }} aria-label={`Increase available stock for ${variantTitle}`}><Plus size={13} /></button>
                                  </div>
                                </td>

                                {/* SALES STOCK */}
                                <td style={{ textAlign: "center" }}>
                                  <span className="s-sales-stock-val" title="Updated automatically from completed orders">{salesStock.toLocaleString("en-IN")}</span>
                                </td>

                                {/* ACTIONS */}
                                <td style={{ textAlign: "right" }}>
                                  <button
                                    type="button"
                                    className="s-btn-adjust"
                                    onClick={() =>
                                      handleOpenAdjust(prod, v, originalIndex)
                                    }
                                    title="Adjust stock quantity"
                                  >
                                    + Adjust
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="s-simple-stock-row">
                        <div className="s-simple-stock-product">
                          <strong>Single product stock</strong>
                          <span>Sales count increases automatically when orders are placed.</span>
                        </div>
                        <div className="s-simple-stock-control">
                          <span>Available</span>
                          <button type="button" className="s-stepper-btn" onClick={() => handleUpdateProductStock(prod, Number(prod.stockCount ?? prod.stock_count ?? 0) - 1)} aria-label="Decrease available stock"><Minus size={14} /></button>
                          <input type="number" min="0" value={Number(prod.stockCount ?? prod.stock_count ?? 0)} onChange={(event) => {
                            const nextStock = Math.max(0, Number.parseInt(event.target.value, 10) || 0);
                            setProducts((previous) => previous.map((item) => item.id === prod.id ? { ...item, stockCount: nextStock, stock_count: nextStock } : item));
                          }} onBlur={(event) => handleUpdateProductStock(prod, event.target.value)} className="s-stock-qty-input" aria-label={`Available stock for ${prod.name}`} />
                          <button type="button" className="s-stepper-btn" onClick={() => handleUpdateProductStock(prod, Number(prod.stockCount ?? prod.stock_count ?? 0) + 1)} aria-label="Increase available stock"><Plus size={14} /></button>
                        </div>
                        <div className="s-simple-sales"><span>Units sold</span><strong>{Number(prod.salesCount ?? prod.sales_count ?? 0).toLocaleString("en-IN")}</strong></div>
                        <Link to={`/variants?productId=${prod.id}`} className="s-btn-secondary"><Layers size={13} /><span>Add variants</span></Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="s-empty-state">
            <Boxes size={40} color="var(--primary-text)" />
            <h3>No products found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="s-pagination-card">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            total={totalProducts}
            onChange={(newPage) => {
              setCurrentPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {/* Quick Adjust Stock Modal */}
      {adjustingItem && (
        <div
          className="s-modal-overlay"
          onClick={() => setAdjustingItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Adjust Stock"
        >
          <div
            className="s-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="s-modal-header">
              <h2 className="s-modal-title">Adjust Stock Quantity</h2>
              <button
                type="button"
                className="s-modal-close-btn"
                onClick={() => setAdjustingItem(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="s-modal-body">
              {/* Product summary */}
              <div className="s-item-summary">
                <img
                  src={resolveImageUrl(
                    adjustingItem.variant.imageUrl ||
                    adjustingItem.variant.image_url ||
                    adjustingItem.product.image ||
                    adjustingItem.product.images?.[0]
                  )}
                  alt={adjustingItem.product.name}
                  className="s-modal-item-thumb"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="s-modal-item-info">
                  <div className="s-modal-item-title">
                    {adjustingItem.product.name}
                  </div>
                  <div className="s-modal-item-sub">
                    <span
                      className="s-color-dot-sm"
                      style={{
                        backgroundColor:
                          adjustingItem.variant.colorHex || "#181715",
                      }}
                    />
                    {adjustingItem.variant.color || "Standard"} /{" "}
                    {adjustingItem.variant.size || "Standard"}
                  </div>
                  <div className="s-modal-item-current">
                    Available stock: <strong>{adjustingItem.currentQty} units</strong>
                    <span> · Sales stock: <strong>{adjustingItem.currentSales} units</strong></span>
                  </div>
                </div>

              </div>

              {/* Quantity Stepper */}
              <div className="s-adjust-field">
                <label className="s-adjust-label">
                  New Stock Quantity
                </label>
                <div className="s-stepper-row">
                  <button
                    type="button"
                    className="s-stepper-btn"
                    onClick={() =>
                      setAdjustQtyInput(
                        String(
                          Math.max(
                            0,
                            (parseInt(adjustQtyInput, 10) || 0) - 1
                          )
                        )
                      )
                    }
                    aria-label="Decrease by 1"
                  >
                    <Minus size={15} />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={adjustQtyInput}
                    onChange={(e) => setAdjustQtyInput(e.target.value)}
                    className="s-adjust-qty-input"
                    autoFocus
                    aria-label="Stock quantity"
                  />

                  <button
                    type="button"
                    className="s-stepper-btn"
                    onClick={() =>
                      setAdjustQtyInput(
                        String((parseInt(adjustQtyInput, 10) || 0) + 1)
                      )
                    }
                    aria-label="Increase by 1"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {/* Quick add presets */}
                <div className="s-quick-pill-group">
                  {[5, 10, 25, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="s-quick-pill"
                      onClick={() =>
                        setAdjustQtyInput(
                          String((parseInt(adjustQtyInput, 10) || 0) + n)
                        )
                      }
                    >
                      +{n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="s-quick-pill s-pill-zero"
                    onClick={() => setAdjustQtyInput("0")}
                  >
                    Set to 0 (Out of Stock)
                  </button>
                </div>

                {/* Change summary */}
                {adjustQtyInput !== String(adjustingItem.currentQty) && (
                  <div className="s-change-summary">
                    <span>
                      {parseInt(adjustQtyInput, 10) > adjustingItem.currentQty
                        ? "+"
                        : ""}
                      {(parseInt(adjustQtyInput, 10) || 0) -
                        adjustingItem.currentQty}{" "}
                      units from current stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="s-modal-footer">
              <button
                type="button"
                className="s-btn-cancel"
                onClick={() => setAdjustingItem(null)}
                disabled={isSavingAdjust}
              >
                Cancel
              </button>
              <button
                type="button"
                className="s-btn-primary"
                onClick={handleSaveAdjust}
                disabled={isSavingAdjust}
              >
                <Check size={16} />
                <span>
                  {isSavingAdjust ? "Saving..." : "Save Stock"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
