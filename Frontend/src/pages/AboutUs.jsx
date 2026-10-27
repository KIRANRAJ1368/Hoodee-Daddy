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
      name: "About HooDee Daddy — Everyday Kids Streetwear & Hoodies",
      description: "HooDee Daddy is an Indian apparel brand dedicated to ultra-soft, play-proof hoodies, pyjamas, co-ords, and everyday essentials for kids and families.",
      publisher: {
        "@type": "Organization",
        name: "HooDee Daddy",
        url: "https://hoodeedaddy.com"
      }
    };
  }, []);

  return (
    <div className="about-page">
      <SeoHead
        title="About Us — Built for Comfort, Crafted for Everyday Play | HooDee Daddy"
        description="Learn about HooDee Daddy. Premium 100% combed cotton kids hoodies, cozy pyjamas, and everyday streetwear designed with care in Coimbatore."
        keywords="about HooDee Daddy, kids hoodies India, kids pyjamas, comfortable kids clothes, pure combed cotton clothing, Coimbatore apparel manufacturer"
        canonicalPath="/about"
        schema={[aboutSchema, breadcrumbSchema]}
      />

      {/* ── 1. Hero Header Banner ─────────────────────────────────── */}
      <section className="about-hero" aria-label="About HooDee Daddy Overview">
        <div className="container">
          <h1 className="about-title">About Us</h1>
        </div>
      </section>

      {/* ── 2. The HooDee Daddy Difference ─────────────────────────── */}
      <section className="about-section about-section-white" id="brand-story">
        <div className="container">
          <div className="about-grid-2col">
            <div className="about-col-text">
              <div className="section-eyebrow-badge">
                <span className="eyebrow-dot"></span>
                THE HOODEE DADDY STANDARD
              </div>
              <h2 className="section-heading-title">
                No Scratchy Basics. Just Pure, Cloud-Like Softness.
              </h2>
              <p className="section-heading-subtitle about-lead-text">
                We design heavyweight hoodies, cozy pyjama sets, and versatile co-ords that withstand sandbox adventures, pillow fights, and endless washes.
              </p>

              <div className="about-overview-paragraphs">
                <p className="about-body-text">
                  Too often, children's clothing is either cheaply made with polyester blends that irritate sensitive skin, or overpriced without delivering real durability. We set out to change that from day one.
                </p>
                <p className="about-body-text">
                  Directly rooted in Tamil Nadu's renowned textile corridor, we manage our own knitting, bio-softening, and tailoring. Every cut is intentionally relaxed to allow natural movement and room to grow.
                </p>
              </div>

              {/* 3 Core Highlights */}
              <div className="about-overview-highlights">
                <div className="about-highlight-card">
                  <div className="about-highlight-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div>
                    <h3>100% Skin-Friendly Cotton</h3>
                    <p>Pre-shrunk, bio-washed cotton that feels gentle on sensitive skin all day long.</p>
                  </div>
                </div>

                <div className="about-highlight-card">
                  <div className="about-highlight-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <div>
                    <h3>Play-Proof Durability</h3>
                    <p>Reinforced double-needle stitching engineered to hold shape and vibrant color.</p>
                  </div>
                </div>

                <div className="about-highlight-card">
                  <div className="about-highlight-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3>Direct-to-Family Value</h3>
                    <p>Meticulous ethical in-house craftsmanship without hefty retail markups.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-col-media">
              <div className="about-image-card">
                <img
                  src={process.env.PUBLIC_URL + "/images/photo-1556821840-3a63f95609a7.jpg"}
                  alt="HooDee Daddy Cozy Combed Cotton Kids Streetwear"
                  className="about-card-img"
                  loading="lazy"
                />
                <div className="about-card-badge">
                  <span>PREMIUM COZY COTTON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Hub & Operational Transparency ─────────────────────── */}
      <section className="about-section about-section-slate" id="manufacturing-hub">
        <div className="container">
          <div className="section-header-left">
            <div className="section-eyebrow-badge">
              <span className="eyebrow-dot"></span>
              MANUFACTURING &amp; DISTRIBUTION
            </div>
            <h2 className="section-heading-title">
              Our Central Operations &amp; Dispatch Hub
            </h2>
            <p className="section-heading-subtitle">
              Every parcel is carefully inspected, packed with love, and dispatched directly from our Coimbatore facility to doorsteps across India.
            </p>
          </div>

          <div className="about-factory-layout">
            <div className="about-info-grid">
              <div className="about-info-tile">
                <div className="about-tile-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="about-tile-body">
                  <span className="about-tile-tag">Hub Location</span>
                  <p className="about-tile-main">
                    123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
                  </p>
                  <span className="about-tile-subtext">
                    Primary Textile Knitting &amp; Distribution Centre
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
                  <span className="about-tile-tag">Dispatch Timelines</span>
                  <p className="about-tile-main">
                    24 – 48 Hours Dispatch
                  </p>
                  <span className="about-tile-subtext">
                    Monday to Saturday (3–5 Business Days pan-India delivery)
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
                  <span className="about-tile-tag">Customer Inquiries</span>
                  <a href="mailto:support@hoodeedaddy.com" className="about-tile-main about-tile-link">
                    support@hoodeedaddy.com
                  </a>
                  <span className="about-tile-subtext">
                    Quick email support &amp; size recommendations
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
                  <span className="about-tile-tag">Helpline &amp; WhatsApp</span>
                  <a href="tel:+919876543210" className="about-tile-main about-tile-link">
                    +91 9876543210
                  </a>
                  <span className="about-tile-subtext">
                    Direct assistance for order tracking and returns
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Badges */}
            <div className="about-factory-badges">
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>Coimbatore Textile Belt Heritage</span>
              </div>
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>100% Pre-Dispatch Quality Inspection</span>
              </div>
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>Safe Non-Toxic Eco Dyes</span>
              </div>
              <div className="about-factory-badge-item">
                <span className="about-factory-badge-dot"></span>
                <span>Pan-India Express Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Call to Action Banner ──────────────────────────────── */}
      <section className="about-cta-wrapper">
        <div className="container">
          <div className="about-cta-banner">
            <div className="about-cta-text">
              <div className="section-eyebrow-badge" style={{ backgroundColor: "var(--brand-white)", color: "var(--brand-orange)", borderColor: "rgba(255,115,0,0.3)" }}>
                <span className="eyebrow-dot" />
                EXPLORE HOODEE DADDY
              </div>
              <h2 className="about-cta-title">
                Ready to Upgrade Everyday Comfort?
              </h2>
              <p className="about-cta-desc">
                Discover our freshest drops of cozy hoodies, vibrant pyjama sets, and playful kids co-ords tailored for real life.
              </p>
            </div>
            <div className="about-cta-action-wrap">
              <Link to="/collection" className="btn btn-primary about-cta-primary-btn">
                Explore Collections →
              </Link>
              <Link to="/contact" className="about-cta-secondary-link">
                Have questions? Reach our support desk →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
