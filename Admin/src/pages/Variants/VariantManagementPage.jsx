import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Layers,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  UploadCloud,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { productsApi, uploadApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import { resolveImageUrl } from "../../utils/imageUrl";
import LoadingState from "../../components/LoadingState/LoadingState";
import Pagination from "../../components/Pagination/Pagination";
import { sortNewestFirst } from "../../utils/sortNewestFirst";
import "./VariantManagementPage.css";

const PRODUCTS_PER_PAGE = 10;

const SIZE_PRESETS = ["Free Size", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

const POPULAR_COLORS = [
  { name: "Sunflower Yellow", hex: "#EAB308" },
  { name: "Midnight Blue", hex: "#1E3A8A" },
  { name: "Jet Black", hex: "#181715" },
  { name: "Off White", hex: "#F3EFE4" },
  { name: "Cherry Red", hex: "#DC2626" },
  { name: "Military Green", hex: "#4B5A3F" },
  { name: "Charcoal Grey", hex: "#374151" },
  { name: "Beige", hex: "#D4C5B9" },
  { name: "Royal Blue", hex: "#1D4ED8" },
  { name: "Forest Green", hex: "#166534" },
];

const GST_OPTIONS = [
  { label: "5% (SGST 2.5% + CGST 2.5%)", value: "5" },
  { label: "12% (SGST 6% + CGST 6%)", value: "12" },
  { label: "18% (SGST 9% + CGST 9%)", value: "18" },
  { label: "0% (Exempted)", value: "0" },
];

export default function VariantManagementPage() {
  const [searchParams] = useSearchParams();
  const highlightProductId = searchParams.get("productId");

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMap, setExpandedMap] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productsApi.list({ limit: 200 });
      setProducts(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load variants");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
      const matchCat =
        prod.category?.toLowerCase().includes(q) ||
        prod.subCategory?.toLowerCase().includes(q);
      const matchVar = prod.variants?.some(
        (v) =>
          v.size?.toLowerCase().includes(q) ||
          v.color?.toLowerCase().includes(q) ||
          v.skuSuffix?.toLowerCase().includes(q)
      );
      return matchName || matchSku || matchCat || matchVar;
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

  function handleOpenAdd(targetProduct = null) {
    setEditingVariant(
      targetProduct ? { productId: String(targetProduct.id) } : null
    );
    setIsModalOpen(true);
  }

  function handleOpenEdit(product, variant, variantIdx) {
    setEditingVariant({
      productId: String(product.id),
      variantId: variant.id,
      variantIdx,
      size: variant.size || "Free Size",
      color: variant.color || "",
      colorHex: variant.colorHex || "#181715",
      sku: variant.skuSuffix || variant.sku_suffix || "",
      price: variant.priceOverride ?? product.price,
      originalPrice: variant.originalPriceOverride ?? product.originalPrice ?? "",
      stockCount: Number(variant.stockCount ?? variant.stock_count ?? 0),
      lowStockThreshold: Number(variant.lowStockThreshold ?? variant.low_stock_threshold ?? 10),
      gstRate: String(variant.gstRate ?? variant.gst_rate ?? "5"),
      imageUrl: variant.imageUrl || variant.image_url || "",
      galleryImages: variant.galleryImages || variant.gallery_images || [],
    });
    setIsModalOpen(true);
  }

  async function handleDeleteVariant(product, variant, variantIdx) {
    const ok = await confirm({
      title: "Delete Variant?",
      message: `Remove "${variant.color || ""} / ${variant.size || ""}" from "${product.name}"? This cannot be undone.`,
      danger: true,
    });
    if (!ok) return;

    const updatedVariants = (product.variants || [])
      .filter((_, idx) => idx !== variantIdx)
      .map((v) => ({
        created_at: v.createdAt || v.created_at || undefined,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        sku_suffix: v.skuSuffix || v.sku_suffix || null,
        stock_count: Number(v.stockCount ?? v.stock_count ?? 0),
        sales_count: Number(v.salesCount ?? v.sales_count ?? 0),
        price_override: v.priceOverride ?? v.price_override ?? null,
        original_price_override: v.originalPriceOverride ?? v.original_price_override ?? null,
        image_url: v.imageUrl || v.image_url || null,
        gallery_images: v.galleryImages || v.gallery_images || [],
      }));

    try {
      await productsApi.saveVariants(product.id, updatedVariants);
      toast.delete(`Variant "${variant.color || "Standard"} / ${variant.size || "Free Size"}" has been deleted successfully.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete variant");
    }
  }

  async function handleSaveVariant(formData) {
    const targetProduct = products.find(
      (p) => String(p.id) === String(formData.productId)
    );
    if (!targetProduct) {
      toast.error("Selected product not found");
      return;
    }

    const currentVariants = (targetProduct.variants || []).map((v) => ({
      id: v.id,
      created_at: v.createdAt || v.created_at || undefined,
      size: v.size || "Free Size",
      color: v.color || "Standard",
      colorHex: v.colorHex,
      sku_suffix: v.skuSuffix || v.sku_suffix || null,
      stock_count: Number(v.stockCount ?? v.stock_count ?? 0),
      sales_count: Number(v.salesCount ?? v.sales_count ?? 0),
      price_override: v.priceOverride ?? v.price_override ?? null,
      original_price_override: v.originalPriceOverride ?? v.original_price_override ?? null,
      image_url: v.imageUrl || v.image_url || null,
      gallery_images: v.galleryImages || v.gallery_images || [],
    }));

    if (editingVariant && editingVariant.variantIdx !== undefined) {
      const updatedVariants = currentVariants.map((v, idx) => {
        if (idx === editingVariant.variantIdx) {
          return {
            ...v,
            size: formData.size,
            color: formData.color,
            colorHex: formData.colorHex,
            sku_suffix: formData.sku || null,
            stock_count: Number(formData.stockCount || 0),
            price_override: formData.price ? parseFloat(formData.price) : null,
            original_price_override: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
            image_url: formData.imageUrl || null,
            gallery_images: formData.galleryImages || [],
          };
        }
        return v;
      });

      try {
        await productsApi.saveVariants(targetProduct.id, updatedVariants);
        toast.success(
          `Variant "${formData.color} / ${formData.size}" updated successfully!`
        );
        setIsModalOpen(false);
        loadData();
      } catch (err) {
        toast.error(err.message || "Failed to update variant");
      }
    } else {
      const variantsToAdd = formData.variants?.length ? formData.variants : [formData];
      const duplicates = variantsToAdd.filter((candidate) => currentVariants.some(
        (variant) => variant.size?.toLowerCase() === candidate.size?.toLowerCase() &&
          variant.color?.toLowerCase() === formData.color?.toLowerCase()
      ));
      if (duplicates.length) {
        toast.error(`Already exists for ${formData.color}: ${duplicates.map((variant) => variant.size).join(", ")}.`);
        return;
      }

      const newVariants = [
        ...currentVariants,
        ...variantsToAdd.map((variant) => ({
          size: variant.size,
          color: formData.color,
          colorHex: formData.colorHex,
          sku_suffix: variant.sku || formData.sku || null,
          stock_count: Number(variant.stockCount ?? formData.stockCount ?? 0),
          sales_count: Number(variant.salesCount ?? variant.sales_count ?? 0),
          price_override: variant.price ?? formData.price ?? null,
          original_price_override: variant.originalPrice ?? formData.originalPrice ?? null,
          image_url: variant.imageUrl || null,
          gallery_images: variant.galleryImages || [],
        })),
      ];

      try {
        await productsApi.saveVariants(targetProduct.id, newVariants);
        toast.success(`${variantsToAdd.length} ${formData.color} size variant${variantsToAdd.length === 1 ? "" : "s"} added successfully!`);
        setIsModalOpen(false);
        loadData();
      } catch (err) {
        toast.error(err.message || "Failed to add variant");
      }
    }
  }

  if (isLoading && products.length === 0) {
    return <LoadingState label="Loading Variants..." />;
  }

  return (
    <div className="v-page">
      {/* Top Header */}
      <div className="v-header-banner">
        <div className="v-header-left">
          <span className="v-eyebrow">PRODUCT VARIANTS</span>
          <div className="v-title-wrap">
            <span className="v-icon-symbol">
              <Layers size={26} color="var(--primary-text)" />
            </span>
            <h1 className="v-main-title">Variants</h1>
          </div>
        </div>

        <div className="v-header-actions">
          <div className="v-search-bar">
            <Search size={15} className="v-search-icon" />
            <input
              type="text"
              placeholder="Search variants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="v-search-input"
              aria-label="Search variants"
            />
            {searchQuery && (
              <button
                type="button"
                className="v-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="v-btn-primary"
            onClick={() => handleOpenAdd()}
          >
            <Plus size={16} />
            <span>Add Color / Size</span>
          </button>
        </div>
      </div>

      {/* Product List Header / Pagination Info */}
      <div className="v-pagination-bar-top">
        <span className="v-pagination-summary">
          Showing <strong>{totalProducts === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong>{totalProducts}</strong> products
        </span>
        {paginatedProducts.length > 0 && (
          <button
            type="button"
            className="v-btn-ghost-sm"
            onClick={handleToggleAll}
          >
            {allExpanded ? "Collapse All on Page" : "Expand All on Page"}
          </button>
        )}
      </div>

      {/* Product Cards */}
      <div className="v-cards-list">
        {paginatedProducts.length > 0 ? (
          paginatedProducts.map((prod, idx) => {
            const sourceVariants = prod.variants || [];
            const defaultVariantId = sourceVariants[0]?.id;
            const variants = sortNewestFirst(sourceVariants.map((variant, originalIndex) => ({ ...variant, originalIndex })));
            const expanded = isExpanded(prod.id, idx);

            return (
              <div
                key={prod.id}
                className={`v-prod-card ${
                  String(prod.id) === String(highlightProductId)
                    ? "is-highlighted"
                    : ""
                }`}
              >
                {/* Product Card Header */}
                <div
                  className="v-prod-header"
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
                  <div className="v-prod-header-left">
                    <button
                      type="button"
                      className="v-arrow-btn"
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
                      className="v-prod-avatar"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <h2 className="v-prod-title">{prod.name}</h2>
                  </div>

                  <div className="v-prod-header-right">
                    <button
                      type="button"
                      className="v-btn-add-variant-inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAdd(prod);
                      }}
                      title="Add a color and size combination to this product"
                    >
                      <Plus size={13} />
                      <span>Add Color / Size</span>
                    </button>
                    <span className="v-variants-count-badge">
                      {variants.length}{" "}
                      {variants.length === 1 ? "variant" : "variants"}{" "}
                      <span className="v-mini-chevron">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Variants Table */}
                {expanded && (
                  <div className="v-table-container">
                    {variants.length > 0 ? (
                      <table className="v-table">
                        <thead>
                          <tr>
                            <th className="v-th-sno">S.NO</th>
                            <th className="v-th-variant">VARIANT</th>
                            <th className="v-th-colorsize">COLOR / SIZE</th>
                            <th className="v-th-sku">SKU</th>
                            <th className="v-th-mrp">MRP</th>
                            <th className="v-th-price">SELLING PRICE</th>
                            <th className="v-th-stock">STOCK</th>
                            <th className="v-th-actions">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map(({ originalIndex, ...v }, vIdx) => {
                            const isDefault = defaultVariantId ? v.id === defaultVariantId : originalIndex === 0;
                            const sellingPrice = Number(
                              v.priceOverride ?? prod.price
                            );
                            const mrp = Number(v.originalPriceOverride ?? prod.originalPrice ?? 0);
                            const discountPct =
                              mrp > sellingPrice
                                ? Math.round(
                                    ((mrp - sellingPrice) / mrp) * 100
                                  )
                                : null;
                            const stockCount = Number(
                              v.stockCount ?? v.stock_count ?? 0
                            );
                            const isLowStock = stockCount > 0 && stockCount <= 5;
                            const isOutOfStock = stockCount === 0;
                            const fullSku =
                              v.skuSuffix || v.sku_suffix
                                ? `${prod.sku}-${v.skuSuffix || v.sku_suffix}`
                                : prod.sku;
                            const variantTitle =
                              v.color ||
                              (isDefault ? "Default" : `Variant ${vIdx + 1}`);

                            return (
                              <tr key={v.id || vIdx}>
                                <td className="v-cell-sno">{vIdx + 1}</td>

                                {/* VARIANT */}
                                <td>
                                  <div className="v-variant-info-cell">
                                    <img
                                      src={resolveImageUrl(
                                        v.imageUrl ||
                                          v.image_url ||
                                          prod.image ||
                                          prod.images?.[0]
                                      )}
                                      alt={variantTitle}
                                      className="v-variant-thumb"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <div className="v-variant-meta">
                                      <span className="v-variant-name">
                                        {variantTitle}
                                      </span>
                                      {isDefault && (
                                        <span className="v-badge-default">
                                          DEFAULT
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* COLOR / SIZE */}
                                <td>
                                  <div className="v-color-size-cell">
                                    <span
                                      className="v-color-dot"
                                      style={{
                                        backgroundColor:
                                          v.colorHex || "#181715",
                                      }}
                                    />
                                    <span className="v-color-size-label">
                                      {v.color || "Standard"} /{" "}
                                      {v.size || "Free Size"}
                                    </span>
                                  </div>
                                </td>

                                {/* SKU */}
                                <td>
                                  <span className="v-sku-tag">{fullSku}</span>
                                </td>

                                {/* MRP */}
                                <td className="v-cell-mrp">
                                  ₹{mrp.toLocaleString("en-IN")}
                                </td>

                                {/* SELLING PRICE */}
                                <td>
                                  <div className="v-price-cell">
                                    <span className="v-selling-val">
                                      ₹{sellingPrice.toLocaleString("en-IN")}
                                    </span>
                                    {discountPct && (
                                      <span className="v-discount-badge">
                                        -{discountPct}%
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* STOCK */}
                                <td style={{ textAlign: "center" }}>
                                  <span
                                    className={`v-stock-badge ${
                                      isOutOfStock
                                        ? "v-stock-out"
                                        : isLowStock
                                        ? "v-stock-low"
                                        : "v-stock-ok"
                                    }`}
                                  >
                                    {isOutOfStock
                                      ? "Out of Stock"
                                      : stockCount}
                                  </span>
                                </td>

                                {/* ACTIONS */}
                                <td style={{ textAlign: "right" }}>
                                  <div className="v-actions-group">
                                    <button
                                      type="button"
                                      className="v-btn-action-edit"
                                      onClick={() =>
                                        handleOpenEdit(prod, v, originalIndex)
                                      }
                                      title="Edit Variant"
                                    >
                                      <Edit2 size={13} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="v-btn-action-delete"
                                      onClick={() =>
                                        handleDeleteVariant(prod, v, originalIndex)
                                      }
                                      title="Delete Variant"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="v-empty-card">
                        <ImageIcon size={28} color="var(--text-subtle)" />
                        <p>No variants configured for this product yet.</p>
                        <button
                          type="button"
                          className="v-btn-primary v-btn-sm"
                          onClick={() => handleOpenAdd(prod)}
                        >
                          <Plus size={14} />
                          <span>Add First Variant</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="v-empty-state">
            <Layers size={40} color="var(--primary-text)" />
            <h3>No products found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="v-pagination-card">
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

      {/* Add / Edit Variant Modal */}
      {isModalOpen && (
        <VariantModal
          editingData={editingVariant}
          products={products}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveVariant}
        />
      )}

      <ConfirmModal />
    </div>
  );
}

/* ── Add / Edit Variant Modal ── */
function VariantModal({ editingData, products, onClose, onSave }) {
  const isEdit = Boolean(
    editingData && editingData.variantIdx !== undefined
  );

  const [productId, setProductId] = useState(
    editingData?.productId || String(products[0]?.id) || ""
  );

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId]
  );

  const [colorName, setColorName] = useState(
    editingData?.color || ""
  );
  const [colorHex, setColorHex] = useState(
    editingData?.colorHex || "#181715"
  );

  const [selectedSizes, setSelectedSizes] = useState(editingData?.size ? [editingData.size] : []);
  const [customSizeInput, setCustomSizeInput] = useState(editingData?.size || "");
  const [samePriceAndStock, setSamePriceAndStock] = useState(isEdit);
  const [sizeValues, setSizeValues] = useState({});
  const [sku, setSku] = useState(editingData?.sku || "");
  const [skuTouched, setSkuTouched] = useState(!!editingData?.sku);
  const [price, setPrice] = useState(
    editingData?.price !== undefined
      ? String(editingData.price)
      : selectedProduct
      ? String(selectedProduct.price)
      : "0"
  );
  const [originalPrice, setOriginalPrice] = useState(
    editingData?.originalPrice !== undefined
      ? String(editingData.originalPrice)
      : selectedProduct?.originalPrice != null
      ? String(selectedProduct.originalPrice)
      : ""
  );
  const [stockQty, setStockQty] = useState(
    editingData?.stockCount !== undefined
      ? String(editingData.stockCount)
      : "0"
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(editingData?.lowStockThreshold ?? 10)
  );
  const [gstRate, setGstRate] = useState(editingData?.gstRate || "5");

  // Variant Images: Front View + Back View + Gallery Thumbnails
  const [frontImage, setFrontImage] = useState(editingData?.imageUrl || "");
  const [backImage, setBackImage] = useState(
    (Array.isArray(editingData?.galleryImages) && editingData.galleryImages[0]) || ""
  );
  const [galleryImages, setGalleryImages] = useState(
    (Array.isArray(editingData?.galleryImages) && editingData.galleryImages.slice(1)) || []
  );
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const frontImgRef = useRef(null);
  const backImgRef = useRef(null);
  const galleryImgRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  // Auto-generate a size-specific SKU preview when product/color/size changes
  useEffect(() => {
    if (!skuTouched && selectedProduct) {
      const colorShort = (colorName || "DEF").substring(0, 3).toUpperCase();
      const sizeShort = (selectedSizes[0] || customSizeInput || "FS").replace(/\s+/g, "").toUpperCase();
      setSku(`${selectedProduct.sku}-${colorShort}-${sizeShort}`);
    }
  }, [selectedProduct, colorName, selectedSizes, customSizeInput, skuTouched]);

  // Update price when product changes (add mode only)
  useEffect(() => {
    if (!isEdit && selectedProduct) {
      setPrice(String(selectedProduct.price || "0"));
      setOriginalPrice(String(selectedProduct.originalPrice ?? ""));
    }
  }, [selectedProduct, isEdit]);

  function toggleSize(sizeOption) {
    if (errors.size) setErrors((previous) => ({ ...previous, size: undefined }));
    if (isEdit) {
      setSelectedSizes([sizeOption]);
      setCustomSizeInput(sizeOption);
      return;
    }
    setSelectedSizes((previous) => {
      const isSelected = previous.includes(sizeOption);
      let next = isSelected ? previous.filter((item) => item !== sizeOption) : [...previous, sizeOption];
      if (!isSelected) {
        if (sizeOption === "Free Size") next = ["Free Size"];
        else next = next.filter((item) => item !== "Free Size");
        setSizeValues((values) => ({ ...values, [sizeOption]: values[sizeOption] || { price, originalPrice, stockQty } }));
      }
      return next;
    });
  }

  function addCustomSize() {
    const value = customSizeInput.trim();
    if (!value) return;
    if (errors.size) setErrors((previous) => ({ ...previous, size: undefined }));
    const existing = selectedSizes.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!existing) {
      setSelectedSizes((previous) => isEdit ? [value] : [...previous.filter((item) => item !== "Free Size"), value]);
      setSizeValues((previous) => ({ ...previous, [value]: previous[value] || { price, originalPrice, stockQty } }));
    }
    setCustomSizeInput("");
  }

  function toggleSamePriceAndStock() {
    if (!samePriceAndStock) {
      const first = sizeValues[selectedSizes[0]];
      if (first) {
        setPrice(first.price);
        setOriginalPrice(first.originalPrice);
        setStockQty(first.stockQty);
      }
      setSamePriceAndStock(true);
      return;
    }
    setSizeValues((previous) => {
      const next = { ...previous };
      selectedSizes.forEach((item) => { next[item] = { price, originalPrice, stockQty }; });
      return next;
    });
    setSamePriceAndStock(false);
  }

  function updateSizeValue(sizeOption, field, value) {
    setSizeValues((previous) => ({
      ...previous,
      [sizeOption]: { ...(previous[sizeOption] || { price, originalPrice, stockQty }), [field]: value }
    }));
  }

  // Upload Front View image
  async function handleFrontImageUpload(files) {
    if (!files || files.length === 0) return;
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) {
      toast.error("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds 10MB. Please choose an image under 10MB.`);
      return;
    }
    setIsUploadingFront(true);
    try {
      const { data } = await uploadApi.upload("variants", [file]);
      const url = data.files?.[0]?.url || "";
      setFrontImage(url);
      toast.success("Variant Front View image uploaded!");
    } catch (err) {
      toast.error(err.message || "Failed to upload Front View image.");
    } finally {
      setIsUploadingFront(false);
      if (frontImgRef.current) frontImgRef.current.value = "";
    }
  }

  // Upload Back View image
  async function handleBackImageUpload(files) {
    if (!files || files.length === 0) return;
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) {
      toast.error("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds 10MB. Please choose an image under 10MB.`);
      return;
    }
    setIsUploadingBack(true);
    try {
      const { data } = await uploadApi.upload("variants", [file]);
      const url = data.files?.[0]?.url || "";
      setBackImage(url);
      toast.success("Variant Back View image uploaded!");
    } catch (err) {
      toast.error(err.message || "Failed to upload Back View image.");
    } finally {
      setIsUploadingBack(false);
      if (backImgRef.current) backImgRef.current.value = "";
    }
  }

  // Upload gallery images
  async function handleGalleryUpload(files) {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) return;
    const maxGallery = 10;
    const remaining = maxGallery - galleryImages.length;
    if (remaining <= 0) {
      toast.error("Maximum 10 gallery thumbnails allowed.");
      return;
    }
    setIsUploadingGallery(true);
    try {
      const { data } = await uploadApi.upload("variants", imageFiles.slice(0, remaining));
      const urls = (data.files || []).map((f) => f.url);
      setGalleryImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} gallery image(s) uploaded`);
    } catch (err) {
      toast.error(err.message || "Failed to upload gallery images");
    } finally {
      setIsUploadingGallery(false);
      if (galleryImgRef.current) galleryImgRef.current.value = "";
    }
  }

  function removeGalleryImage(idx) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
    toast.delete("Gallery thumbnail removed.");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!productId) newErrors.productId = "Please select a product";
    if (!colorName.trim()) newErrors.colorName = "Please enter the color name (e.g. Jet Black, Olive)";
    if (!selectedSizes.length || selectedSizes.some((item) => !item.trim())) newErrors.size = "Select or add at least one size.";

    const variantsToSave = selectedSizes.map((sizeOption) => {
      const values = !isEdit && !samePriceAndStock
        ? (sizeValues[sizeOption] || { price, originalPrice, stockQty })
        : { price, originalPrice, stockQty };
      const numPrice = Number(values.price);
      const numOriginal = Number(values.originalPrice);
      const numStock = Number(values.stockQty);
      if (!Number.isFinite(numPrice) || numPrice <= 0) newErrors.pricing = `Enter a sale price greater than zero for size ${sizeOption}.`;
      else if (!Number.isFinite(numOriginal) || numOriginal <= numPrice) newErrors.pricing = `MRP must be higher than sale price for size ${sizeOption}.`;
      if (!Number.isInteger(numStock) || numStock < 0) newErrors.pricing = `Enter a whole stock quantity (0 or more) for size ${sizeOption}.`;
      return { size: sizeOption, price: numPrice, originalPrice: numOriginal, stockCount: numStock };
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErr = newErrors.productId || newErrors.colorName || newErrors.size || newErrors.pricing;
      if (firstErr) toast.error(firstErr);
      const firstErrEl = document.querySelector(".v-field-error");
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const colorShort = (colorName || "DEF").substring(0, 3).toUpperCase();
    const variants = variantsToSave.map((variant) => {
      const sizeShort = variant.size.replace(/\s+/g, "").toUpperCase();
      const automaticSku = `${selectedProduct?.sku || "SKU"}-${colorShort}-${sizeShort}`;
      const customSku = skuTouched
        ? (variantsToSave.length > 1 ? `${sku.trim()}-${sizeShort}` : sku.trim())
        : automaticSku;
      return { ...variant, sku: customSku, imageUrl: frontImage || null, galleryImages: [backImage, ...galleryImages].filter(Boolean) };
    });

    if (variants.some((variant) => variant.galleryImages.length + (variant.imageUrl ? 1 : 0) > 12)) {
      toast.error("Maximum 12 images are allowed per variant.");
      return;
    }

    setIsSaving(true);
    onSave({
      productId,
      color: colorName.trim(),
      colorHex: colorHex || "#181715",
      size: variants[0]?.size || "",
      sku: variants[0]?.sku || sku.trim(),
      price: variants[0]?.price,
      originalPrice: variants[0]?.originalPrice,
      stockCount: variants[0]?.stockCount,
      variants: isEdit ? undefined : variants,
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
      gstRate,
      imageUrl: frontImage || null,
      galleryImages: [backImage, ...galleryImages].filter(Boolean),
    });
    setIsSaving(false);
  }

  const discountPreview =
    originalPrice &&
    price &&
    parseFloat(originalPrice) > parseFloat(price)
      ? Math.round(
          ((parseFloat(originalPrice) - parseFloat(price)) /
            parseFloat(originalPrice)) *
            100
        )
      : null;

  return (
    <div
      className="v-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit Variant" : "Add Color / Size Variant"}
    >
      <div
        className="v-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="v-modal-header">
          <div>
            <h2 className="v-modal-title">
              {isEdit ? "Edit Variant" : "Add Color / Size Variant"}
            </h2>
            {selectedProduct && (
              <p className="v-modal-subtitle">{selectedProduct.name}</p>
            )}
          </div>
          <button
            type="button"
            className="v-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="v-modal-form" noValidate>
          {/* Section: Basic Info */}
          <div className="v-modal-section">
            <h3 className="v-section-title">Basic Information</h3>

            {/* Product selector */}
            <div className="v-form-row-2">
              <div className="v-field-group">
                <label className="v-label" htmlFor="v-sel-product">
                  Product <span className="v-req">*</span>
                </label>
                <select
                  id="v-sel-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className={`v-input v-select ${errors.productId ? "is-invalid" : ""}`}
                  disabled={isEdit}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.productId && (
                  <span className="v-field-error">
                    <AlertCircle size={12} /> {errors.productId}
                  </span>
                )}
              </div>

              <div className="v-field-group">
                <label className="v-label">Audience</label>
                <div className="v-readonly-box">
                  {selectedProduct?.category
                    ? selectedProduct.category.charAt(0).toUpperCase() +
                      selectedProduct.category.slice(1)
                    : "—"}
                </div>
              </div>
            </div>

            {/* Color Name + Color Hex */}
            <div className="v-form-row-2">
              <div className="v-field-group">
                <label className="v-label" htmlFor="v-color-name">
                  Color Name <span className="v-req">*</span>
                </label>
                <div className="v-input-with-toggle">
                  {/* Live color swatch preview */}
                  <span
                    className="v-input-swatch"
                    style={{ backgroundColor: colorHex || "#181715" }}
                  />
                  <input
                    id="v-color-name"
                    type="text"
                    placeholder="Type any color name e.g. Jet Black, Cream White"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className={`v-input v-input-with-swatch ${errors.colorName ? "is-invalid" : ""}`}
                    required
                    autoComplete="off"
                  />
                </div>
                {errors.colorName && (
                  <span className="v-field-error">
                    <AlertCircle size={12} /> {errors.colorName}
                  </span>
                )}
              </div>

              <div className="v-field-group">
                <label className="v-label" htmlFor="v-color-hex">
                  Color Code
                </label>
                <div className="v-hex-picker-row">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="v-color-picker-input"
                    title="Click to pick color"
                    aria-label="Color picker"
                  />
                  <input
                    id="v-color-hex"
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="v-input"
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Size selection */}
            <div className="v-field-group">
              <label className="v-label">
                Size(s) <span className="v-req">*</span>
              </label>
              <div className="v-size-presets-bar">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`v-size-pill-btn ${selectedSizes.includes(s) ? "is-active" : ""}`}
                    aria-pressed={selectedSizes.includes(s)}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="v-custom-size-row">
                <input
                  type="text"
                  placeholder="Add custom size (e.g. 32, 34, 2XL)"
                  value={customSizeInput}
                  onChange={(e) => {
                    setCustomSizeInput(e.target.value);
                    if (isEdit) setSelectedSizes([e.target.value]);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                  className={`v-input ${errors.size ? "is-invalid" : ""}`}
                />
                <button type="button" className="v-btn-cancel" onClick={addCustomSize}>Add size</button>
              </div>
              {!!selectedSizes.length && <div className="v-selected-sizes">
                {selectedSizes.map((selectedSize) => (
                  <button key={selectedSize} type="button" onClick={() => toggleSize(selectedSize)} disabled={isEdit}>
                    {selectedSize}{!isEdit && <span>×</span>}
                  </button>
                ))}
              </div>}
              {errors.size && (
                <span className="v-field-error">
                  <AlertCircle size={12} /> {errors.size}
                </span>
              )}
            </div>

            {/* SKU */}
            <div className="v-field-group">
              <label className="v-label" htmlFor="v-input-sku">
                SKU (Unique Code) <span className="v-req">*</span>
              </label>
              <input
                id="v-input-sku"
                type="text"
                placeholder="e.g. TN-SG-001"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value.toUpperCase());
                  setSkuTouched(true);
                }}
                className={`v-input ${errors.sku ? "is-invalid" : ""}`}
              />
              {errors.sku && (
                <span className="v-field-error">
                  <AlertCircle size={12} /> {errors.sku}
                </span>
              )}
              <span className="v-field-hint">
                {selectedSizes.length > 1 ? "A size suffix is added to each variant SKU." : "Auto-generated from product, color, and size. Edit to customise."}
              </span>
            </div>
          </div>

          {/* Section: Pricing & Inventory */}
          <div className="v-modal-section">
            <h3 className="v-section-title">Pricing & Inventory</h3>

            {!isEdit && <label className="v-same-variant-check">
              <input type="checkbox" checked={samePriceAndStock} onChange={toggleSamePriceAndStock} />
              <span><strong>All selected sizes have the same MRP / Sale / Stock</strong><small>Uncheck to set price and stock for each size separately.</small></span>
            </label>}

            {(isEdit || samePriceAndStock) ? <>
              <div className="v-form-row-2">
                <div className="v-field-group">
                  <label className="v-label" htmlFor="v-input-price">Selling Price (?) <span className="v-req">*</span></label>
                  <input id="v-input-price" type="number" step="0.01" min="0.01" placeholder="Enter selling price" value={price}
                    onChange={(e) => { setPrice(e.target.value); setErrors((prev) => ({ ...prev, pricing: undefined })); }} className="v-input" />
                </div>
                <div className="v-field-group">
                  <label className="v-label" htmlFor="v-input-mrp">MRP / Original Price (?) <span className="v-req">*</span></label>
                  <input id="v-input-mrp" type="number" step="0.01" min="0.01" placeholder="Enter MRP" value={originalPrice}
                    onChange={(e) => { setOriginalPrice(e.target.value); setErrors((prev) => ({ ...prev, pricing: undefined })); }} className="v-input" />
                  {discountPreview && <span className="v-field-hint v-hint-success">{discountPreview}% off will be displayed</span>}
                </div>
              </div>
              <div className="v-form-row-2">
                <div className="v-field-group">
                  <label className="v-label" htmlFor="v-input-stock">Stock Quantity <span className="v-req">*</span></label>
                  <input id="v-input-stock" type="number" min="0" step="1" placeholder="0" value={stockQty}
                    onChange={(e) => { setStockQty(e.target.value); setErrors((prev) => ({ ...prev, pricing: undefined })); }} className="v-input" />
                </div>
                <div className="v-field-group">
                  <label className="v-label" htmlFor="v-input-threshold">Low Stock Alert (Qty)</label>
                  <input id="v-input-threshold" type="number" min="0" placeholder="10" value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)} className="v-input" />
                  <span className="v-field-hint">Alert when stock falls below this number</span>
                </div>
              </div>
            </> : <div className="v-size-pricing-list">
              {selectedSizes.map((sizeOption) => {
                const values = sizeValues[sizeOption] || { price, originalPrice, stockQty };
                const rowDiscount = Number(values.originalPrice) > Number(values.price)
                  ? Math.round(((Number(values.originalPrice) - Number(values.price)) / Number(values.originalPrice)) * 100)
                  : 0;
                return <div className="v-size-pricing-row" key={sizeOption}>
                  <strong>{sizeOption}</strong>
                  <label>MRP<input type="number" min="0.01" step="0.01" value={values.originalPrice} onChange={(e) => { updateSizeValue(sizeOption, "originalPrice", e.target.value); setErrors((prev) => ({ ...prev, pricing: undefined })); }} /></label>
                  <label>Sale price<input type="number" min="0.01" step="0.01" value={values.price} onChange={(e) => { updateSizeValue(sizeOption, "price", e.target.value); setErrors((prev) => ({ ...prev, pricing: undefined })); }} /></label>
                  <label>Stock<input type="number" min="0" step="1" value={values.stockQty} onChange={(e) => { updateSizeValue(sizeOption, "stockQty", e.target.value); setErrors((prev) => ({ ...prev, pricing: undefined })); }} /></label>
                  <span>{rowDiscount}% off</span>
                </div>;
              })}
            </div>}
            {errors.pricing && <span className="v-field-error v-pricing-error"><AlertCircle size={12} /> {errors.pricing}</span>}

            <div className="v-field-group v-gst-field">
              <label className="v-label" htmlFor="v-select-gst">GST Rate</label>
              <select id="v-select-gst" value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="v-input v-select">
                {GST_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="v-modal-section">
            <h3 className="v-section-title">Product Images</h3>
            <p className="v-section-desc">
              Upload photos for this color. The selected variant's front image, back image, and thumbnails appear on the product details page.
            </p>
            <div className="v-dual-views-row">
              <div className="v-view-card">
                <div className="v-view-card-header"><strong>Front View</strong><span className="v-view-badge">Main image</span></div>
                <input ref={frontImgRef} type="file" accept="image/*" hidden onChange={(e) => handleFrontImageUpload(e.target.files)} />
                <button type="button" className={`v-img-upload-box ${frontImage ? "has-image" : ""}`} onClick={() => frontImgRef.current?.click()} disabled={isUploadingFront} aria-label="Upload variant front image">
                  {frontImage ? <><img src={resolveImageUrl(frontImage)} alt="Variant front preview" className="v-img-preview" /> <span className="v-img-upload-overlay">{isUploadingFront ? "Uploading…" : "Change image"}</span></> : <span className="v-img-placeholder"><UploadCloud size={22} />{isUploadingFront ? "Uploading…" : "Upload Front View"}</span>}
                </button>
                {frontImage && <button type="button" className="v-image-clear" onClick={() => setFrontImage("")}>Remove front image</button>}
              </div>
              <div className="v-view-card">
                <div className="v-view-card-header"><strong>Back View</strong><span className="v-view-badge secondary">Secondary image</span></div>
                <input ref={backImgRef} type="file" accept="image/*" hidden onChange={(e) => handleBackImageUpload(e.target.files)} />
                <button type="button" className={`v-img-upload-box ${backImage ? "has-image" : ""}`} onClick={() => backImgRef.current?.click()} disabled={isUploadingBack} aria-label="Upload variant back image">
                  {backImage ? <><img src={resolveImageUrl(backImage)} alt="Variant back preview" className="v-img-preview" /> <span className="v-img-upload-overlay">{isUploadingBack ? "Uploading…" : "Change image"}</span></> : <span className="v-img-placeholder"><UploadCloud size={22} />{isUploadingBack ? "Uploading…" : "Upload Back View"}</span>}
                </button>
                {backImage && <button type="button" className="v-image-clear" onClick={() => setBackImage("")}>Remove back image</button>}
              </div>
            </div>
            <div className="v-gallery-block">
              <div className="v-gallery-header"><strong>Thumbnail Images</strong>
                <input ref={galleryImgRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleGalleryUpload(e.target.files)} />
                <button type="button" className="v-btn-add-gallery" onClick={() => galleryImgRef.current?.click()} disabled={isUploadingGallery || galleryImages.length >= 10}><Plus size={13} />{isUploadingGallery ? "Uploading…" : "Add thumbnails"}</button>
              </div>
              <div className="v-gallery-grid">
                {galleryImages.map((image, imageIdx) => <div className="v-gallery-thumb-wrap" key={`${image}-${imageIdx}`}><img src={resolveImageUrl(image)} alt={`Variant thumbnail ${imageIdx + 1}`} className="v-gallery-thumb" /><button type="button" className="v-gallery-remove-btn" aria-label={`Remove thumbnail ${imageIdx + 1}`} onClick={() => removeGalleryImage(imageIdx)}>×</button></div>)}
                {!galleryImages.length && <div className="v-gallery-empty"><ImageIcon size={20} /><span>No extra thumbnails uploaded</span></div>}
              </div>
            </div>
          </div>
          {/* Modal Footer */}
          <div className="v-modal-footer">
            <button
              type="button"
              className="v-btn-cancel"
              onClick={onClose}
              disabled={isSaving || isUploadingFront || isUploadingBack || isUploadingGallery}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="v-btn-primary"
              disabled={isSaving}
            >
              <Check size={16} />
              <span>{isEdit ? "Save Changes" : selectedSizes.length > 1 ? `Create ${selectedSizes.length} Variants` : "Create Variant"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
