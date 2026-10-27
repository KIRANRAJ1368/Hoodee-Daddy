import SeoHead from "../components/Seo/SeoHead";
import React from "react";
import "./PolicyPages.css";

export default function TermsConditions() {
  return (
    <div className="policy-page">
      <SeoHead
        title="Terms & Conditions — User Agreement & Shopping Terms | HooDee Daddy"
        description="Review the terms of service, purchasing policies, and legal agreements governing the use of the HooDee Daddy e-commerce platform."
        canonicalPath="/terms-conditions"
      />
      <section className="policy-hero" aria-label="Terms and Conditions">
        <div className="container">
          <span className="policy-eyebrow">TERMS OF SERVICE</span>
          <h1 className="policy-title">Terms & Conditions</h1>
          {/* <p className="policy-updated">Last Updated: September 2026</p> */}
        </div>
      </section>

      <section className="policy-content-section">
        <div className="container">
          <div className="policy-card">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing, browsing, or shopping on the HooDee Daddy platform, you agree to be bound by these Terms and Conditions and all applicable laws and regulations of India. If you do not agree with any of these terms, you should discontinue using the website.
            </p>

            <h2>2. Product Information & Pricing</h2>
            <p>
              All products listed on the platform are described as accurately as possible. However, slight color variations may occur due to screen calibration and studio lighting.
            </p>
            <p>
              All prices displayed on HooDee Daddy are in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise. We reserve the right to correct pricing errors or modify product availability at any time without prior notice.
            </p>

            <h2>3. Orders & Cancellation</h2>
            <p>
              Receipt of an electronic order confirmation does not signify our final acceptance of your order. HooDee Daddy reserves the right at any time after receipt of your order to accept or decline it for reasons including inventory unavailability or suspected fraudulent activity.
            </p>
            <p>
              Orders may be cancelled prior to dispatch by contacting support. Once dispatched, orders are subject to our standard Return & Refund Policy.
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
              All trademarks, logos, photographs, graphics, designs, and text appearing on this site are the intellectual property of HooDee Daddy or used under authorization. Unauthorized copying, distribution, or reproduction is strictly prohibited.
            </p>

            <h2>5. Limitation of Liability & Governing Law</h2>
            <p>
              To the fullest extent permitted by law, HooDee Daddy shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use this platform.
            </p>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>

            <h2>6. Company Details</h2>
            <p>
              <strong>Brand & Store:</strong> HooDee Daddy / ZWMStore
              <br />
              <strong>Official Contact Email:</strong>{" "}
              <a href="mailto:support@hoodeedaddy.com" style={{ color: "inherit", textDecoration: "underline" }}>support@hoodeedaddy.com</a>
              <br />
              <strong>Helpline / Mobile:</strong>{" "}
              <a href="tel:+919876543210" style={{ color: "inherit", textDecoration: "underline" }}>+91 9876543210</a>
              <br />
              <strong>Official Registered Address:</strong> 123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
              <br />
              <strong>Support Hours:</strong> 10:00 AM – 5:00 PM IST
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
