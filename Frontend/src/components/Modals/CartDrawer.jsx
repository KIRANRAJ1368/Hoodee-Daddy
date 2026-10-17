import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import "./CartDrawer.css";

export default function CartDrawer() {
  const navigate = useNavigate();

  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartItemCount,
    cartSubtotal,
    shippingCost,
    isFreeShipping,
    freeShippingRemaining,
    freeShippingPercent,
    updateQuantity,
    removeFromCart,
    formatPrice,
    setAuthModalState,
    setPendingCheckout,
    isCustomerAuthenticated,
    setCheckoutIntent,
    beginCartCheckout,
    findProduct,
  } = useShop();

  if (!isCartOpen) return null;

  const handleProceedCheckout = () => {
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
      alert("Some items in your bag are currently out of stock. Please remove them before proceeding to checkout.");
      return;
    }
    if (!isCustomerAuthenticated) {
      setIsCartOpen(false);
      setCheckoutIntent("cart");
      setPendingCheckout(true);
      setAuthModalState("register");
      return;
    }
    beginCartCheckout(navigate);
  };

  return (
    <>
      <div className="drawer-backdrop active" onClick={() => setIsCartOpen(false)} />
      <div className="cart-drawer-panel active">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-title-row">
            <h2 className="cart-heading">Your Shopping Bag</h2>
            <span className="cart-items-count">({cartItemCount} items)</span>
          </div>
          <button
            className="drawer-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Pan-India Shipping Info */}
        <div className="free-shipping-bar">
          <div className="shipping-text">
            <span>
              🚚 <strong>Shiprocket Express Delivery</strong> across India
            </span>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-cart-icon">🛍️</div>
              <h3>Your bag is empty</h3>
              <p>Looks like you haven't added any luxury pieces yet.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsCartOpen(false)}
              >
                Discover Collection
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const liveProd = findProduct ? findProduct(item.id) : null;
              const liveVariant = liveProd?.variants?.find((v) =>
                (!v.color || v.color.toLowerCase() === (item.color || "").toLowerCase()) &&
                (!v.size || v.size.toLowerCase() === (item.size || "").toLowerCase())
              );
              const currentStock = liveVariant ? Number(liveVariant.stockCount ?? 0) : liveProd ? Number(liveProd.stockCount ?? 0) : item.maxStock ?? 99;
              const isOut = currentStock <= 0;
              const isLow = !isOut && currentStock <= 5;

              return (
                <div key={`${item.id}-${item.color}-${item.size}`} className="cart-item-card">
                  <img src={item.image} alt={item.name} className="cart-item-img" />

                  <div className="cart-item-info">
                    <div className="cart-item-head">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id, item.color, item.size)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>

                    <div className="cart-item-variant">
                      <span>Size: {item.size}</span>
                      <span>•</span>
                      <span>Color: {item.color}</span>
                      {isOut ? (
                        <span style={{ color: "#DC2626", fontWeight: 700, marginLeft: "auto", fontSize: "0.75rem" }}>Out of Stock</span>
                      ) : isLow ? (
                        <span style={{ color: "#D97706", fontWeight: 600, marginLeft: "auto", fontSize: "0.75rem" }}>Only {currentStock} left</span>
                      ) : null}
                    </div>
                    {item.sku && <div className="cart-item-sku">SKU: {item.sku}</div>}

                  <div className="cart-item-bottom">
                    <div className="qty-control-sm">
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.size, -1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.color, item.size, 1)}
                      >
                        +
                      </button>
                    </div>

                    <span className="cart-item-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* Footer & Order Summary */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Calculations Breakdown */}
            <div className="cart-summary-table">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Estimated Shipping</span>
                <span>
                  {formatPrice(shippingCost)}
                </span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{formatPrice(cartSubtotal + shippingCost)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              className="btn btn-primary btn-checkout"
              onClick={handleProceedCheckout}
            >
              <span>Proceed to Checkout</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

          </div>
        )}
      </div>
    </>
  );
}
