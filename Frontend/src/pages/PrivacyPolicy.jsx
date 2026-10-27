import SeoHead from "../components/Seo/SeoHead";
import React from "react";
import "./PolicyPages.css";

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <SeoHead
        title="Privacy Policy — Data Protection & Security | HooDee Daddy"
        description="Learn how HooDee Daddy collects, uses, and protects your personal information and transactions with bank-grade SSL encryption."
        canonicalPath="/privacy-policy"
      />
      <section className="policy-hero" aria-label="Privacy Policy">
        <div className="container">
          <span className="policy-eyebrow">LEGAL & PRIVACY</span>
          <h1 className="policy-title">Privacy Policy</h1>
          {/* <p className="policy-updated">Last Updated: September 2026</p> */}
        </div>
      </section>

      <section className="policy-content-section">
        <div className="container">
          <div className="policy-card">
            <h2>1. Introduction</h2>
            <p>
              Welcome to HooDee Daddy ("we", "our", or "us"). We value your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your details when you visit and shop on our website.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We may collect information you provide directly to us when you:</p>
            <ul>
              <li>Create an account or sign in to our storefront</li>
              <li>Place an order or make a purchase</li>
              <li>Sign up for our newsletter or promotional communications</li>
              <li>Contact our customer support team for inquiries or feedback</li>
            </ul>
            <p>
              This information may include your name, email address, phone number, shipping and billing address, and payment information (processed securely through authorized payment gateway partners).
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following business purposes:</p>
            <ul>
              <li>To process and fulfill your orders, including delivery, tracking updates, and invoicing</li>
              <li>To communicate with you regarding customer support, order confirmations, and updates</li>
              <li>To detect and prevent fraudulent transactions and maintain platform security</li>
              <li>To improve our product catalog, website experience, and customer service</li>
            </ul>

            <h2>4. Information Sharing & Third Parties</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We share data only with trusted partners strictly necessary for store operations:
            </p>
            <ul>
              <li>Courier and logistics providers for order delivery and dispatch updates</li>
              <li>Secure RBI-compliant payment gateway providers for transaction processing</li>
              <li>Communication partners for sending essential SMS/email order updates</li>
            </ul>

            <h2>5. Data Security & Retention</h2>
            <p>
              We employ standard industry safeguards to maintain the safety of your personal information. Your data is retained only as long as necessary to fulfill store services and satisfy regulatory requirements.
            </p>

            <h2>6. Contact & Grievance Officer</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact our team:
            </p>
            <p>
              <strong>Company / Store Name:</strong> HooDee Daddy / ZWMStore
              <br />
              <strong>Official Contact Email:</strong>{" "}
              <a href="mailto:support@hoodeedaddy.com" style={{ color: "inherit", textDecoration: "underline" }}>support@hoodeedaddy.com</a>
              <br />
              <strong>Helpline / Mobile:</strong>{" "}
              <a href="tel:+919876543210" style={{ color: "inherit", textDecoration: "underline" }}>+91 9876543210</a>
              <br />
              <strong>Registered Address:</strong> 123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
              <br />
              <strong>Grievance Redressal Hours:</strong> 10:00 AM – 5:00 PM IST (Monday – Saturday)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
