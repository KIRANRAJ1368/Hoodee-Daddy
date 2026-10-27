import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import SizeGuideModal from "../Modals/SizeGuideModal";
import "./Footer.css";

const QUICK_LINKS = [
  { label: "Newborn Babies", href: "/categories/mens" },
  { label: "Kids Hoodies", href: "/categories/kidshoodies" },
  { label: "Best Sellers", href: "/collection?collection=best-sellers" },
  { label: "New Arrivals", href: "/collection?collection=new-arrivals" }
];

const INFO_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Size Guide", action: "sizeGuide" },
  { label: "FAQ", href: "/faq" }
];

const SUPPORT_LINKS = [
  { label: "Track My Order", action: "trackOrder" },
  { label: "Return & Refund Policy", href: "/return-refund-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" }
];

export default function Footer() {
  const { setIsOrderTrackOpen } = useShop();
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  return (
    <footer className="site-footer" id="footer">
      {/* Main Footer Grid */}
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo" aria-label="HooDee Daddy home">
              <img
                src={process.env.PUBLIC_URL + "/images/hoodee-daddy-logo.svg"}
                alt="HooDee Daddy"
                className="footer-brand-logo-img"
              />
            </Link>

            <p className="footer-brand-tagline">
              HooDee Daddy — Everyday Streetwear & Essentials. Heavyweight combed cotton, deliberate oversized cuts, and durable pieces crafted for real life.
            </p>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India</span>
              </div>
              <div className="footer-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"></path>
                </svg>
                <a href="tel:+919876543210" className="footer-contact-link">+91 9876543210</a>
              </div>
              <div className="footer-contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a href="mailto:support@hoodeedaddy.com" className="footer-contact-link">support@hoodeedaddy.com</a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="footer-social">
              {[
                { name: "Instagram", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> },
                { name: "Facebook", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> },
                { name: "Twitter", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l16 16m0-16L4 20"></path></svg> }
              ].map((s) => (
                <a
                  key={s.name}
                  href={`#${s.name.toLowerCase()}-placeholder`}
                  onClick={(e) => e.preventDefault()}
                  aria-label={`${s.name} (Placeholder)`}
                  title={`${s.name} (Placeholder)`}
                  className="footer-social-link"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Shop Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-heading">Quick Shop</h4>
            <ul className="footer-link-list">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="footer-nav-link">
                    <span className="footer-link-chevron">›</span>
                    <span className="footer-link-text">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-heading">Information</h4>
            <ul className="footer-link-list">
              {INFO_LINKS.map((l) => (
                <li key={l.label}>
                  {l.action === "sizeGuide" ? (
                    <button
                      type="button"
                      className="footer-nav-link"
                      onClick={() => setIsSizeGuideOpen(true)}
                    >
                      <span className="footer-link-chevron">›</span>
                      <span className="footer-link-text">{l.label}</span>
                    </button>
                  ) : (
                    <Link to={l.href} className="footer-nav-link">
                      <span className="footer-link-chevron">›</span>
                      <span className="footer-link-text">{l.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-heading">Client Services</h4>
            <ul className="footer-link-list">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  {l.action === "trackOrder" ? (
                    <button
                      type="button"
                      className="footer-nav-link"
                      onClick={() => setIsOrderTrackOpen(true)}
                    >
                      <span className="footer-link-chevron">›</span>
                      <span className="footer-link-text">{l.label}</span>
                    </button>
                  ) : (
                    <Link to={l.href} className="footer-nav-link">
                      <span className="footer-link-chevron">›</span>
                      <span className="footer-link-text">{l.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copyright">
            Copyright © 2026 HooDee Daddy. All rights reserved.
          </p>

          <p className="footer-credit">
            <span className="footer-credit-label">Developed by</span>{" "}
            <a
              href="https://saitechnosolutions.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit-link"
            >
              Sai Techno Solutions
            </a>
          </p>
        </div>
      </div>

      {/* Interactive Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </footer>
  );
}
