import SeoHead from "../components/Seo/SeoHead";
import React from "react";
import "./PolicyPages.css";

export default function ReturnRefundPolicy() {
  return (
    <div className="policy-page">
      <SeoHead
        title="Return & Refund Policy — 7-Day Easy Returns | ZMW Clothing"
        description="Learn about the ZMW Clothing return, replacement, and refund policies. Easy 7-day doorstep pickup across India for unworn apparel."
        canonicalPath="/return-refund-policy"
      />
      <section className="policy-hero" aria-label="General Return and Refund Policy">
        <div className="container">
          <span className="policy-eyebrow">RETURNS & EXCHANGES</span>
          <h1 className="policy-title">General Return & Refund Policy</h1>
          <p className="policy-updated">General Policy Guidelines (Subject to final policy update)</p>
        </div>
      </section>

      <section className="policy-content-section">
        <div className="container">
          <div className="policy-card">
            <div style={{ background: "#FFF8EC", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(250, 167, 3, 0.35)", marginBottom: "24px" }}>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#111827" }}>
                <strong>Notice:</strong> This document outlines our general return and exchange guidelines for customer assistance. Final specific terms and conditions will be updated upon finalization.
              </p>
            </div>

            <h2>1. General Returns & Exchanges</h2>
            <p>
              We strive to ensure complete customer satisfaction with every garment. If you have an issue with size, fit, or receive a defective product, our support desk is here to help facilitate an exchange or resolution.
            </p>

            <h2>2. General Conditions for Returns</h2>
            <p>Items eligible for return or exchange must generally meet standard care conditions:</p>
            <ul>
              <li>Garments should be unworn, unwashed, and in original condition</li>
              <li>Original tags and brand packaging should be retained</li>
              <li>Requests should be initiated promptly upon receipt of the delivery</li>
            </ul>

            <h2>3. Exchanges & Size Replacements</h2>
            <p>
              If a size exchange is required, customers can reach out to our support team with their order details. Replacement dispatch or reverse pickup will be coordinated through our courier partners based on serviceability.
            </p>

            <h2>4. Refund Handling</h2>
            <p>
              Upon receipt and verification of returned items, refunds or store credits are initiated in accordance with standard e-commerce settlement procedures:
            </p>
            <ul>
              <li>
                <strong>Prepaid Transactions:</strong> Refunds are credited back through the original payment mode.
              </li>
              <li>
                <strong>Cash on Delivery (COD) Transactions:</strong> Handled via secure bank transfer or store credit as mutually agreed upon with the customer.
              </li>
            </ul>

            <h2>5. Contact for Return Inquiries</h2>
            <p>
              To report an issue or request an exchange/return, please contact our support team during working hours (10:00 AM to 5:00 PM IST):
            </p>
            <p>
              <strong>Customer Support Email:</strong>{" "}
              <a href="mailto:zmw@gmail.com" style={{ color: "inherit", textDecoration: "underline" }}>zmw@gmail.com</a>
              <br />
              <strong>Helpline / Mobile:</strong>{" "}
              <a href="tel:+919876543210" style={{ color: "inherit", textDecoration: "underline" }}>+91 9876543210</a>
              <br />
              <strong>Facility / Company Address:</strong> 123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
