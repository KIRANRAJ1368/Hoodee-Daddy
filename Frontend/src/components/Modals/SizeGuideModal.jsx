import React, { useState } from "react";
import "./SizeGuideModal.css";

export const BABIES_CHART = [
  { size: "0–2 Months", chest: "16 in", length: "13 in", shoulder: "7.5 in", sleeve: "6.5 in" },
  { size: "2–4 Months", chest: "17 in", length: "14 in", shoulder: "8.0 in", sleeve: "7.0 in" },
  { size: "4–6 Months", chest: "18 in", length: "15 in", shoulder: "8.5 in", sleeve: "7.5 in" },
  { size: "6–8 Months", chest: "19 in", length: "16 in", shoulder: "9.0 in", sleeve: "8.0 in" },
  { size: "8–10 Months", chest: "20 in", length: "17 in", shoulder: "9.5 in", sleeve: "8.5 in" },
  { size: "10–12 Months", chest: "21 in", length: "18 in", shoulder: "10.0 in", sleeve: "9.0 in" }
];

export const KIDS_CHART = [
  { size: "2–4 Years", chest: "24 in", length: "17 in", shoulder: "11 in", sleeve: "12 in" },
  { size: "4–6 Years", chest: "26 in", length: "19 in", shoulder: "12 in", sleeve: "14 in" },
  { size: "6–8 Years", chest: "28 in", length: "21 in", shoulder: "13 in", sleeve: "16 in" },
  { size: "8–10 Years", chest: "30 in", length: "23 in", shoulder: "14 in", sleeve: "18 in" },
  { size: "10–12 Years", chest: "32 in", length: "25 in", shoulder: "15 in", sleeve: "20 in" },
  { size: "12–14 Years", chest: "34 in", length: "27 in", shoulder: "16 in", sleeve: "22 in" }
];

export const SIZE_CHART = KIDS_CHART;

// Helper to convert "XX.X in" to cm
function toCm(inStr) {
  const val = parseFloat(inStr);
  if (isNaN(val)) return inStr;
  return `${(val * 2.54).toFixed(1)} cm`;
}

export default function SizeGuideModal({ isOpen, onClose, selectedSize }) {
  const [unit, setUnit] = useState("in"); // "in" or "cm"
  const isBabiesSelected = selectedSize && /month/i.test(selectedSize);
  const [activeTab, setActiveTab] = useState(isBabiesSelected ? "babies" : "kids");

  if (!isOpen) return null;

  const currentChart = activeTab === "babies" ? BABIES_CHART : KIDS_CHART;

  return (
    <div className="sg-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sg-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sg-modal-header">
          <div>
            <span className="sg-modal-eyebrow">FIT &amp; DIMENSIONS</span>
            <h3 className="sg-modal-title">Age &amp; Size Guide</h3>
          </div>
          <button
            type="button"
            className="sg-modal-close-btn"
            onClick={onClose}
            aria-label="Close size guide"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="sg-modal-body">
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              className={`sg-unit-btn ${activeTab === "kids" ? "active" : ""}`}
              onClick={() => setActiveTab("kids")}
              style={{ flex: 1, padding: "8px 14px", fontWeight: 700 }}
            >
              Boys, Girls &amp; Kids (Years)
            </button>
            <button
              type="button"
              className={`sg-unit-btn ${activeTab === "babies" ? "active" : ""}`}
              onClick={() => setActiveTab("babies")}
              style={{ flex: 1, padding: "8px 14px", fontWeight: 700 }}
            >
              Babies (Months)
            </button>
          </div>

          {/* Fit Tip Banner */}
          <div className="sg-fit-banner">
            <div className="sg-fit-badge">COMFORT &amp; GROWTH FIT</div>
            <p className="sg-fit-text">
              Our kids and babies garments are crafted with ultra-soft, breathable cotton with room for natural movement and growth.
              <strong> Choose the age range closest to your child's age or height.</strong>
            </p>
          </div>

          {/* Unit Toggle Bar */}
          <div className="sg-controls-bar">
            <span className="sg-table-label">
              {activeTab === "babies" ? "Babies (0–12 Months) Dimensions" : "Kids (2–14 Years) Dimensions"}
            </span>
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

          {/* Table */}
          <div className="sg-table-responsive-wrapper">
            <table className="sg-size-table">
              <thead>
                <tr>
                  <th className="sg-th-size">Age Range</th>
                  <th>Chest</th>
                  <th>Body Length</th>
                  <th>Shoulder Width</th>
                  <th>Sleeve Length</th>
                </tr>
              </thead>
              <tbody>
                {currentChart.map((row) => {
                  const isSelected = selectedSize === row.size;
                  return (
                    <tr key={row.size} className={isSelected ? "sg-row-active" : ""}>
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
            <h4 className="sg-measure-title">How To Measure For Kids &amp; Babies:</h4>
            <div className="sg-measure-grid">
              <div className="sg-measure-item">
                <span className="sg-measure-number">1</span>
                <div>
                  <strong>Chest (Width)</strong>
                  <p>Lay garment flat. Measure horizontally 1 inch directly below armholes across the chest.</p>
                </div>
              </div>
              <div className="sg-measure-item">
                <span className="sg-measure-number">2</span>
                <div>
                  <strong>Body Length</strong>
                  <p>Measure from the highest point of the shoulder straight down to the bottom hem.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
