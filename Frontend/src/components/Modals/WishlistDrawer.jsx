import React from "react";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import "./WishlistDrawer.css";

export default function WishlistDrawer() {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    findProduct,
    toggleWishlist,
    moveToCartFromWishlist,
    formatPrice,
    addToCart,
    setAuthModalState,
    setPendingCheckout,
    isCustomerAuthenticated
  } = useShop();

  if (!isWishlistOpen) return null;

  const wishlistProducts = wishlist.map((id) => findProduct(id)).filter(Boolean);

  const handleMoveAllToBag = () => {
    wishlistProducts
      .filter((p) => p.inStock && (p.stockCount === undefined || Number(p.stockCount) > 0) && p.stockStatus !== "out_of_stock")
      .forEach((p) => {
        addToCart(p);
        toggleWishlist(p.id);
      });
  };

  const handleCheckout = () => {
    setIsWishlistOpen(false);
    if (!isCustomerAuthenticated) {
      setPendingCheckout(true);
      setAuthModalState("register");
      return;
    }
    window.location.href = "/cart";
  };

  return (
    <>
      <div className="drawer-backdrop active" onClick={() => setIsWishlistOpen(false)} />
      <div className="wishlist-drawer-panel active">
        {/* Header */}
        <div className="wishlist-drawer-header">
          <div className="wishlist-title-row">
            <h2 className="wishlist-heading">Saved Pieces</h2>
            <span className="wishlist-count">({wishlistProducts.length} saved)</span>
          </div>
          <button
            className="drawer-close-btn"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Close wishlist"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="wishlist-items-container">
          {wishlistProducts.length === 0 ? (
            <div className="wishlist-empty-state">
              <div className="empty-wishlist-icon">❤️</div>
              <h3>Your wishlist is empty</h3>
              <p>Save pieces you love to revisit or purchase later.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsWishlistOpen(false)}
              >
                Explore Lookbook
              </button>
            </div>
          ) : (
            wishlistProducts.map((item) => {
              const isOut = !item.inStock || (item.stockCount !== undefined && Number(item.stockCount) <= 0) || item.stockStatus === "out_of_stock";
              return (
                <div key={item.id} className="wishlist-item-card">
                  <img
                    src={imageUrl(item.images?.[0] || item.image)}
                    alt={item.name}
                    className="wishlist-item-img"
                    onError={(e) => { e.currentTarget.src = "/images/zmw-logo-transparent.png"; }}
                  />

                  <div className="wishlist-item-info">
                    <div className="wishlist-item-head">
                      <h4 className="wishlist-item-name">{item.name}</h4>
                      <button
                        className="wishlist-item-remove"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(item.id);
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                        }}
                        title="Remove from saved"
                        aria-label="Remove from saved"
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0" }}>
                      <span className="wishlist-item-price">{formatPrice(item.price)}</span>
                      {isOut && (
                        <span style={{ color: "#DC2626", fontSize: "0.72rem", fontWeight: 700 }}>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <div className="wishlist-item-actions">
                      <button
                        className="btn btn-primary btn-xs"
                        disabled={isOut}
                        style={isOut ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                        onClick={(e) => {
                          if (isOut) return;
                          e.preventDefault();
                          e.stopPropagation();
                          moveToCartFromWishlist(item.id);
                        }}
                        onTouchEnd={(e) => {
                          if (isOut) return;
                          e.stopPropagation();
                        }}
                      >
                        {isOut ? "Sold Out" : "+ Move to Bag"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {wishlistProducts.length > 0 && (
          <div className="wishlist-drawer-footer">
            <button className="btn btn-primary btn-sm" style={{ width: "100%", marginBottom: 8 }} onClick={handleCheckout}>Go to cart & checkout</button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: "100%" }}
              onClick={handleMoveAllToBag}
            >
              Move All to Bag ({wishlistProducts.length})
            </button>
          </div>
        )}
      </div>
    </>
  );
}
