import React, { useState, useRef, useEffect, useMemo } from "react";
import { storefrontApi } from "../services/storefrontApi";
import SeoHead from "../components/Seo/SeoHead";
import { buildBreadcrumbSchema } from "../utils/seoSchemas";
import { isValidEmail, isValidPhone, cleanPhoneInput, isNonEmpty } from "../utils/validators";
import "./ContactUs.css";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General Question" },
  { value: "sizing", label: "Product Sizing & Fit" },
  { value: "order", label: "Order Status & Tracking" },
  { value: "returns", label: "Returns & Refunds" },
  { value: "payment", label: "Payment & COD Availability" }
];

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "general",
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
      errors.name = "Full Name is required.";
    }
    if (!isNonEmpty(formData.email)) {
      errors.email = "Email Address is required.";
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
      : `[${formData.category.toUpperCase()}] Inquiry`;

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
      setSubmitError(err.message || "Failed to send message. Please try again or reach us directly on WhatsApp.");
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
      category: "general",
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
      name: "Contact ZMW Clothing — Customer Care & Atelier",
      description: "Get in touch with ZMW Clothing. Reach customer support for order assistance, size recommendations, returns, and wholesale queries.",
      url: "https://zmwclothing.com/contact",
      mainEntity: {
        "@type": "ClothingStore",
        name: "ZMW Clothing",
        telephone: "+919876543210",
        email: "zmw@gmail.com",
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
        title="Contact Us — Atelier Support & Customer Helpline | ZMW Clothing"
        description="Get in touch with ZMW Clothing in Coimbatore. Customer support helpline, sizing advice, delivery tracking, and returns assistance."
        keywords="contact ZMW clothing, customer support, Coimbatore apparel atelier, ZMW helpline, luxury fashion inquiries"
        canonicalPath="/contact"
        schema={contactSchemas}
      />

      {/* Header */}
      <section className="contact-hero" aria-label="Contact ZMW Support">
        <div className="container">
          <span className="contact-eyebrow">CUSTOMER CARE &amp; ASSISTANCE</span>
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            Have a question about your order, sizing, or delivery? Reach out to the ZMW / ZWMStore team and we'll get back to you promptly.
          </p>
        </div>
      </section>

      {/* Main Form & Info Section */}
      <section className="contact-section">
        <h2 className="sr-only">Customer Care Inquiries &amp; Atelier Help Desk</h2>
        <div className="container">
          <div className="contact-layout">
            {/* Info Cards Column */}
            <div className="contact-info-col">
              <div className="contact-info-card">
                <h3>Get In Touch</h3>

                <div className="contact-detail-row">
                  <div className="contact-detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="contact-detail-text">
                    <strong>Support Email</strong>
                    <a href="mailto:zmw@gmail.com" style={{ color: "inherit", textDecoration: "none" }}>
                      zmw@gmail.com
                    </a>
                  </div>
                </div>

                <div className="contact-detail-row">
                  <div className="contact-detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"></path>
                    </svg>
                  </div>
                  <div className="contact-detail-text">
                    <strong>Mobile / Helpline</strong>
                    <a href="tel:+919876543210" style={{ color: "inherit", textDecoration: "none" }}>
                      +91 9876543210
                    </a>
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
                    <strong>Address</strong>
                    <p>123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004, India</p>
                  </div>
                </div>

                <div className="contact-detail-row">
                  <div className="contact-detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="contact-detail-text">
                    <strong>Business Hours</strong>
                    <p>10:00 AM to 5:00 PM IST (Monday – Saturday)</p>
                  </div>
                </div>
              </div>

            
            </div>

            {/* Form Column */}
            <div className="contact-form-card">
              <h3>Send A Message</h3>
              <p>Fill in the form below and our team will respond during support hours (10:00 AM to 5:00 PM IST).</p>

              {submittedData ? (
                <div className="contact-submitted-box">
                  <div className="contact-alert-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <div>
                      <strong>Message Received!</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.88rem" }}>
                        Thank you for reaching out. We have logged your message with the details you entered below.
                      </p>
                    </div>
                  </div>

                  <div className="customer-data-summary">
                    <h4 className="customer-data-title">Summary of Your Submitted Message:</h4>
                    <div className="customer-data-grid">
                      <div className="customer-data-item">
                        <span className="customer-data-label">Full Name:</span>
                        <span className="customer-data-val">{submittedData.name}</span>
                      </div>
                      <div className="customer-data-item">
                        <span className="customer-data-label">Email:</span>
                        <span className="customer-data-val">{submittedData.email}</span>
                      </div>
                      {submittedData.phone && (
                        <div className="customer-data-item">
                          <span className="customer-data-label">Phone:</span>
                          <span className="customer-data-val">{submittedData.phone}</span>
                        </div>
                      )}
                      <div className="customer-data-item">
                        <span className="customer-data-label">Inquiry Topic:</span>
                        <span className="customer-data-val" style={{ textTransform: "capitalize" }}>
                          {submittedData.category}
                        </span>
                      </div>
                      {submittedData.subject && (
                        <div className="customer-data-item">
                          <span className="customer-data-label">Subject / Order:</span>
                          <span className="customer-data-val">{submittedData.subject}</span>
                        </div>
                      )}
                      <div className="customer-data-item full-width">
                        <span className="customer-data-label">Submitted Message:</span>
                        <div className="customer-data-message-body">{submittedData.message}</div>
                      </div>
                      <div className="customer-data-item full-width">
                        <span className="customer-data-label">Recorded At:</span>
                        <span className="customer-data-val" style={{ fontSize: "0.82rem", color: "#6B7280" }}>
                          {submittedData.timestamp}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleReset}
                      style={{ marginTop: "20px", width: "100%" }}
                    >
                      Send Another Message
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
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        style={fieldErrors.name ? { borderColor: "#DC2626" } : {}}
                      />
                      {fieldErrors.name && (
                        <span className="contact-field-error" style={{ color: "#DC2626", fontSize: "0.82rem", marginTop: "2px" }}>
                          {fieldErrors.name}
                        </span>
                      )}
                    </div>
                    <div className="contact-input-group">
                      <label htmlFor="contact-email">Email Address *</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        style={fieldErrors.email ? { borderColor: "#DC2626" } : {}}
                      />
                      {fieldErrors.email && (
                        <span className="contact-field-error" style={{ color: "#DC2626", fontSize: "0.82rem", marginTop: "2px" }}>
                          {fieldErrors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="contact-form-row">
                    <div className="contact-input-group">
                      <label htmlFor="contact-phone">Phone Number *</label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        required
                        inputMode="numeric"
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={handleChange}
                        style={fieldErrors.phone ? { borderColor: "#DC2626" } : {}}
                      />
                      {fieldErrors.phone && (
                        <span className="contact-field-error" style={{ color: "#DC2626", fontSize: "0.82rem", marginTop: "2px" }}>
                          {fieldErrors.phone}
                        </span>
                      )}
                    </div>
                    <div className="contact-input-group contact-select-group" ref={categoryDropdownRef}>
                      <label id="contact-category-label" htmlFor="contact-category-trigger">
                        Inquiry Topic
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

                        {/* Hidden native select for standard accessibility / form serialization */}
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
                    <label htmlFor="contact-subject">Order ID / Subject</label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      placeholder="e.g. ZMW-10492 or Sizing help"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="contact-input-group">
                    <label htmlFor="contact-message">Your Message *</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows="4"
                      required
                      placeholder="Type your message with any specific details..."
                      value={formData.message}
                      onChange={handleChange}
                      style={fieldErrors.message ? { borderColor: "#DC2626" } : {}}
                    ></textarea>
                    {fieldErrors.message && (
                      <span className="contact-field-error" style={{ color: "#DC2626", fontSize: "0.82rem", marginTop: "2px" }}>
                        {fieldErrors.message}
                      </span>
                    )}
                  </div>

                  {submitError && (
                    <div style={{ color: "#DC2626", fontSize: "0.85rem", marginBottom: "16px", background: "#FEF2F2", padding: "10px 14px", borderRadius: "6px", border: "1px solid #FCA5A5" }}>
                      ⚠️ {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending Your Message..." : "Send Customer Message"}
                  </button>
                </form>
              )}
            </div>
          </div>


        </div>
      </section>

      {/* Google Map Section */}
      <section className="contact-map-section" aria-label="Visit Our Flagship Store">
        <div className="container">
          <div className="contact-map-card">
            <div className="contact-map-header">
              <div className="contact-map-header-text">
                <span className="contact-map-eyebrow">STORE LOCATION</span>
                <h2 className="contact-map-title">Visit Our Flagship Atelier</h2>
                <p className="contact-map-desc">
                  Experience the craftsmanship in person. 123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu – 641004
                </p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=123+Avinashi+Road+Peelamedu+Coimbatore+641004"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary contact-directions-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                <span>Get Directions</span>
              </a>
            </div>

            <div className="contact-map-frame-wrapper">
              <iframe
                title="ZMW Luxury Flagship Store Location"
                src="https://maps.google.com/maps?q=123,%20Avinashi%20Road,%20Peelamedu,%20Coimbatore%20641004&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="420"
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
