import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import "./WelcomeCouponModal.css";

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function WelcomeCouponModal() {
  const navigate = useNavigate();
  const { welcomeCouponModal, setWelcomeCouponModal, addToast } = useShop();

  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  const isOpen = Boolean(welcomeCouponModal?.isOpen);
  const couponCode = welcomeCouponModal?.couponCode || "WELCOME10";
  const discountText = welcomeCouponModal?.discountText || "10% OFF";
  const userName = welcomeCouponModal?.userName || "Friend";

  const handleClose = () => {
    try {
      localStorage.setItem("hoodee_welcome_coupon_dismissed", "true");
      localStorage.setItem("hoodee_welcome_coupon_shown", "true");
      sessionStorage.removeItem("hoodee_coupon_target_time");
    } catch {}
    setWelcomeCouponModal(null);
  };

  const handleCopy = () => {
    try {
      navigator.clipboard?.writeText(couponCode);
      localStorage.setItem("hoodee_first_order_coupon", couponCode);
      localStorage.setItem("hoodee_welcome_coupon_claimed", "true");
      localStorage.setItem("hoodee_welcome_coupon_shown", "true");
      sessionStorage.removeItem("hoodee_coupon_target_time");
    } catch {}
    setCopied(true);
    addToast(`Coupon "${couponCode}" copied to clipboard!`, "success");
    setTimeout(() => setCopied(false), 2400);
  };

  const handleClaimAndShop = () => {
    handleCopy();
    handleClose();
    navigate("/collection");
  };

  // Listen for direct custom open events (e.g. from banner click or navigation)
  useEffect(() => {
    const handleOpenModal = (e) => {
      const { couponCode: code, discountText: text, userName: name } = e?.detail || {};
      setWelcomeCouponModal({
        isOpen: true,
        couponCode: code || "WELCOME10",
        discountText: text || "10% OFF",
        userName: name || "Friend"
      });
    };
    window.addEventListener("open-welcome-coupon-modal", handleOpenModal);
    return () => window.removeEventListener("open-welcome-coupon-modal", handleOpenModal);
  }, [setWelcomeCouponModal]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="wcm-backdrop" onClick={handleBackdropClick} role="presentation">
      <section
        className="wcm-modal-card"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wcm-heading"
        aria-describedby="wcm-subhead"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Top Close Button (✕) */}
        <button
          type="button"
          className="wcm-close-btn"
          onClick={handleClose}
          aria-label="Close coupon offer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Top Vibrant Accent Bar */}
        <div className="wcm-accent-bar" aria-hidden="true" />

        <div className="wcm-body">
          {/* Decorative Icon */}
          <div className="wcm-gift-badge">
            <GiftIcon />
          </div>

          {/* Header Tag */}
          <div className="wcm-pill-wrap">
            <span className="wcm-pill">
              <SparkleIcon />
              <span>NEW MEMBER WELCOME OFFER</span>
            </span>
          </div>

          {/* Heading */}
          <h2 id="wcm-heading" className="wcm-title">
            Welcome to HooDee Daddy{userName && userName !== "Friend" ? `, ${userName}` : ""}! 🎉
          </h2>

          <p id="wcm-subhead" className="wcm-subtitle">
            You've unlocked your exclusive first-time customer welcome discount. Apply at checkout to enjoy flat <strong>{discountText}</strong> on your first order!
          </p>

          {/* Luxury Coupon Ticket */}
          <div className="wcm-coupon-ticket" aria-label="First order coupon code">
            <div className="wcm-coupon-left">
              <span className="wcm-ticket-tag">FIRST ORDER ONLY</span>
              <div className="wcm-ticket-discount">{discountText}</div>
              <span className="wcm-ticket-note">Valid across all collections</span>
            </div>

            <div className="wcm-coupon-notch-divider" aria-hidden="true">
              <span className="wcm-notch notch-top" />
              <span className="wcm-dashed-line" />
              <span className="wcm-notch notch-bottom" />
            </div>

            <div className="wcm-coupon-right">
              <span className="wcm-code-label">PROMO CODE</span>
              <div className="wcm-code-display">
                <strong>{couponCode}</strong>
              </div>
              <button
                type="button"
                className={`wcm-copy-btn ${copied ? "is-copied" : ""}`}
                onClick={handleCopy}
                aria-label={`Copy code ${couponCode}`}
              >
                {copied ? "COPIED! ✓" : "COPY CODE"}
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="wcm-actions">
            <button
              type="button"
              className="wcm-claim-btn"
              onClick={handleClaimAndShop}
            >
              <span>Claim &amp; Start Shopping</span>
              <ArrowRightIcon />
            </button>
            <button
              type="button"
              className="wcm-dismiss-link"
              onClick={handleClose}
            >
              Maybe later
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
