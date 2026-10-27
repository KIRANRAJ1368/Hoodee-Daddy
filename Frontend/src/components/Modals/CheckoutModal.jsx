import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { storefrontApi } from "../../services/storefrontApi";
import { lookupPincodeLocation } from "../../utils/pincodeLookup";
import { isValidEmail, isValidPhone, cleanPhoneInput, cleanPincodeInput, isValidPincode, isNonEmpty } from "../../utils/validators";
import { readVisitorDetails } from "../../utils/visitorAccess";
import "./CheckoutModal.css";

const PAYMENT_METHODS = [
  { id: "razorpay", name: "Razorpay (Online Payment)", icon: "⚡", desc: "UPI, Cards, Net Banking & Wallets" },
  { id: "cod", name: "Cash on Delivery", icon: "📦", desc: "Pay upon physical delivery" }
];

export default function CheckoutModal() {
  const navigate = useNavigate();
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartTotal,
    cartSubtotal,
    discountAmount,
    shippingCost,
    appliedCoupon,
    formatPrice,
    clearCart,
    addToast,
    customerUser,
    customerToken,
    setAuthModalState,
    logoutCustomer
  } = useShop();

  const savedVisitor = readVisitorDetails();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    firstName: savedVisitor?.fullName?.trim().split(/\s+/)[0] || "",
    lastName: savedVisitor?.fullName?.trim().split(/\s+/).slice(1).join(" ") || "",
    email: "",
    address: [savedVisitor?.address, savedVisitor?.apartment].filter(Boolean).join(", "),
    city: savedVisitor?.city || savedVisitor?.district || "",
    state: savedVisitor?.state || "",
    postalCode: savedVisitor?.pincode || "",
    country: "India",
    phone: savedVisitor?.phone || "",
    cardNumber: "•••• •••• •••• 4242",
    cardExp: "12/28",
    cardCvc: "888"
  });

  const [isOrdered, setIsOrdered] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isCheckoutOpen) return;
    const saved = readVisitorDetails();
    if (!saved) return;
    setFormData(prev => ({
      ...prev,
      firstName: prev.firstName || saved.fullName?.trim().split(/\s+/)[0] || "",
      lastName: prev.lastName || saved.fullName?.trim().split(/\s+/).slice(1).join(" ") || "",
      address: prev.address || [saved.address, saved.apartment].filter(Boolean).join(", "),
      city: prev.city || saved.city || saved.district || "",
      state: prev.state || saved.state || "", postalCode: prev.postalCode || saved.pincode || "",
      phone: prev.phone || saved.phone || ""
    }));
  }, [isCheckoutOpen]);

  // Auto-populate customer fields when authenticated user is present
  useEffect(() => {
    if (customerUser) {
      const parts = (customerUser.name || "").trim().split(" ");
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";
      setFormData((prev) => ({
        ...prev,
        firstName: first || prev.firstName,
        lastName: last || prev.lastName,
        email: customerUser.email || prev.email,
        phone: customerUser.phone ? cleanPhoneInput(customerUser.phone) : prev.phone
      }));
    }
  }, [customerUser]);

  // Auto-fetch District & State when PIN code is 6 digits (Requirement 4)
  useEffect(() => {
    const pin = (formData.postalCode || "").replace(/\D/g, "");
    if (pin.length !== 6) return;

    let isCancelled = false;
    lookupPincodeLocation(pin).then((res) => {
      if (isCancelled) return;
      if (res && res.success && res.district) {
        setFormData((prev) =>
          prev.postalCode.replace(/\D/g, "") === pin
            ? { ...prev, city: res.district, state: res.state }
            : prev
        );
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [formData.postalCode]);

  if (!isCheckoutOpen) return null;

  const handleChange = (e) => {
    setSubmitError("");
    const { name, value } = e.target;
    let nextVal = value;
    if (name === "phone") {
      nextVal = cleanPhoneInput(value);
    } else if (name === "postalCode") {
      nextVal = cleanPincodeInput(value);
    }
    setFormData((prev) => ({ ...prev, [name]: nextVal }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.length || isSubmitting) return;

    if (!isNonEmpty(formData.firstName)) {
      setSubmitError("First name is required.");
      return;
    }
    if (!isNonEmpty(formData.lastName)) {
      setSubmitError("Last name is required.");
      return;
    }
    if (!isNonEmpty(formData.email)) {
      setSubmitError("Email address is required.");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    if (!isNonEmpty(formData.phone)) {
      setSubmitError("Phone number is required.");
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setSubmitError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!isNonEmpty(formData.address)) {
      setSubmitError("Street address is required.");
      return;
    }
    if (!isNonEmpty(formData.city)) {
      setSubmitError("City is required.");
      return;
    }
    if (!isNonEmpty(formData.state)) {
      setSubmitError("State is required.");
      return;
    }
    if (!isNonEmpty(formData.postalCode)) {
      setSubmitError("PIN code is required.");
      return;
    }
    if (!isValidPincode(formData.postalCode)) {
      setSubmitError("PIN code must be exactly 6 digits.");
      return;
    }

    const canSubmitToApi = cart.every((item) => Number.isInteger(Number(item.id)));
    setIsSubmitting(true);
    setSubmitError("");

    try {
      let orderNumber;
      if (canSubmitToApi) {
        const order = await storefrontApi.createOrder(
          {
            customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
            shipping_address: formData.address,
            city: formData.city,
            state: formData.state || null,
            pincode: formData.postalCode,
            payment_method: paymentMethod === "cod" ? "COD" : "PREPAID",
            discount_amount: discountAmount,
            shipping_fee: shippingCost,
            items: cart.map((item) => ({
              product_id: Number(item.id),
              quantity: item.quantity,
              size: item.size,
              color: item.color
            }))
          },
          customerToken
        );
        orderNumber = order.order_number;
      } else {
        // Static fallback data
        orderNumber = "HD-" + Math.floor(10000 + Math.random() * 90000);
      }

      setOrderRef(orderNumber);
      setIsOrdered(true);
      clearCart();
      addToast(`Order ${orderNumber} confirmed! Thank you for choosing HooDee Daddy.`, "success");
    } catch (error) {
      setSubmitError(error.message || "We could not place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setIsOrdered(false);
    setSubmitError("");
  };

  const handleContinueShopping = () => {
    handleClose();
    navigate("/collection?category=mens");
  };

  return (
    <div className="modal-overlay active" onClick={handleClose}>
      <div className="checkout-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="checkout-close-btn" onClick={handleClose} aria-label="Close Checkout">
          ✕
        </button>

        {isOrdered ? (
          <div className="checkout-success-view">
            <div className="success-check-icon">✓</div>
            <span className="success-kicker">ORDER CONFIRMED</span>
            <h2 className="success-title">Thank You For Your Order</h2>
            <p className="success-desc">
              Your order <strong>{orderRef}</strong> has been successfully placed and routed to our dispatch hub for packaging.
            </p>

            <div className="order-receipt-box">
              <div className="receipt-row">
                <span>Confirmation Dispatched To</span>
                <strong>{formData.email}</strong>
              </div>
              <div className="receipt-row">
                <span>Shipping Address</span>
                <strong>{formData.address}, {formData.city} {formData.postalCode}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Mode</span>
                <strong>{paymentMethod === "cod" ? "Cash On Delivery (COD)" : paymentMethod.toUpperCase()}</strong>
              </div>
              <div className="receipt-row total-highlight">
                <span>Total Amount</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* Left Column: Form & Payment */}
            <div className="checkout-form-col">
              <span className="checkout-kicker">SECURE DISPATCH CHECKOUT</span>
              <h2 className="checkout-heading">Shipping & Payment</h2>

              {/* Guest / Client Status Ribbon */}
              {customerUser ? (
                <div className="checkout-auth-banner client">
                  <div className="cab-icon">✓</div>
                  <div className="cab-content">
                    <span className="cab-title">Signed In as <strong>{customerUser.name}</strong></span>
                    <span className="cab-sub">{customerUser.email} · Order will be linked to your account</span>
                  </div>
                  <button type="button" className="cab-action-btn" onClick={logoutCustomer}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="checkout-auth-banner guest">
                  <div className="cab-icon">⚡</div>
                  <div className="cab-content">
                    <span className="cab-title">Checking out as <strong>Guest</strong></span>
                    <span className="cab-sub">No account required. Fast and direct checkout.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} id="checkout-form" noValidate>
                <h3 className="form-subheading">1. Contact & Delivery Information</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone / Mobile</label>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    name="address"
                    type="text"
                    required
                    placeholder="House/flat no., street, landmark"
                    value={formData.address}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </div>

                {/* Address Fields in Exact Order: PIN Code -> District -> State (Requirement 3) */}
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>PIN Code</label>
                    <input
                      name="postalCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="6-digit PIN code"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <input
                      name="city"
                      type="text"
                      required
                      placeholder="Auto-filled from PIN code"
                      value={formData.city}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      name="state"
                      type="text"
                      required
                      placeholder="Auto-filled from PIN code"
                      value={formData.state}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </div>
                </div>

                <h3 className="form-subheading" style={{ marginTop: "24px" }}>
                  2. Select Payment Mode
                </h3>
                <div className="payment-options-list">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.id}
                      className={`payment-option-card ${paymentMethod === pm.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                      />
                      <span className="pm-icon">{pm.icon}</span>
                      <div className="pm-info">
                        <span className="pm-name">{pm.name}</span>
                        <span className="pm-desc">{pm.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === "card" && (
                  <div className="card-input-box">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        name="cardNumber"
                        type="text"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="auth-input"
                      />
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Expiry (MM/YY)</label>
                        <input
                          name="cardExp"
                          type="text"
                          value={formData.cardExp}
                          onChange={handleChange}
                          className="auth-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          name="cardCvc"
                          type="text"
                          value={formData.cardCvc}
                          onChange={handleChange}
                          className="auth-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="checkout-summary-col">
              <h3 className="summary-title">Order Summary ({cart.length} items)</h3>
              <div className="checkout-items-mini">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="mini-item">
                    <img src={item.image} alt={item.name} className="mini-item-img" />
                    <div className="mini-item-details">
                      <span className="mini-name">{item.name}</span>
                      <span className="mini-qty">
                        Qty: {item.quantity} • {item.size} / {item.color}
                      </span>
                    </div>
                    <span className="mini-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="breakdown-row discount">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="breakdown-row">
                  <span>Express Shipping</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
                <div className="breakdown-row total-highlight">
                  <span>Total Amount</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "20px" }}
                disabled={isSubmitting || !cart.length}
              >
                {isSubmitting
                  ? "Processing Order..."
                  : `Complete Order • ${formatPrice(cartTotal)}`}
              </button>

              {submitError && <p role="alert" className="auth-error" style={{ color: "var(--brand-blue)", marginTop: 10, fontSize: 13 }}>{submitError}</p>}

              <div className="checkout-trust-icons">
                <span>🔒 Encrypted 256-bit SSL</span>
                <span>🛡️ Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
