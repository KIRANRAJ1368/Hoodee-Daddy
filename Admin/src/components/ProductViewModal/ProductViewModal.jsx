import { useEffect, useState } from "react";
import { ImageIcon, Star, ZoomIn } from "lucide-react";
import Modal from "../Modal/Modal";
import LoadingState from "../LoadingState/LoadingState";
import StatusBadge from "../StatusBadge/StatusBadge";
import ImageLightboxModal from "../ImageLightboxModal/ImageLightboxModal";
import { resolveImageUrl } from "../../utils/imageUrl";
import { formatINR } from "../../utils/formatPrice";
import { productsApi, categoriesApi } from "../../services/resources";
import "./ProductViewModal.css";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function ProductViewModal({ product, productId, onClose }) {
  const [data, setData] = useState(product || null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(!product);
  const [error, setError] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    let active = true;
    if (!product) {
      productsApi
        .getById(productId)
        .then((res) => active && setData(res?.data || null))
        .catch((err) => active && setError(err.message || "Could not load product"))
        .finally(() => active && setIsLoading(false));
    }
    categoriesApi
      .list()
      .then((res) => active && setCategories(res?.data || []))
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (isLoading) {
    return (
      <Modal title="Product Details" onClose={onClose} width={840}>
        <LoadingState label="Loading product..." />
      </Modal>
    );
  }

  if (error || !data) {
    return (
      <Modal title="Product Details" onClose={onClose} width={560}>
        <div className="product-view-error">
          <p>{error || "Product not found."}</p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const categoryName =
    categories.find((c) => Number(c.id) === Number(data.categoryId))?.name ||
    data.category ||
    "—";

  // An MRP only means something when it is genuinely above the selling price;
  // anything else is a data-entry slip and must not be shown as a comparison.
  const hasDiscount =
    data.originalPrice !== null &&
    data.originalPrice !== undefined &&
    data.originalPrice !== "" &&
    Number(data.originalPrice) > Number(data.price);

  const discount = hasDiscount
    ? Math.round(((Number(data.originalPrice) - Number(data.price)) / Number(data.originalPrice)) * 100)
    : 0;

  const badges = [];
  if (data.isBestSeller) badges.push({ label: "Best Seller", className: "pv-badge-gold" });
  if (data.isNewArrival) badges.push({ label: "New Drop", className: "pv-badge-gold" });
  if (data.isSale) badges.push({ label: "On Sale", className: "pv-badge-red" });
  if (data.isNew) badges.push({ label: "New", className: "pv-badge-dark" });
  if (data.badge) badges.push({ label: data.badge, className: "pv-badge-blue" });

  const rating = Number(data.rating) || 0;

  return (
    <Modal title="Product Details" onClose={onClose} width={840}>
      <div className="product-view">
        {/* Header */}
        <div className="pv-header">
          <div className="pv-heading">
            <h2 className="pv-name">{data.name}</h2>
            <div className="pv-meta-line">
              <code>{data.sku}</code>
              {data.productType && (
                <>
                  <span className="pv-sep">•</span>
                  <span>{data.productType}</span>
                </>
              )}
            </div>
          </div>
          <div className="pv-status-col">
            <StatusBadge value={data.isActive ? "active" : "inactive"} />
            <StatusBadge
              value={data.inStock ? "in stock" : "out of stock"}
              label={data.inStock ? `${data.stockCount} in stock` : "Out of Stock"}
            />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="pv-badges">
            {badges.map((b, i) => (
              <span key={i} className={`pill-badge ${b.className}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        <div className="pv-grid">
          {/* Images */}
          <div className="pv-images">
            <div className="pv-section-label">
              Images <span className="pv-section-count">({data.images.length})</span>
            </div>
            {data.images.length > 0 ? (
              <div className="pv-image-grid">
                {data.images.map((src, i) => {
                  const resolved = resolveImageUrl(src);
                  return (
                    <div
                      className="pv-image-tile pv-image-clickable"
                      key={`${src}-${i}`}
                      onClick={() => setLightboxSrc(resolved)}
                      title="Click to view larger image"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setLightboxSrc(resolved)}
                    >
                      <img
                        src={resolved}
                        alt={`${data.name} ${i + 1}`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="pv-image-hover-hint">
                        <ZoomIn size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pv-no-images">
                <ImageIcon size={22} />
                <span>No images uploaded</span>
              </div>
            )}
          </div>

          {/* Pricing & attributes */}
          <div className="pv-details">
            <div className="pv-price-card">
              <div className="pv-price-row">
                <span className="pv-price-label">Selling Price</span>
                <span className="pv-price">{formatINR(data.price)}</span>
              </div>
              <div className="pv-price-row">
                <span className="pv-price-label">MRP</span>
                {hasDiscount ? (
                  <span className="pv-mrp">{formatINR(data.originalPrice)}</span>
                ) : (
                  <span className="pv-none">—</span>
                )}
              </div>
              <div className="pv-price-row">
                <span className="pv-price-label">Discount</span>
                {discount > 0 ? (
                  <span className="pv-discount">{discount}% OFF</span>
                ) : (
                  <span className="pv-none">—</span>
                )}
              </div>
            </div>

            <div className="pv-attr-list">
              <div className="pv-attr">
                <span className="pv-attr-label">Category</span>
                <span className="pv-attr-value">{categoryName}</span>
              </div>
              <div className="pv-attr">
                <span className="pv-attr-label">Product Type</span>
                <span className="pv-attr-value">{data.productType || "—"}</span>
              </div>
              <div className="pv-attr">
                <span className="pv-attr-label">Slug</span>
                <code className="pv-attr-code">{data.slug || "—"}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Colors & sizes */}
        <div className="pv-variants">
          <div className="pv-variant-block">
            <div className="pv-section-label">Colors</div>
            {data.colors.length > 0 ? (
              <div className="pv-chip-row">
                {data.colors.map((c, i) => (
                  <span className="pv-color-chip" key={`${c.name}-${i}`}>
                    <span className="pv-color-swatch" style={{ background: c.hex || c.hex_code || "#E2E8F0" }} />
                    {c.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="pv-none">—</span>
            )}
          </div>
          <div className="pv-variant-block">
            <div className="pv-section-label">Sizes</div>
            {data.sizes.length > 0 ? (
              <div className="pv-chip-row">
                {data.sizes.map((s, i) => (
                  <span className="pv-size-chip" key={`${s}-${i}`}>
                    {typeof s === "string" ? s : s?.label || s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="pv-none">—</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pv-desc">
          <div className="pv-section-label">Description</div>
          <p>{data.description || "No description provided."}</p>
        </div>

        {/* Footer meta */}
        <div className="pv-footer">
          <span className="pv-footer-item">
            Product ID: <strong>{data.id}</strong>
            <span className="pv-sep">•</span>
            <span className="pv-rating">
              <Star size={12} />
              {rating > 0 ? `${rating} (${data.reviewCount ?? 0} reviews)` : "No ratings yet"}
            </span>
          </span>
          <span className="pv-footer-item">
            Added {formatDate(data.createdAt)}
            {data.updatedAt ? ` • Updated ${formatDate(data.updatedAt)}` : ""}
          </span>
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightboxModal
          src={lightboxSrc}
          alt={data.name}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </Modal>
  );
}