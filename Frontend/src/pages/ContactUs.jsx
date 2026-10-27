import React, { useState, useRef, useEffect, useMemo } from "react";
import { storefrontApi } from "../services/storefrontApi";
import SeoHead from "../components/Seo/SeoHead";
import { buildBreadcrumbSchema } from "../utils/seoSchemas";
import { isValidEmail, isValidPhone, cleanPhoneInput, isNonEmpty } from "../utils/validators";
import "./ContactUs.css";

const CATEGORY_OPTIONS = [
  { value: "order", label: "Order Tracking & Delivery" },
  { value: "sizing", label: "Product Sizing & Fit Advice" },
  { value: "returns", label: "Returns, Exchange & Refunds" },
  { value: "wholesale", label: "Wholesale & Bulk Orders" },
  { value: "general", label: "General Questions & Feedback" }
];

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "order",
    message: ""
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Close custom dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextVal = name === "phone" ? cleanPhoneInput(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextVal }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) setSubmitError("");
  };

  const handleSelectCategory = (val) => {
    setFormData((prev) => ({ ...prev, category: val }));
    setIsCategoryOpen(false);
  };

  const handleDropdownKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setIsCategoryOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsCategoryOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors = {};
    if (!isNonEmpty(formData.name)) {
      errors.name = "Full name is required.";
    }
    if (!isNonEmpty(formData.email)) {
      errors.email = "Email address is required.";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!isNonEmpty(formData.phone)) {
      errors.phone = "Phone number is required.";
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }
    if (!isNonEmpty(formData.message)) {
      errors.message = "Message is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setSubmitError("");

    const fullSubject = formData.subject
      ? `[${formData.category.toUpperCase()}] ${formData.subject}`
      : `[${formData.category.toUpperCase()}] Customer Inquiry`;

    try {
      await storefrontApi.submitContact({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: fullSubject,
        message: formData.message.trim()
      });
      setSubmittedData({
        ...formData,
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      });
    } catch (err) {
      setSubmitError(
        err.message || "Failed to send message. Please reach us directly via WhatsApp or Phone."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setIsCategoryOpen(false);
    setFieldErrors({});
    setSubmitError("");
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      category: "order",
      message: ""
    });
  };

  const contactSchemas = useMemo(() => {
    const breadcrumb = buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Contact Us", path: "/contact" }
    ]);
    const contactPageSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact HooDee Daddy — Customer Care & Atelier",
      description:
        "Get in touch with HooDee Daddy. Reach customer support for order assistance, size recommendations, returns, and wholesale queries.",
      url: "https://hoodeedaddy.com/contact",
      mainEntity: {
        "@type": "ClothingStore",
        name: "HooDee Daddy",
        telephone: "+919876543210",
        email: "support@hoodeedaddy.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "123, Avinashi Road, Peelamedu",
          addressLocality: "Coimbatore",
          addressRegion: "Tamil Nadu",
          postalCode: "641004",
          addressCountry: "IN"
        }
      }
    };
    return [contactPageSchema, breadcrumb];
  }, []);

  return (
    <div className="contact-page">
      <SeoHead
        title="Contact Us — Atelier Support & Customer Helpline | HooDee Daddy"
        description="Get in touch with HooDee Daddy in Coimbatore. Customer support helpline, sizing advice, delivery tracking, and returns assistance."
        keywords="contact HooDee Daddy, customer support, Coimbatore apparel atelier, HooDee Daddy helpline, kids hoodies support"
        canonicalPath="/contact"
        schema={contactSchemas}
      />

      {/* ── 1. Hero Header Banner ─────────────────────────────────── */}
      <section className="contact-hero" aria-label="Contact HooDee Daddy Support">
        <div className="container">
          <h1 className="contact-title">Contact Us</h1>
        </div>
      </section>

      {/* ── 2. Main Contact Form & Details Section ─────────────────── */}
      <section className="contact-section">
        <h2 className="sr-only">Customer Care Inquiries &amp; Atelier Help Desk</h2>
        <div className="container">
          <div className="contact-layout">
            
            {/* Left Column: Direct Channels & Hub Info */}
            <div className="contact-info-col">
              
              {/* WhatsApp VIP Card */}
              <div className="contact-whatsapp-hero-card">
                <div className="contact-whatsapp-badge">
                  <span className="contact-live-pulse"></span>
                  SUPPORT DESK ACTIVE
                </div>
                <h3 className="contact-whatsapp-title">Need Instant Sizing or Tracking Help?</h3>
                <p className="contact-whatsapp-text">
                  Chat directly with our styling &amp; order specialists on WhatsApp. Get live garment photos, sizing measurements, or express delivery updates.
                </p>
                <a
                  href="https://wa.me/919876543210?text=Hi%20HooDee%20Daddy%20Team%2C%20I%20have%20an%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-whatsapp-button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Chat on WhatsApp Now</span>
                </a>
              </div>

              {/* Atelier & Distribution Details */}
              <div className="contact-details-box">
                <h4 className="contact-details-title">Direct Contact Channels</h4>

                <div className="contact-detail-row">
                  <div className="contact-detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="contact-detail-text">
                    <strong>Support Email</strong>
                    <a href="mailto:support@hoodeedaddy.com" className="contact-link">
                      support@hoodeedaddy.com
                    </a>
                    <span className="contact-note">Guaranteed reply within 24 business hours</span>
                  </div>
                </div>

                <div className="contact-detail-row">
                  <div className="contact-detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"></path>
                    </svg>
                  </div>
                  <div className="contact-detail-text">
                    <strong>Customer Helpline</strong>
                    <a href="tel:+919876543210" className="contact-link">
                      +91 9876543210
                    </a>
                    <span className="contact-note">10:00 AM – 5:00 PM IST (Mon – Sat)</span>
                  </div>
                </div>

                <div className="contact-detail-row">
                  <div className="contact-detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="contact-detail-text">
                    <strong>Dispatch &amp; Atelier Hub</strong>
                    <p className="contact-address-text">
                      123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
                    </p>
                    <span className="contact-note">Textile Hub &amp; Primary Fulfillment Centre</span>
                  </div>
                </div>
              </div>

              {/* Service Badges */}
              <div className="contact-service-badges">
                <div className="contact-service-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>24–48h Express Dispatch</span>
                </div>
                <div className="contact-service-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>7-Day Easy Size Exchanges</span>
                </div>
                <div className="contact-service-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>100% Pure Combed Cotton</span>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Form */}
            <div className="contact-form-col">
              <div className="contact-form-card">
                <div className="contact-form-header">
                  <div className="section-eyebrow-badge">
                    <span className="eyebrow-dot"></span>
                    DIRECT INQUIRY DESK
                  </div>
                  <h3 className="contact-form-title">Send Us a Message</h3>
                  <p className="contact-form-subtitle">
                    Fill out the form below and our customer support team will review your inquiry and get back to you shortly.
                  </p>
                </div>

                {submittedData ? (
                  <div className="contact-submitted-box">
                    <div className="contact-alert-success">
                      <div className="contact-success-icon-wrap">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div className="contact-success-text">
                        <strong>Inquiry Successfully Sent!</strong>
                        <p>
                          Thank you, {submittedData.name}. We have received your message and sent a confirmation to <strong>{submittedData.email}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="customer-data-summary">
                      <h4 className="customer-data-title">Summary of Logged Details:</h4>
                      <div className="customer-data-grid">
                        <div className="customer-data-item">
                          <span className="customer-data-label">Full Name</span>
                          <span className="customer-data-val">{submittedData.name}</span>
                        </div>
                        <div className="customer-data-item">
                          <span className="customer-data-label">Email Address</span>
                          <span className="customer-data-val">{submittedData.email}</span>
                        </div>
                        {submittedData.phone && (
                          <div className="customer-data-item">
                            <span className="customer-data-label">Phone Number</span>
                            <span className="customer-data-val">{submittedData.phone}</span>
                          </div>
                        )}
                        <div className="customer-data-item">
                          <span className="customer-data-label">Topic</span>
                          <span className="customer-data-val topic-pill">
                            {CATEGORY_OPTIONS.find((c) => c.value === submittedData.category)?.label || submittedData.category}
                          </span>
                        </div>
                        {submittedData.subject && (
                          <div className="customer-data-item full-width">
                            <span className="customer-data-label">Subject / Order ID</span>
                            <span className="customer-data-val">{submittedData.subject}</span>
                          </div>
                        )}
                        <div className="customer-data-item full-width">
                          <span className="customer-data-label">Your Message</span>
                          <div className="customer-data-message-body">{submittedData.message}</div>
                        </div>
                        <div className="customer-data-item full-width">
                          <span className="customer-data-label">Timestamp</span>
                          <span className="customer-data-val timestamp-text">
                            {submittedData.timestamp}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary contact-reset-btn"
                        onClick={handleReset}
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSubmit} noValidate>
                    <div className="contact-form-row">
                      <div className="contact-input-group">
                        <label htmlFor="contact-name">Full Name *</label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={formData.name}
                          onChange={handleChange}
                          className={fieldErrors.name ? "has-error" : ""}
                        />
                        {fieldErrors.name && (
                          <span className="contact-field-error">{fieldErrors.name}</span>
                        )}
                      </div>

                      <div className="contact-input-group">
                        <label htmlFor="contact-email">Email Address *</label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          required
                          placeholder="e.g. ramesh@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={fieldErrors.email ? "has-error" : ""}
                        />
                        {fieldErrors.email && (
                          <span className="contact-field-error">{fieldErrors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="contact-form-row">
                      <div className="contact-input-group">
                        <label htmlFor="contact-phone">Mobile Number *</label>
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength="10"
                          inputMode="numeric"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={handleChange}
                          className={fieldErrors.phone ? "has-error" : ""}
                        />
                        {fieldErrors.phone && (
                          <span className="contact-field-error">{fieldErrors.phone}</span>
                        )}
                      </div>

                      <div className="contact-input-group contact-select-group" ref={categoryDropdownRef}>
                        <label id="contact-category-label" htmlFor="contact-category-trigger">
                          Inquiry Topic *
                        </label>
                        <div className="contact-custom-select-wrapper">
                          <button
                            id="contact-category-trigger"
                            type="button"
                            className={`contact-custom-select-trigger ${isCategoryOpen ? "active" : ""}`}
                            onClick={() => setIsCategoryOpen((prev) => !prev)}
                            onKeyDown={handleDropdownKeyDown}
                            aria-haspopup="listbox"
                            aria-expanded={isCategoryOpen}
                            aria-labelledby="contact-category-label contact-category-trigger"
                          >
                            <span className="contact-custom-select-label">
                              {CATEGORY_OPTIONS.find((c) => c.value === formData.category)?.label || "Select a topic"}
                            </span>
                            <span className={`contact-custom-select-arrow ${isCategoryOpen ? "open" : ""}`} aria-hidden="true">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </span>
                          </button>

                          {/* Hidden select for accessibility */}
                          <select
                            id="contact-category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            tabIndex={-1}
                            aria-hidden="true"
                            className="contact-native-select-hidden"
                          >
                            {CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {isCategoryOpen && (
                            <ul
                              className="contact-custom-select-menu"
                              role="listbox"
                              aria-labelledby="contact-category-label"
                            >
                              {CATEGORY_OPTIONS.map((opt) => {
                                const isSelected = formData.category === opt.value;
                                return (
                                  <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`contact-custom-select-option ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleSelectCategory(opt.value)}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && (
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="contact-option-check">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="contact-input-group">
                      <label htmlFor="contact-subject">Order ID / Subject (Optional)</label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        placeholder="e.g. HDD-10492 or Size Exchange question"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="contact-input-group">
                      <label htmlFor="contact-message">Message Details *</label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows="4"
                        required
                        placeholder="Please write your questions or details here..."
                        value={formData.message}
                        onChange={handleChange}
                        className={fieldErrors.message ? "has-error" : ""}
                      ></textarea>
                      {fieldErrors.message && (
                        <span className="contact-field-error">{fieldErrors.message}</span>
                      )}
                    </div>

                    {submitError && (
                      <div className="contact-form-error-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span>{submitError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary contact-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="contact-btn-spinner-wrap">
                          <span className="contact-spinner" /> Sending Message...
                        </span>
                      ) : (
                        <span>Send Message to Support →</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. Google Map Section ─────────────────────────────────── */}
      <section className="contact-map-section" aria-label="Visit Our Flagship Store">
        <div className="container">
          <div className="contact-map-card">
            <div className="contact-map-header">
              <div className="contact-map-header-text">
                <div className="section-eyebrow-badge">
                  <span className="eyebrow-dot"></span>
                  FLAGSHIP ATELIER &amp; DISTRIBUTION
                </div>
                <h3 className="contact-map-title">Visit Our Coimbatore Facility</h3>
                <p className="contact-map-desc">
                  123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India
                </p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=123+Avinashi+Road+Peelamedu+Coimbatore+641004"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline contact-directions-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                <span>Open in Google Maps</span>
              </a>
            </div>

            <div className="contact-map-frame-wrapper">
              <iframe
                title="HooDee Daddy Store Location"
                src="https://maps.google.com/maps?q=123,%20Avinashi%20Road,%20Peelamedu,%20Coimbatore%20641004&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="380"
                style={{ border: 0, display: "block" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
