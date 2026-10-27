import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./CrazyOffersStrip.css";

export default function CrazyOffersStrip() {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="crazy-offers-strip" aria-label="Crazy Offers and Promotional Deals">
      <div className="container">
        <div className="crazy-offers-grid">
          {/* Offer 1 */}
          <div className="crazy-offer-card offer-card-primary">
            <div className="offer-badge-label">POPULAR DEAL</div>
            <div className="offer-main-content">
              <span className="offer-subhead">BUY 2 & GET</span>
              <h3 className="offer-value">₹200 OFF</h3>
              <p className="offer-code-hint">Auto-applied or use code: <strong>HD200</strong></p>
            </div>
            <div className="offer-actions">
              <button
                type="button"
                className="offer-copy-btn"
                onClick={() => handleCopy("HD200")}
              >
                {copiedCode === "HD200" ? "COPIED! ✓" : "COPY CODE"}
              </button>
              <Link to="/collection" className="offer-explore-link">
                EXPLORE &rarr;
              </Link>
            </div>
          </div>

          {/* Center Brand Callout */}
          <div className="crazy-offer-center">
            <div className="crazy-deal-pill">⚡ LIMITED TIME ONLY ⚡</div>
            <h2 className="crazy-offers-heading">CRAZY OFFERS</h2>
            <p className="crazy-offers-sub">Mix & Match Any Category · Extra Savings At Checkout</p>
          </div>

          {/* Offer 2 */}
          <div className="crazy-offer-card offer-card-secondary">
            <div className="offer-badge-label">MEGA VALUE</div>
            <div className="offer-main-content">
              <span className="offer-subhead">BUY 4 & GET</span>
              <h3 className="offer-value">₹500 OFF</h3>
              <p className="offer-code-hint">Auto-applied or use code: <strong>HD500</strong></p>
            </div>
            <div className="offer-actions">
              <button
                type="button"
                className="offer-copy-btn"
                onClick={() => handleCopy("HD500")}
              >
                {copiedCode === "HD500" ? "COPIED! ✓" : "COPY CODE"}
              </button>
              <Link to="/collection" className="offer-explore-link">
                EXPLORE &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
