import React, { useState } from "react";
import { Link } from "react-router-dom";
import SeoHead from "../components/Seo/SeoHead";
import { SIZE_CHART } from "../components/Modals/SizeGuideModal";
import "./SizeGuide.css";

// Helper to convert "XX.X in" to cm
function toCm(inStr) {
  const val = parseFloat(inStr);
  if (isNaN(val)) return inStr;
  return `${(val * 2.54).toFixed(1)} cm`;
}

export default function SizeGuide() {
  const [unit, setUnit] = useState("in"); // "in" or "cm"
  const [selectedSize, setSelectedSize] = useState("L");

  return (
    <div className="size-guide-page">
      <SeoHead
        title="Size & Fit Guide — Measurements & Sizing Charts | ZMW Clothing"
        description="Find your perfect streetwear fit with our comprehensive ZMW Clothing size guide. Accurate flat-lay measurements in inches and cm for men, women, and kids."
        canonicalPath="/size-guide"
      />
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="size-guide-hero" aria-label="ZWMStore Sizing Guide">
        <div className="container">
          <span className="size-guide-eyebrow">FIT & MEASUREMENTS</span>
          <h1 className="size-guide-title">Size & Fit Guide</h1>
          <p className="size-guide-subtitle">
            Find your perfect streetwear silhouette. Accurate garment dimensions, flat-lay measurements, and styling advice.
          </p>
        </div>
      </section>

      {/* ── Main Content Section ─────────────────────────────────── */}
      <section className="size-guide-section">
        <div className="container">
          <div className="size-guide-card">
            {/* Fit Tip Banner */}
            <div className="sg-fit-banner">
              <div className="sg-fit-badge">INTENTIONAL OVERSIZED FIT</div>
              <p className="sg-fit-text">
                Our streetwear garments are cut deliberately with drop shoulders and a relaxed chest drape.
                <strong> Order your true standard size for the intended oversized streetwear drape.</strong> If you prefer a closer or classic regular fit, order <strong>one size down</strong>.
              </p>
            </div>

            {/* Quick Size Selector & Unit Toggle */}
            <div className="size-guide-controls">
              <div className="size-guide-picker">
                <span className="sg-controls-label">Select Size To Highlight:</span>
                <div className="sg-pill-group">
                  {SIZE_CHART.map((item) => (
                    <button
                      key={item.size}
                      type="button"
                      className={`sg-pill-btn ${selectedSize === item.size ? "active" : ""}`}
                      onClick={() => setSelectedSize(item.size)}
                    >
                      {item.size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="size-guide-unit">
                <span className="sg-controls-label">Unit:</span>
                <div className="sg-unit-toggle">
                  <button
                    type="button"
                    className={`sg-unit-btn ${unit === "in" ? "active" : ""}`}
                    onClick={() => setUnit("in")}
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    className={`sg-unit-btn ${unit === "cm" ? "active" : ""}`}
                    onClick={() => setUnit("cm")}
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>
            </div>

            {/* Sizing Table */}
            <div className="sg-table-responsive-wrapper">
              <table className="sg-size-table">
                <thead>
                  <tr>
                    <th className="sg-th-size">Size</th>
                    <th>Chest (Width)</th>
                    <th>Body Length</th>
                    <th>Shoulder Width</th>
                    <th>Sleeve Length</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((row) => {
                    const isSelected = selectedSize === row.size;
                    return (
                      <tr
                        key={row.size}
                        className={isSelected ? "sg-row-active" : ""}
                        onClick={() => setSelectedSize(row.size)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="sg-td-size">
                          <span className="sg-size-pill">{row.size}</span>
                          {isSelected && <span className="sg-selected-tag">Selected</span>}
                        </td>
                        <td>{unit === "in" ? row.chest : toCm(row.chest)}</td>
                        <td>{unit === "in" ? row.length : toCm(row.length)}</td>
                        <td>{unit === "in" ? row.shoulder : toCm(row.shoulder)}</td>
                        <td>{unit === "in" ? row.sleeve : toCm(row.sleeve)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* How to Measure Grid */}
            <div className="sg-measure-section">
              <h3 className="sg-measure-title">How To Measure Your Best-Fitting T-Shirt:</h3>
              <div className="sg-measure-grid">
                <div className="sg-measure-item">
                  <span className="sg-measure-number">1</span>
                  <div>
                    <strong>Chest (Armpit to Armpit)</strong>
                    <p>Lay your garment flat and smooth out any wrinkles. Measure horizontally across the chest 1 inch directly below the armholes.</p>
                  </div>
                </div>
                <div className="sg-measure-item">
                  <span className="sg-measure-number">2</span>
                  <div>
                    <strong>Body Length</strong>
                    <p>Measure straight down from the highest point of the shoulder (where the collar meets the shoulder) to the bottom hem.</p>
                  </div>
                </div>
                <div className="sg-measure-item">
                  <span className="sg-measure-number">3</span>
                  <div>
                    <strong>Shoulder Width</strong>
                    <p>Measure straight across the back of the garment from the left shoulder seam directly across to the right shoulder seam.</p>
                  </div>
                </div>
                <div className="sg-measure-item">
                  <span className="sg-measure-number">4</span>
                  <div>
                    <strong>Sleeve Length</strong>
                    <p>Measure from the top shoulder seam junction straight down to the outer edge of the sleeve opening.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Box */}
            <div className="size-guide-help-box">
              <div>
                <h4>Still need sizing recommendations?</h4>
                <p>Chat directly with our styling team on WhatsApp for personalized fit advice before placing your order.</p>
              </div>
              <div className="size-guide-help-actions">
                <a
                  href={`https://api.whatsapp.com/send?phone=919876543210&text=${encodeURIComponent("Hi! I need help selecting the right size for ZWMStore clothing.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  WhatsApp Sizing Help
                </a>
                <Link to="/collection" className="btn btn-outline btn-sm">
                  Browse Collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
