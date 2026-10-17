import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { storefrontApi } from "../services/storefrontApi";
import InvoiceModal from "../components/Modals/InvoiceModal";
import { imageUrl } from "../utils/imageUrl";
import { isValidPhone, cleanPhoneInput, isNonEmpty } from "../utils/validators";
import "./CustomerProfile.css";

const STATUS_BADGES = {
  pending: { label: "Order Placed", color: "var(--color-accent, #FAA703)", bg: "#FFFBEB" },
  confirmed: { label: "Confirmed", color: "#2563EB", bg: "#EFF6FF" },
  packed: { label: "Packed", color: "#7C3AED", bg: "#F5F3FF" },
  shipped: { label: "In Transit", color: "#D97706", bg: "#FFFBEB" },
  delivered: { label: "Delivered", color: "#059669", bg: "#ECFDF5" },
  cancelled: { label: "Cancelled", color: "#DC2626", bg: "#FEF2F2" },
  returned: { label: "Returned", color: "#4B5563", bg: "#F3F4F6" }
};

const RETURN_REASONS = [
  "Defective / Damaged Piece",
  "Size Mismatch",
  "Fabric Quality",
  "Defective Print",
  "Color Different",
  "Other"
];

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found better price / alternative",
  "Changed mind",
  "Delivery time too long",
  "Incorrect shipping address",
  "Other"
];

