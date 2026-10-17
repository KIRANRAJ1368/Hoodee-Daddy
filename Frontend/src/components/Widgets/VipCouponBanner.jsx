import React, { useState } from "react";
import "./VipCouponBanner.css";

export default function VipCouponBanner() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");

  const couponCode = "ZMW10";

  const handleCopy = () => {
    navigator.clipboard?.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmailError("");
    const trimmed = (email || "").trim();
    if (!trimmed) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setEmail("");
  };

  return (
    <section className="vip-coupon-section" aria-label="Exclusive VIP Offer">
      <div className="container">
        <div className="vip-coupon-card">
          {/* Background Decorative Graphic */}
          <div className="vip-bg-glow" />

          <div className="vip-content">
            <span className="vip-badge">
              <span className="vip-pulse-dot" /> SPECIAL D2C OFFER
            </span>
            <h2 className="vip-title">
              Join The Squad. Get <span className="vip-highlight">Flat 10% OFF</span>
            </h2>
            <p className="vip-subtitle">
              Apply code at checkout on your first order. Pan-India express shipping & instant cash on delivery included!
            </p>

            <div className="vip-actions">
              {/* Copy Code Pill */}
              <div className="coupon-box" onClick={handleCopy} role="button" tabIndex={0}>
                <span className="coupon-label">COUPON CODE:</span>
                <span className="coupon-code">{couponCode}</span>
                <button type="button" className={`copy-btn ${copied ? "copied" : ""}`}>
                  {copied ? "COPIED! ✓" : "COPY"}
                </button>
              </div>

              {/* Email Subscription */}
              <form className="vip-email-form" onSubmit={handleSubscribe} noValidate>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <input
                    type="email"
                    placeholder="Enter your email for drop alerts..."
                    value={email}
                    onChange={(e) => {
                      setEmailError("");
                      setEmail(e.target.value);
                    }}
                    required
                    className="vip-input"
                    style={emailError ? { borderColor: "#DC2626" } : {}}
                  />
                  {emailError && (
                    <span style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: "4px", textAlign: "left" }}>
                      {emailError}
                    </span>
                  )}
                </div>
                <button type="submit" className="vip-submit-btn">
                  {subscribed ? "YOU'RE IN! 🎉" : "CLAIM OFFER"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
