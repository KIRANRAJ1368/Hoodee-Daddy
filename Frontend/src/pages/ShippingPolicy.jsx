import SeoHead from "../components/Seo/SeoHead";
import React from "react";
import { SHIPPING_FEE } from "../utils/shopConfig";
import { formatPrice } from "../utils/formatPrice";
import "./PolicyPages.css";

export default function ShippingPolicy() {
  return (
    <div className="policy-page">
      <SeoHead
        title="Shipping Policy — Pan-India Express Delivery Timelines | HooDee Daddy"
        description="Review HooDee Daddy shipping rates, delivery timelines, and order tracking across Tier-1 metros and regional pin codes in India."
        canonicalPath="/shipping-policy"
      />
      <section className="policy-hero" aria-label="Shipping Policy">
        <div className="container">
          <span className="policy-eyebrow">DELIVERY & LOGISTICS</span>
          <h1 className="policy-title">Shipping Policy</h1>
          {/* <p className="policy-updated">Last Updated: September 2026</p> */}
        </div>
      </section>

      <section className="policy-content-section">
        <div className="container">
          <div className="policy-card">
            <h2>1. Order Processing Time</h2>
            <p>
              All orders placed on HooDee Daddy are processed, quality-inspected, and dispatched from our primary hub within <strong>24 to 48 business hours</strong> (excluding Sundays and national holidays). You will receive an SMS and email notification with your tracking number as soon as the package leaves our warehouse.
            </p>

            <h2>2. Domestic Shipping & Delivery Timelines</h2>
            <p>We ship across India covering over 19,000+ pin codes. Estimated transit times:</p>
            <ul>
              <li>
                <strong>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad):</strong> 3 to 5 business days
              </li>
              <li>
                <strong>Tier 2 & Tier 3 Cities:</strong> 4 to 6 business days
              </li>
              <li>
                <strong>Regional, Northeast & Remote Pin codes:</strong> 6 to 8 business days
              </li>
            </ul>

            <h2>3. Shipping Charges</h2>
            <p>
              Shipping charges are calculated directly based on your destination delivery PIN code via our Shiprocket logistics network. Enter your 6-digit PIN code on the product page, in your shopping bag, or during checkout to view the exact courier rate for your delivery address.
            </p>

            <h2>4. Cash on Delivery (COD)</h2>
            <p>
              Cash on Delivery is available for serviceable pin codes throughout India. Please ensure the exact amount is available at the time of delivery to ensure a smooth handover with the courier agent.
            </p>

            <h2>5. Tracking Your Shipment</h2>
            <p>
              Every dispatched order includes a dedicated AWB tracking number. You can track your shipment anytime via the link in your dispatch SMS/email or by clicking "Track My Order" in the website footer.
            </p>

            <h2>6. Shipping Partner Inquiries</h2>
            <p>
              For queries related to delayed shipments, address modifications prior to dispatch, or courier escalation:
            </p>
            <p>
              <strong>Logistics & Support Email:</strong>{" "}
              <a href="mailto:support@hoodeedaddy.com" style={{ color: "inherit", textDecoration: "underline" }}>support@hoodeedaddy.com</a>
              <br />
              <strong>Contact Helpline / Mobile:</strong>{" "}
              <a href="tel:+919876543210" style={{ color: "inherit", textDecoration: "underline" }}>+91 9876543210</a>
              <br />
              <strong>Central Dispatch / Company Address:</strong> 123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
              <br />
              <strong>Support Hours:</strong> 10:00 AM – 5:00 PM IST (Monday – Saturday)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