export default function CustomerProfile() {
  const {
    customerUser,
    customerToken,
    logoutCustomer,
    setAuthModalState,
    addToast,
    formatPrice
  } = useShop();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'profile' | 'addresses'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewSaving, setReviewSaving] = useState(false);

  // Cancellation & Return workflow states
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [actionType, setActionType] = useState("pre_pack"); // pre_pack | in_transit | post_delivery
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComments, setCancelComments] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [profileError, setProfileError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setFormData({
        name: customerUser.name || "",
        email: customerUser.email || "",
        phone: customerUser.phone ? cleanPhoneInput(customerUser.phone) : ""
      });
      if (!accountHolder) {
        setAccountHolder(customerUser.name || "");
      }
    }
  }, [customerUser]);

  const loadOrders = async (isSilent = false) => {
    if (!customerToken) {
      setLoadingOrders(false);
      return;
    }

    if (!isSilent) setLoadingOrders(true);
    setOrdersError("");
    try {
      const data = await storefrontApi.getMyOrders(customerToken);
      setOrders(Array.isArray(data) ? data : []);
      setOrdersError("");
    } catch (err) {
      console.warn("Orders fetch notice:", err.message);
      // Auto-retry silently once after 1.2s to handle any transient delay
      setTimeout(async () => {
        try {
          const retryData = await storefrontApi.getMyOrders(customerToken);
          setOrders(Array.isArray(retryData) ? retryData : []);
          setOrdersError("");
        } catch (_) {
          // Gracefully maintain state without crashing
        }
      }, 1200);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [customerToken]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!customerToken) return;
    setProfileError("");

    if (!isNonEmpty(formData.name)) {
      setProfileError("Full Name is required.");
      return;
    }
    if (!isNonEmpty(formData.phone)) {
      setProfileError("Mobile Phone is required.");
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setProfileError("Phone number must be exactly 10 digits.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await storefrontApi.updateCustomerProfile(
        {
          name: formData.name.trim(),
          phone: formData.phone.trim()
        },
        customerToken
      );

      if (res?.user) {
        addToast("Profile updated successfully ✨", "success");
      }
    } catch (err) {
      const msg = err.message || "Failed to update profile";
      setProfileError(msg);
      addToast(msg, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const reloadOrders = async () => {
    const data = await storefrontApi.getMyOrders(customerToken);
    setOrders(data || []);
  };

  const saveItemReview = async (e) => {
    e.preventDefault();
    if (!reviewTarget || !customerToken) return;
    if (!reviewForm.comment || reviewForm.comment.trim().length < 5) {
      addToast("Review comment must be at least 5 characters.", "error");
      return;
    }
    setReviewSaving(true);
    try {
      const imageUrls = reviewImages.length ? await storefrontApi.uploadReviewImages(reviewImages, customerToken) : [];
      await storefrontApi.submitProductReview(reviewTarget.product_id, {
        order_item_id: reviewTarget.id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title,
        comment: reviewForm.comment.trim(),
        image_urls: imageUrls
      }, customerToken);
      await reloadOrders();
      setReviewTarget(null);
      setReviewImages([]);
      addToast("Review submitted. It will appear after admin approval.", "success");
    } catch (err) {
      addToast(err.message || "Could not submit review", "error");
    } finally {
      setReviewSaving(false);
    }
  };

  const editItemReview = async (item) => {
    if (!item.review) return;
    const rating = window.prompt("Rating (1–5)", String(item.review.rating));
    if (rating === null) return;
    const comment = window.prompt("Review", item.review.comment || "");
    if (comment === null) return;
    try {
      await storefrontApi.updateProductReview(item.product_id, item.review.id, { rating: Number(rating), title: item.review.title || "", comment, image_urls: item.review.image_urls || [] }, customerToken);
      await reloadOrders();
      addToast("Review updated and sent for approval.", "success");
    } catch (err) {
      addToast(err.message || "Could not update review", "error");
    }
  };

  const deleteItemReview = async (item) => {
    if (!item.review || !window.confirm("Delete this review?")) return;
    try {
      await storefrontApi.deleteProductReview(item.product_id, item.review.id, customerToken);
      await reloadOrders();
      addToast("Review deleted.", "success");
    } catch (err) {
      addToast(err.message || "Could not delete review", "error");
    }
  };

  const openActionModal = (order, type) => {
    setCancelModalOrder(order);
    setActionType(type);
    setCancelReason(type === "post_delivery" ? RETURN_REASONS[0] : CANCEL_REASONS[0]);
    setCancelComments("");
    setPhotoFiles([]);
    setVideoFile(null);
    setAccountHolder(customerUser?.name || order.customer_name || "");
    setUpiId(order.refund_upi_id || "");
  };

  const handleConfirmCancel = async (e) => {
    if (e) e.preventDefault();
    if (!cancelModalOrder || !customerToken) return;
    if (!cancelReason) {
      addToast("Please select a reason.", "error");
      return;
    }
    if (actionType === "post_delivery" && (!cancelComments || !cancelComments.trim())) {
      addToast("Detailed explanation is required for returns.", "error");
      return;
    }
    setIsCancelling(true);
    try {
      let return_images = [];
      let return_video_url = null;

      // If post_delivery, upload media files first
      if (actionType === "post_delivery") {
        const uploadQueue = [];
        if (photoFiles.length > 0) uploadQueue.push(...photoFiles);
        if (videoFile) uploadQueue.push(videoFile);

        if (uploadQueue.length > 0) {
          const uploadedUrls = await storefrontApi.uploadReturnProof(uploadQueue, customerToken);
          if (videoFile && uploadedUrls.length > 0) {
            return_video_url = uploadedUrls[uploadedUrls.length - 1];
            return_images = uploadedUrls.slice(0, uploadedUrls.length - 1);
          } else {
            return_images = uploadedUrls;
          }
        }
      }

      const res = await storefrontApi.requestCancellation(
        cancelModalOrder.id,
        {
          cancellation_type: actionType,
          reason: cancelReason,
          comments: cancelComments.trim() || undefined,
          refund_upi_id: upiId.trim() || undefined,
          refund_account_holder: accountHolder.trim() || undefined,
          return_images,
          return_video_url
        },
        customerToken
      );

      addToast(
        actionType === "post_delivery"
          ? "Return request submitted! Reverse pickup will be scheduled."
          : res.message || "Cancellation request submitted successfully.",
        "success"
      );

      const updated = await storefrontApi.getMyOrders(customerToken);
      setOrders(updated || []);
      setCancelModalOrder(null);
      setCancelReason("");
      setCancelComments("");
      setPhotoFiles([]);
      setVideoFile(null);
    } catch (err) {
      addToast(err.message || "Failed to submit request.", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!customerUser) {
    return (
      <div className="account-unauth-container">
        <div className="account-unauth-box">
          <span className="account-kicker">ZMW CLOTHING</span>
          <h1 className="account-unauth-title">Customer Account</h1>
          <p className="account-unauth-desc">
            Sign in to track orders, manage your shipping addresses, and experience seamless luxury shopping.
          </p>
          <div className="account-unauth-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAuthModalState("login")}
            >
              Sign In to Your Account
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAuthModalState("register")}
            >
              Create An Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page-wrapper">
      {/* Account Hero Bar */}
      <div className="account-hero">
        <div className="account-hero-content">
          <span className="account-kicker">MEMBER PORTAL</span>
          <h1 className="account-hero-title">Welcome, {customerUser.name}</h1>
          <p className="account-hero-email">{customerUser.email}</p>
        </div>
        <button
          type="button"
          className="account-logout-btn"
          onClick={() => {
            logoutCustomer();
            navigate("/");
          }}
        >
          Sign Out
        </button>
      </div>

      <div className="account-layout">
        {/* Navigation Sidebar */}
        <aside className="account-sidebar">
          <button
            type="button"
            className={`account-nav-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="nav-icon">📦</span>
            <span>My Orders</span>
            {orders.length > 0 && <span className="nav-badge">{orders.length}</span>}
          </button>
          <button
            type="button"
            className={`account-nav-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="nav-icon">👤</span>
            <span>Account Details</span>
          </button>
          <button
            type="button"
            className={`account-nav-btn ${activeTab === "addresses" ? "active" : ""}`}
            onClick={() => setActiveTab("addresses")}
          >
            <span className="nav-icon">📍</span>
            <span>Delivery Addresses</span>
          </button>
        </aside>

        {/* Tab Content */}
        <main className="account-content">
          {/* TAB 1: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Order History</h2>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="pane-subtitle">
                    {orders.length} {orders.length === 1 ? "order" : "orders"} placed
                  </span>
                  {!loadingOrders && (
                    <button
                      type="button"
                      className="pane-reload-btn"
                      onClick={() => loadOrders()}
                      title="Refresh orders"
                    >
                      🔄 Refresh
                    </button>
                  )}
                </div>
              </div>

              {loadingOrders ? (
                <div className="orders-skeleton-list" aria-busy="true">
                  {[1, 2, 3].map((sKey) => (
                    <div key={sKey} className="order-card order-card--skeleton">
                      <div className="order-card-header">
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <div className="order-skeleton-bar order-skeleton-bar--num sk" />
                          <div className="order-skeleton-bar order-skeleton-bar--date sk" />
                        </div>
                        <div className="order-skeleton-bar order-skeleton-bar--badge sk" />
                      </div>
                      <div className="order-card-body">
                        <div className="order-items-col">
                          <div className="order-item-row">
                            <div className="order-skeleton-thumb sk" />
                            <div className="order-item-details" style={{ flex: 1 }}>
                              <div className="order-skeleton-bar order-skeleton-bar--title sk w3" />
                              <div className="order-skeleton-bar order-skeleton-bar--meta sk w1" />
                              <div className="order-skeleton-bar order-skeleton-bar--price sk w2" />
                            </div>
                          </div>
                        </div>
                        <div className="order-summary-col">
                          <div className="order-skeleton-bar order-skeleton-bar--total-lbl sk" />
                          <div className="order-skeleton-bar order-skeleton-bar--total-val sk" />
                          <div className="order-skeleton-actions">
                            <div className="order-skeleton-bar order-skeleton-btn sk" />
                            <div className="order-skeleton-bar order-skeleton-btn sk" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-orders-view">
                  <div className="empty-icon">🛍️</div>
                  <h3>No Orders Yet</h3>
                  <p>You haven't placed any orders yet. Discover our curated collections.</p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
                    <Link to="/collection" className="btn btn-primary">
                      Explore Catalog
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => loadOrders()}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order, orderIdx) => {
                    const statusMeta = STATUS_BADGES[order.status] || {
                      label: order.status,
                      color: "#111827",
                      bg: "#F3F4F6"
                    };

                    const orderDate = new Date(order.createdAt || order.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }
                    );

                    return (
                      <div
                        key={order.id}
                        className="order-card fade"
                        style={{ animationDelay: `${orderIdx * 90}ms` }}
                      >
                        <div className="order-card-header">
                          <div className="order-info-group">
                            <span className="order-number">{order.order_number}</span>
                            <span className="order-date">Placed on {orderDate}</span>
                          </div>
                          <div className="order-status-group">
                            <span
                              className="order-status-badge"
                              style={{ color: statusMeta.color, backgroundColor: statusMeta.bg }}
                            >
                              ● {statusMeta.label}
                            </span>
                            {order.shipping_status && <small style={{ display: "block", textTransform: "capitalize", color: "#64748b", marginTop: 5 }}>{order.shipping_status.replace(/_/g, " ")}</small>}
                          </div>
                        </div>

                        <div className="order-card-body">
                          {/* Line Items */}
                          <div className="order-items-col">
                            {order.items &&
                              order.items.map((item) => (
                                <div key={item.id} className="order-item-row">
                                  <div className="order-item-thumb">
                                    {item.image_url || item.product?.images?.[0]?.url ? (
                                      <img
                                        src={imageUrl(item.image_url || item.product.images[0].url)}
                                        alt={item.product_name_snapshot}
                                      />
                                    ) : (
                                      <div className="thumb-placeholder">ZMW</div>
                                    )}
                                  </div>
                                  <div className="order-item-details">
                                    <h4 className="item-title">{item.product_name_snapshot}</h4>
                                    <div className="item-meta">
                                      {item.size && <span>Size: {item.size}</span>}
                                      {item.color && <span>Color: {item.color}</span>}
                                      {item.sku_snapshot && <span>SKU: {item.sku_snapshot}</span>}
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                    <div className="item-price">
                                      {formatPrice(item.unit_price)}
                                    </div>
                                    {order.status === "delivered" && (item.review ? (
                                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, fontSize: 12 }}>
                                        <span style={{ color: item.review.is_approved ? "#15803d" : "#b45309" }}>{item.review.is_approved ? "Review published" : "Review awaiting approval"}</span>
                                        <button type="button" className="btn-order-action" onClick={() => editItemReview(item)}>Edit</button>
                                        <button type="button" className="btn-order-action cancel" onClick={() => deleteItemReview(item)}>Delete</button>
                                      </div>
                                    ) : (
                                      <button type="button" className="btn-order-action" style={{ marginTop: 8 }} onClick={() => { setReviewTarget(item); setReviewForm({ rating: 5, title: "", comment: "" }); setReviewImages([]); }}>Write a review</button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>

                          {/* Order Summary & Address Details */}
                          <div className="order-summary-col">
                            <div className="summary-block">
                              <span className="summary-label">Shipping Address</span>
                              <p className="summary-val">{order.shipping_address}</p>
                              {order.city && (
                                <p className="summary-val">
                                  {order.city}
                                  {order.pincode ? ` - ${order.pincode}` : ""}
                                </p>
                              )}
                            </div>

                            <div className="summary-block">
                              <span className="summary-label">Payment</span>
                              <p className="summary-val">
                                {order.payment_method === "COD"
                                  ? "Cash on Delivery"
                                  : "Prepaid / Online"}
                              </p>
                            </div>

                            <div className="summary-total-row">
                              <span>Total Paid:</span>
                              <strong>{formatPrice(order.total)}</strong>
                            </div>

                            <div className="order-card-actions">
                              {order.awb_code && <a className="btn-order-action" href={`https://www.shiprocket.in/shipment-tracking/${encodeURIComponent(order.awb_code)}`} target="_blank" rel="noreferrer">Track shipment</a>}
                              <button
                                type="button"
                                className="btn-order-action"
                                onClick={() => setSelectedInvoiceOrder(order)}
                              >
                                📄 Tax Invoice
                              </button>
                              {order.cancellation_status && order.cancellation_status !== "none" ? (
                                <span
                                  style={{
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    textTransform: "uppercase",
                                    background: order.cancellation_status === "completed" ? "#dcfce7" : "#fef3c7",
                                    color: order.cancellation_status === "completed" ? "#15803d" : "#b45309",
                                    border: `1px solid ${order.cancellation_status === "completed" ? "#bbf7d0" : "#fde68a"}`
                                  }}
                                >
                                  {order.cancellation_type === "post_delivery" ? "Return" : "Cancel"}: {order.cancellation_status.replace(/_/g, " ")}
                                </span>
                              ) : (
                                <>
                                  {(order.status === "pending" || order.status === "confirmed") && (
                                    <button
                                      type="button"
                                      className="btn-order-action cancel"
                                      onClick={() => openActionModal(order, "pre_pack")}
                                    >
                                      ✕ Cancel Order
                                    </button>
                                  )}
                                  {(order.status === "packed" || order.status === "shipped") && (
                                    <button
                                      type="button"
                                      className="btn-order-action"
                                      style={{ color: "#d97706", borderColor: "#fde68a" }}
                                      onClick={() => openActionModal(order, "in_transit")}
                                    >
                                      ✕ Stop Delivery
                                    </button>
                                  )}
                                  {order.status === "delivered" && (
                                    <button
                                      type="button"
                                      className="btn-order-action"
                                      style={{ color: "#7c3aed", borderColor: "#ddd6fe" }}
                                      onClick={() => openActionModal(order, "post_delivery")}
                                    >
                                      ↩ Request Return
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE DETAILS */}
          {activeTab === "profile" && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Account Details</h2>
                <span className="pane-subtitle">Update your personal contact details</span>
              </div>

              <form className="account-form" onSubmit={handleProfileSubmit} noValidate>
                {profileError && (
                  <div style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "14px", background: "#FEF2F2", padding: "8px 12px", borderRadius: "6px", border: "1px solid #FCA5A5" }}>
                    ⚠️ {profileError}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="acc-name">Full Name</label>
                  <input
                    id="acc-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setProfileError("");
                      setFormData({ ...formData, name: e.target.value });
                    }}
                    className="account-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="acc-email">Email Address</label>
                  <input
                    id="acc-email"
                    type="email"
                    disabled
                    value={formData.email}
                    className="account-input disabled"
                  />
                  <span className="input-helper">Email address cannot be modified.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="acc-phone">Mobile Phone</label>
                  <input
                    id="acc-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      setProfileError("");
                      setFormData({ ...formData, phone: cleanPhoneInput(e.target.value) });
                    }}
                    className="account-input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                  style={{ alignSelf: "flex-start", marginTop: "12px" }}
                >
                  {isUpdating ? "Saving Changes..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Saved Delivery Addresses</h2>
                <span className="pane-subtitle">Delivery destinations from your recent orders</span>
              </div>

              {orders.length === 0 ? (
                <div className="empty-orders-view">
                  <div className="empty-icon">📍</div>
                  <h3>No Saved Addresses</h3>
                  <p>When you place an order, your delivery address will automatically be recorded here.</p>
                </div>
              ) : (
                <div className="addresses-grid">
                  {Array.from(new Set(orders.map((o) => o.shipping_address))).map(
                    (address, idx) => {
                      const matchedOrder = orders.find((o) => o.shipping_address === address);
                      return (
                        <div key={idx} className="address-card">
                          <div className="address-card-header">
                            <span className="address-type">Address {idx + 1}</span>
                            {idx === 0 && <span className="default-pill">Most Recent</span>}
                          </div>
                          <p className="address-recipient">
                            <strong>{matchedOrder?.customer_name || customerUser.name}</strong>
                          </p>
                          <p className="address-lines">{address}</p>
                          {matchedOrder?.city && (
                            <p className="address-lines">
                              {matchedOrder.city}
                              {matchedOrder.pincode ? ` - ${matchedOrder.pincode}` : ""}
                            </p>
                          )}
                          <p className="address-phone">
                            Phone: {matchedOrder?.phone || customerUser.phone}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {reviewTarget && (
        <div className="cancel-confirm-modal-overlay" onClick={() => setReviewTarget(null)}>
          <form className="cancel-confirm-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveItemReview}>
            <h3>Review {reviewTarget.product_name_snapshot}</h3>
            <label style={{ display: "block", margin: "12px 0" }}>Rating
              <select value={reviewForm.rating} onChange={(e) => setReviewForm((v) => ({ ...v, rating: e.target.value }))} style={{ display: "block", width: "100%", padding: 9 }}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
            </label>
            <label style={{ display: "block", margin: "12px 0" }}>Title (optional)
              <input value={reviewForm.title} onChange={(e) => setReviewForm((v) => ({ ...v, title: e.target.value }))} maxLength={255} style={{ display: "block", width: "100%", padding: 9 }} />
            </label>
            <label style={{ display: "block", margin: "12px 0" }}>Your review
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((v) => ({ ...v, comment: e.target.value }))} minLength={5} required rows={4} style={{ display: "block", width: "100%", padding: 9 }} />
            </label>
            <label style={{ display: "block", margin: "12px 0" }}>Photos (optional, up to 4)
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(e) => setReviewImages(Array.from(e.target.files || []).slice(0, 4))} />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn-order-action" onClick={() => setReviewTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={reviewSaving}>{reviewSaving ? "Submitting…" : "Submit review"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Cancellation / Return Request Modal */}
      {cancelModalOrder && (
        <div className="cancel-confirm-modal-overlay" onClick={() => setCancelModalOrder(null)}>
          <div
            className="cancel-confirm-modal"
            style={{ maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>
              {actionType === "post_delivery"
                ? `Request Return & Reverse Pickup — ${cancelModalOrder.order_number}`
                : actionType === "in_transit"
                ? `Stop Delivery & Cancel — ${cancelModalOrder.order_number}`
                : `Cancel Order — ${cancelModalOrder.order_number}`}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 14px 0" }}>
              {actionType === "post_delivery"
                ? "Items can be returned within 7 days of delivery. Reverse pickup will be arranged by Shiprocket."
                : actionType === "in_transit"
                ? "Package will be redirected back to the warehouse (RTO). If prepaid, refund will be credited upon receipt."
                : "Your order will be cancelled immediately and product inventory restocked."}
            </p>

            <form onSubmit={handleConfirmCancel}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                  1. Reason for {actionType === "post_delivery" ? "Return" : "Cancellation"} *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                  required
                >
                  {(actionType === "post_delivery" ? RETURN_REASONS : CANCEL_REASONS).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                  2. Detailed Explanation {actionType === "post_delivery" ? "*" : "(Optional)"}
                </label>
                <textarea
                  className="cancel-reason-textarea"
                  placeholder="Provide comments for our warehouse inspection team..."
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                  required={actionType === "post_delivery"}
                />
              </div>

              {actionType === "post_delivery" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>
                    3. Upload Media Proof (Optional)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", color: "#475569" }}>
                        📷 Photos ({photoFiles.length}/3)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setPhotoFiles(Array.from(e.target.files).slice(0, 3))}
                        style={{ fontSize: "0.72rem", marginTop: 6, width: "100%" }}
                      />
                    </div>
                    <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", color: "#475569" }}>
                        🎥 Video ({videoFile ? 1 : 0}/1)
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        style={{ fontSize: "0.72rem", marginTop: 6, width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                  {actionType === "post_delivery" ? "4" : "3"}. Your UPI ID for Refund
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="e.g. user@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                </div>
                <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4, display: "block" }}>
                  For prepaid orders, approved refunds are transferred directly to this UPI address.
                </span>
              </div>

              <div className="cancel-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isCancelling}
                  onClick={() => setCancelModalOrder(null)}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: actionType === "post_delivery" ? "#7c3aed" : "#DC2626",
                    borderColor: actionType === "post_delivery" ? "#7c3aed" : "#DC2626",
                    color: "#fff"
                  }}
                  disabled={isCancelling}
                >
                  {isCancelling
                    ? "Submitting..."
                    : actionType === "post_delivery"
                    ? "Submit Return & Reverse Pickup"
                    : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
