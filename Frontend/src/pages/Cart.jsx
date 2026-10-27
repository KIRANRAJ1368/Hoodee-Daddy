import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { storefrontApi } from "../services/storefrontApi";
import { imageUrl } from "../utils/imageUrl";
import "./Cart.css";

/* ─────────────────────────────────────────────
   Inline SVG icons
───────────────────────────────────────────── */
const TrashIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

/* ─────────────────────────────────────────────
   HooDee Daddy Cart Page Component
───────────────────────────────────────────── */
export default function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    cartItemCount,
    cartSubtotal,
    shippingCost,
    updateQuantity,
    removeFromCart,
    clearCart,
    formatPrice,
    proceedToCheckout,
    isCustomerAuthenticated,
    setAuthModalState,
    setPendingCheckout,
    setCheckoutIntent,
    beginCartCheckout,
    findProduct,
  } = useShop();

  // Shiprocket Pincode Shipping Estimator State
  const [shippingPincode, setShippingPincode] = useState("");
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);
  const [shippingEstimateError, setShippingEstimateError] = useState("");

  const fetchShippingEstimate = async (cleanPin) => {
    if (!cleanPin || cleanPin.length !== 6) return;
    setShippingEstimateError("");
    setIsEstimatingShipping(true);
    try {
      const res = await storefrontApi.calculateShippingRate({
        pincode: cleanPin
      });
      const rate = res?.data?.is_serviceable !== undefined ? res.data : (res?.data || res);
      if (rate) {
        if (rate.is_serviceable && rate.shipping_fee !== null) {
          setShippingEstimate(rate);
          setShippingEstimateError("");
        } else {
          setShippingEstimate(null);
          setShippingEstimateError(rate.message || "This PIN code is not serviceable by Shiprocket.");
        }
      }
    } catch (err) {
      setShippingEstimate(null);
      setShippingEstimateError(err.message || "Failed to calculate shipping for this PIN code");
    } finally {
      setIsEstimatingShipping(false);
    }
  };

  const handleEstimateShipping = (e) => {
    e?.preventDefault();
    const cleanPin = shippingPincode.trim().replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setShippingEstimateError("Please enter a valid 6-digit PIN code");
      return;
    }
    fetchShippingEstimate(cleanPin);
  };

  useEffect(() => {
    const cleanPin = shippingPincode.trim().replace(/\D/g, "");
    if (cleanPin.length === 6) {
      fetchShippingEstimate(cleanPin);
    } else {
      setShippingEstimate(null);
      if (cleanPin.length === 0) setShippingEstimateError("");
    }
  }, [shippingPincode]);

  const handleProceedToCheckout = () => {
    const hasOutOfStock = cart.some((item) => {
      const liveProd = findProduct ? findProduct(item.id) : null;
      const liveVariant = liveProd?.variants?.find((v) =>
        (!v.color || v.color.toLowerCase() === (item.color || "").toLowerCase()) &&
        (!v.size || v.size.toLowerCase() === (item.size || "").toLowerCase())
      );
      const stock = liveVariant ? Number(liveVariant.stockCount ?? 0) : liveProd ? Number(liveProd.stockCount ?? 0) : item.maxStock ?? 99;
      return stock <= 0;
    });
    if (hasOutOfStock) {
      alert("Some items in your cart are currently out of stock. Please remove them before proceeding to checkout.");
      return;
    }
    beginCartCheckout(navigate, {
      pincode: shippingPincode.trim().length === 6 ? shippingPincode.trim() : undefined
    });
  };

  /* ─── EMPTY STATE ─── */
  if (cart.length === 0) {
    return (
      <div className="cp-page">
        <div className="container">
          <div className="cp-header-center">
            <h1 className="cp-page-main-title">Your Shopping Cart</h1>
            <p className="cp-page-sub-title">REVIEW YOUR SELECTED ITEMS</p>
          </div>

          <div className="cp-empty">
            <div className="cp-empty-inner">
              <div className="cp-empty-icon" aria-hidden="true">
                <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>

              <h2 className="cp-empty-title">Your cart is empty</h2>
              <p className="cp-empty-subtitle">
                Looks like you haven't added anything to your bag yet.<br />
                Explore our heavyweight hoodies, co-ords, and kids everyday streetwear.
              </p>

              <Link to="/collection" className="cp-empty-cta">
                Start Shopping <ArrowRightIcon />
              </Link>

              <div className="cp-empty-links">
                <span className="cp-empty-links-label">POPULAR CATEGORIES</span>
                <div className="cp-empty-chips">
                  <Link to="/collection?category=kids-hoodies" className="cp-chip">Kids Hoodies</Link>
                  <Link to="/collection?category=kids-pyjamas" className="cp-chip">Kids Pyjamas</Link>
                  <Link to="/collection?category=kids-co-ords" className="cp-chip">Kids Co-Ords</Link>
                  <Link to="/collection?category=boys-fashion" className="cp-chip">Boys Fashion</Link>
                  <Link to="/collection?category=girls-fashion" className="cp-chip">Girls Fashion</Link>
                  <Link to="/collection?collection=new-arrivals" className="cp-chip">New Arrivals 🔥</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── POPULATED CART ─── */
  return (
    <div className="cp-page">
      <div className="container">
        {/* 1. Page Header (Centered) */}
        <header className="cp-header-center">
          <h1 className="cp-page-main-title">Your Shopping Cart</h1>
          <p className="cp-page-sub-title">REVIEW YOUR SELECTED ITEMS</p>
        </header>

        {/* 2. Main Content Area (Two-Column Desktop) */}
        <div className="cp-layout">

          {/* ════════════════════════════════
              LEFT SIDE — Cart Items
          ════════════════════════════════ */}
          <div className="cp-items-col">

            {/* Meta Row: Item count on left, CLEAR CART on right */}
            <div className="cp-items-meta-row">
              <span className="cp-items-meta-text">
                {cart.length} {cart.length === 1 ? "item" : "items"} • {cartItemCount} total {cartItemCount === 1 ? "unit" : "units"}
              </span>
              <button
                type="button"
                className="cp-clear-cart-link"
                onClick={clearCart}
              >
                CLEAR CART
              </button>
            </div>

            {/* Cart Product Cards List */}
            <div className="cp-cards-list">
              {cart.map((item) => {
                const key = `${item.id}-${item.color}-${item.size}`;
                const lineTotal = item.price * item.quantity;
                const isLinkable = Boolean(item.id && !String(item.id).startsWith("zmw-") && !String(item.id).startsWith("hd-legacy-"));
                const liveProd = findProduct ? findProduct(item.id) : null;
                const liveVariant = liveProd?.variants?.find((v) =>
                  (!v.color || v.color.toLowerCase() === (item.color || "").toLowerCase()) &&
                  (!v.size || v.size.toLowerCase() === (item.size || "").toLowerCase())
                );
                const currentStock = liveVariant ? Number(liveVariant.stockCount ?? 0) : liveProd ? Number(liveProd.stockCount ?? 0) : item.maxStock ?? 99;
                const isOut = currentStock <= 0;
                const isLow = !isOut && currentStock <= 5;

                return (
                  <article className="cp-cart-card" key={key}>
                    {/* Product image on left */}
                    <div
                      className={`cp-card-img-wrap${isLinkable ? " --clickable" : ""}`}
                      onClick={() => isLinkable && navigate(`/product/${item.id}`)}
                      role={isLinkable ? "button" : undefined}
                      tabIndex={isLinkable ? 0 : undefined}
                      aria-label={isLinkable ? `View ${item.name}` : undefined}
                      onKeyDown={(e) => {
                        if (isLinkable && (e.key === "Enter" || e.key === " ")) {
                          navigate(`/product/${item.id}`);
                        }
                      }}
                    >
                      <img
                        src={imageUrl(item.image) || "/images/photo-1521572163474-6864f9cf17ab.jpg"}
                        alt={item.name}
                        className="cp-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/photo-1521572163474-6864f9cf17ab.jpg";
                        }}
                      />
                    </div>

                    {/* Product Details & Controls */}
                    <div className="cp-card-content">
                      {/* Product Name + Delete/Trash Icon */}
                      <div className="cp-card-top-row">
                        <h3 className="cp-card-title">
                          {isLinkable ? (
                            <Link to={`/product/${item.id}`}>{item.name}</Link>
                          ) : (
                            item.name
                          )}
                        </h3>
                        <button
                          type="button"
                          className="cp-card-delete-btn"
                          onClick={() => removeFromCart(item.id, item.color, item.size)}
                          title="Remove item"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      {/* Selected Color & Size */}
                      <div className="cp-card-variants">
                        {item.color && item.color !== "Standard" && (
                          <span className="cp-var-item">Color: <strong>{item.color}</strong></span>
                        )}
                        {item.color && item.color !== "Standard" && item.size && item.size !== "Standard" && (
                          <span className="cp-var-sep"> | </span>
                        )}
                        {item.size && item.size !== "Standard" && (
                          <span className="cp-var-item">Size: <strong>{item.size}</strong></span>
                        )}
                      </div>

                      {/* SKU (Discrete subtitle) */}
                      {item.sku && (
                        <div className="cp-card-sku">SKU: {item.sku}</div>
                      )}

                      {/* Stock Status */}
                      <div className={`cp-card-stock ${isOut ? "cp-stock--out" : isLow ? "cp-stock--low" : ""}`}>
                        <span className="cp-stock-dot">●</span>{" "}
                        {isOut
                          ? "Out of stock"
                          : isLow
                          ? `Low stock (${currentStock} left)`
                          : "In stock"}
                      </div>

                      {/* Bottom row: Quantity Selector on left, Pricing on right */}
                      <div className="cp-card-bottom-row">
                        {/* Quantity Selector: −   1   + */}
                        <div className="cp-stepper-box" aria-label="Quantity selector">
                          <button
                            type="button"
                            className="cp-step-btn"
                            onClick={() => updateQuantity(item.id, item.color, item.size, -1)}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className="cp-step-num" aria-live="polite">{item.quantity}</span>
                          <button
                            type="button"
                            className="cp-step-btn"
                            onClick={() => updateQuantity(item.id, item.color, item.size, 1)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>

                        {/* Price Display */}
                        <div className="cp-card-price-box">
                          {/* Original / MRP price with strikethrough if available */}
                          {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                            <span className="cp-card-orig-price">
                              {formatPrice(item.originalPrice * item.quantity)}
                            </span>
                          )}
                          {/* Current selling price */}
                          <span className="cp-card-current-price">
                            {formatPrice(lineTotal)}
                          </span>
                          {/* Price per item if quantity > 1 */}
                          {item.quantity > 1 && (
                            <span className="cp-card-unit-price">
                              {formatPrice(item.price)} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Bottom Continue Shopping Link */}
            <div className="cp-items-bottom-action">
              <Link to="/collection?category=mens" className="cp-continue-shopping-link">
                <ArrowLeftIcon />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ════════════════════════════════
              RIGHT SIDE — ORDER SUMMARY
          ════════════════════════════════ */}
          <aside className="cp-summary-col" aria-label="Order Summary">
            <div className="cp-summary-card">
              <h2 className="cp-summary-heading">ORDER SUMMARY</h2>

              {/* Summary Rows */}
              <div className="cp-summary-rows">
                <div className="cp-summary-row">
                  <span className="cp-sr-label">Items ({cart.length})</span>
                  <span className="cp-sr-value">{cartItemCount} {cartItemCount === 1 ? "unit" : "units"}</span>
                </div>

                <div className="cp-summary-row">
                  <span className="cp-sr-label">Subtotal</span>
                  <span className="cp-sr-value">{formatPrice(cartSubtotal)}</span>
                </div>

                <div className="cp-summary-row">
                  <span className="cp-sr-label">
                    Estimated Shipping {shippingEstimate?.courier_name ? `(${shippingEstimate.courier_name})` : "(Shiprocket)"}
                  </span>
                  <span className="cp-sr-value --shipping-val">
                    {isEstimatingShipping ? (
                      "Calculating..."
                    ) : shippingEstimate ? (
                      formatPrice(shippingEstimate.shipping_fee)
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                <div className="cp-summary-row">
                  <span className="cp-sr-label">Estimated Taxes</span>
                  <span className="cp-sr-value">Calculated at checkout</span>
                </div>

              </div>

              {/* Shiprocket Pincode Shipping Estimator */}
              <div className="cp-pincode-estimator-box">
                <div className="cp-estimator-box-title">ESTIMATE SHIPPING BY PIN CODE</div>
                <form onSubmit={handleEstimateShipping} className="cp-estimator-form">
                  <div className="cp-estimator-input-wrap">
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="ENTER 6-DIGIT PIN CODE"
                      value={shippingPincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setShippingPincode(val);
                        if (shippingEstimateError) setShippingEstimateError("");
                      }}
                      className="cp-estimator-input"
                      aria-label="Delivery PIN code"
                    />
                    <button
                      type="submit"
                      disabled={isEstimatingShipping || shippingPincode.length !== 6}
                      className="cp-estimator-apply-btn"
                    >
                      {isEstimatingShipping ? "..." : "ESTIMATE"}
                    </button>
                  </div>
                  {shippingEstimateError && <p className="cp-estimator-error">{shippingEstimateError}</p>}
                  {shippingEstimate && (
                    <div className="cp-estimator-result">
                      <div className="cp-estimator-result-header">
                        <span className="cp-estimator-badge">✓ {shippingEstimate.courier_name || "Shiprocket Express"}</span>
                      </div>
                      <p className="cp-estimator-fee-line">
                        Shipping Charge: <strong>{formatPrice(shippingEstimate.shipping_fee)}</strong>
                      </p>
                    </div>
                  )}
                </form>
              </div>

              {/* Divider */}
              <div className="cp-summary-divider" />

              {/* Grand Total */}
              <div className="cp-grand-total-row">
                <span className="cp-grand-total-label">Grand Total</span>
                <span className="cp-grand-total-value">
                  {formatPrice(
                    Math.max(
                      0,
                      cartSubtotal +
                        (shippingEstimate !== null
                          ? shippingEstimate.shipping_fee
                          : shippingCost)
                    )
                  )}
                </span>
              </div>
              <p className="cp-tax-inclusive-note">Inclusive of all taxes</p>

              {/* Primary Button: PROCEED TO CHECKOUT → */}
              <button
                type="button"
                className="cp-checkout-btn"
                onClick={handleProceedToCheckout}
              >
                PROCEED TO CHECKOUT &rarr;
              </button>
            </div>
          </aside>

        </div>{/* end cp-layout */}
      </div>{/* end container */}
    </div>
  );
}
