import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import SeoHead from "../components/Seo/SeoHead";
import { buildBreadcrumbSchema } from "../utils/seoSchemas";
import "./AboutUs.css";

export default function AboutUs() {
  const breadcrumbSchema = useMemo(() => {
    return buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about" }
    ]);
  }, []);

  const aboutSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About ZMW Clothing — Atelier & Manufacturing",
      description: "ZMW is an Indian apparel brand dedicated to redefining modern everyday wear through superior 240+ GSM fabric weight, relaxed street silhouettes, and lasting quality.",
      publisher: {
        "@type": "Organization",
        name: "ZMW Clothing",
        url: "https://zmwclothing.com"
      }
    };
  }, []);

  return (
    <div className="about-page">
      <SeoHead
        title="About Us — Rooted in Craft, Built for Modern Daily Life | ZMW Clothing"
        description="Learn about ZMW Clothing Atelier in Coimbatore. Handcrafted 240+ GSM pure combed cotton, relaxed streetwear silhouettes, in-house knitting, and nationwide delivery."
        keywords="about ZMW, luxury fashion atelier, Coimbatore clothing manufacturer, 240 GSM cotton t-shirts, heavyweight streetwear India"
        canonicalPath="/about"
        schema={[aboutSchema, breadcrumbSchema]}
      />

      {/* ── 1. Hero Header Banner (Matching Contact Us Style) ─────── */}
      <section className="about-hero" aria-label="About ZMW Support & Overview">
        <div className="container">
          <span className="about-eyebrow">COMPANY OVERVIEW &amp; FACTORY</span>
          <h1 className="about-title">About Us</h1>
          <p className="about-subtitle">
            Crafted for substance, fit, and longevity. Built for modern daily life and Indian streetwear culture — from yarn selection to the final stitch.
          </p>
        </div>
      </section>

      {/* ── 2. Company Overview Section ───────────────────────────── */}
      <section className="about-section about-section-white" id="company-overview">
        <div className="container">
          <div className="about-grid-2col">
            <div className="about-col-text">
              <div className="section-eyebrow-badge">
                <span className="eyebrow-dot"></span>
                COMPANY OVERVIEW
              </div>
              <h2 className="section-heading-title">
                Rooted in Craft, Built for Everyday Presence
              </h2>
              <p className="section-heading-subtitle about-lead-text">
                ZMW is an Indian apparel brand dedicated to redefining modern everyday wear through superior fabric weight, relaxed street silhouettes, and lasting quality.
              </p>
              
              <div className="about-overview-paragraphs">
                <p className="about-body-text">
                  Rather than chasing fleeting, disposable trends, we build foundational wardrobe essentials. We source premium combed cotton, engineer deliberate boxy cuts that flatter natural movement, and rigorously test every seam before dispatch.
                </p>
                <p className="about-body-text">
                  From our signature heavyweight 240+ GSM t-shirts and cozy fleece hoodies to versatile everyday staples for Men, Women, and Kids, ZMW stands for intentional design that holds its shape and color wash after wash.
                </p>
              </div>

              {/* 3 Core Highlights with proper H3 heading hierarchy */}
              <div className="about-overview-highlights">
                <div className="about-highlight-card">
                  <div className="about-highlight-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700 }}>Heavyweight Fabrics</h3>
                    <p>Long-staple combed cotton, bio-softened and pre-shrunk for premium handfeel.</p>
                  </div>
                </div>

                <div className="about-highlight-card">
                  <div className="about-highlight-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700 }}>Architectural Silhouettes</h3>
                    <p>Carefully balanced proportions engineered for comfort, structure, and style.</p>
                  </div>
                </div>

                <div className="about-highlight-card">
                  <div className="about-highlight-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700 }}>Direct-to-Consumer Integrity</h3>
                    <p>Ethical in-house production bypassing unnecessary middleman markups.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-col-media">
              <div className="about-image-card">
                <img
                  src={process.env.PUBLIC_URL + "/images/photo-1521572163474-6864f9cf17ab.jpg"}
                  alt="ZMW Premium Combed Cotton Garments Tailoring Atelier"
                  className="about-card-img"
                  loading="lazy"
                />
                <div className="about-card-badge">
                  <span>HEAVYWEIGHT 240+ GSM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Factory & Operating Address Section ────────────────── */}
      <section className="about-section about-section-slate" id="factory-address">
        <div className="container">
          <div className="section-header-left">
            <div className="section-eyebrow-badge">
              <span className="eyebrow-dot"></span>
              MANUFACTURING &amp; OPERATIONS
            </div>
            <h2 className="section-heading-title">
              Factory &amp; Operational Headquarters
            </h2>
            <p className="section-heading-subtitle">
              Direct, transparent operations anchored in Tamil Nadu’s renowned textile corridor, ensuring end-to-end quality control from raw yarn to final dispatch.
            </p>
          </div>

          <div className="about-factory-layout">
            {/* Factory Info Grid */}
            <div className="about-info-grid">
              <div className="about-info-tile">
                <div className="about-tile-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="about-tile-body">
                  <span className="about-tile-tag">Factory &amp; Dispatch Facility</span>
                  <p className="about-tile-main">
                    123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
                  </p>
                  <span className="about-tile-subtext">
                    Central Manufacturing &amp; Distribution Hub
                  </span>
                </div>
              </div>

              <div className="about-info-tile">
                <div className="about-tile-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="about-tile-body">
                  <span className="about-tile-tag">Operating &amp; Dispatch Hours</span>
                  <p className="about-tile-main">
                    10:00 AM to 5:00 PM IST
                  </p>
                  <span className="about-tile-subtext">
                    Monday through Saturday (Dispatches processed daily)
                  </span>
                </div>
              </div>

              <div className="about-info-tile">
                <div className="about-tile-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="about-tile-body">
                  <span className="about-tile-tag">Official Inquiries &amp; Support</span>
                  <a href="mailto:zmw@gmail.com" className="about-tile-main about-tile-link">
                    zmw@gmail.com
                  </a>
                  <span className="about-tile-subtext">
                    Customer assistance, orders &amp; wholesale queries
                  </span>
                </div>
              </div>

              <div className="about-info-tile">
                <div className="about-tile-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"></path>
                  </svg>
                </div>
                <div className="about-tile-body">
                  <span className="about-tile-tag">Customer Helpline &amp; WhatsApp</span>
                  <a href="tel:+919876543210" className="about-tile-main about-tile-link">
                    +91 9876543210
                  </a>
                  <span className="about-tile-subtext">
                    Instant order tracking and customer support
                  </span>
                </div>
              </div>
            </div>

            {/* Factory Standards Banner */}
            <div className="about-factory-badges">
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>Coimbatore &amp; Tiruppur Knitting Belt</span>
              </div>
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>100% In-House Quality Inspection</span>
              </div>
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>Ethical &amp; Fair-Trade Labor Standards</span>
              </div>
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>Pan-India Direct Dispatches</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Simple Professional CTA ────────────────────────────── */}
      <section className="about-cta-wrapper">
        <div className="container">
          <div className="about-cta-banner">
            <div className="about-cta-text">
              <div className="section-eyebrow-badge" style={{ backgroundColor: "rgba(250, 167, 3, 0.15)", color: "#FAA703", borderColor: "rgba(250, 167, 3, 0.3)" }}>
                <span className="eyebrow-dot" />
                EXPLORE THE CRAFT
              </div>
              <h2 className="about-cta-title">
                Experience ZMW Streetwear
              </h2>
              <p className="about-cta-desc">
                Discover our signature oversized tees, heavyweight hoodies, and timeless wardrobe essentials engineered for everyday life.
              </p>
            </div>
            <div className="about-cta-action-wrap">
              <Link to="/collection" className="zmw-primary-cta">
                Explore Collection
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link to="/contact" className="about-cta-secondary-link">
                Have questions? Contact our team →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
