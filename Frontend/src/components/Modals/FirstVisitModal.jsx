import React, { useEffect, useRef, useState } from "react";
import { storefrontApi } from "../../services/storefrontApi";
import { lookupPincodeLocation } from "../../utils/pincodeLookup";
import { readVisitorDetails, saveVisitorDetails, VISITOR_STORAGE_KEY } from "../../utils/visitorAccess";
import "./FirstVisitModal.css";

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function FirstVisitModal({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [visitor, setVisitor] = useState(readVisitorDetails);

  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [location, setLocation] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(null);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem("hoodee_welcome_modal_dismissed", "true");
    } catch {}
  };

  const phoneRef = useRef(null);
  const pinRef = useRef(null);
  const errorRef = useRef(null);
  const dialogRef = useRef(null);
  const submittingRef = useRef(false);

  // Check if first-time visitor on initial load
  useEffect(() => {
    const isDismissed = () => {
      try {
        return (
          localStorage.getItem("hoodee_welcome_modal_dismissed") === "true" ||
          Boolean(readVisitorDetails())
        );
      } catch {
        return false;
      }
    };

    if (!isDismissed()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to custom open events (e.g. from promo links or headers)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-first-visit-modal", handleOpen);
    return () => window.removeEventListener("open-first-visit-modal", handleOpen);
  }, []);

  // Sync visitor details across tabs/storage events
  useEffect(() => {
    const syncVisitor = (event) => {
      if (event.key === VISITOR_STORAGE_KEY || event.key === null) {
        setCompleted(null);
        setVisitor(readVisitorDetails());
      }
    };
    window.addEventListener("storage", syncVisitor);
    return () => window.removeEventListener("storage", syncVisitor);
  }, []);

  // Lock body scroll and focus when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Handle completion auto-dismiss
  useEffect(() => {
    if (!completed) return;
    dialogRef.current?.focus();
    const timer = setTimeout(() => {
      setVisitor(completed.details);
      setIsOpen(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [completed]);

  // Live PIN code lookup
  useEffect(() => {
    if (!isOpen || !/^[1-9]\d{5}$/.test(pincode)) {
      if (!pincode) setLocation(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsDetectingLocation(true);
      try {
        const result = await lookupPincodeLocation(pincode);
        if (!cancelled) {
          setLocation(result.success ? { district: result.district, state: result.state } : null);
        }
      } catch {
        if (!cancelled) setLocation(null);
      } finally {
        if (!cancelled) setIsDetectingLocation(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pincode, isOpen]);

  // Keyboard navigation & focus trap
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleDismiss();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;
    const controls = [
      ...dialogRef.current.querySelectorAll(
        'input:not(:disabled), button:not(:disabled), a[href], [tabindex="0"]'
      )
    ];

    if (!controls.length) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];

    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const nextErrors = {};
    if (!/^[6-9]\d{9}$/.test(phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      nextErrors.pincode = "Enter a valid 6-digit delivery PIN code.";
    }

    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length) {
      (nextErrors.phone ? phoneRef : pinRef).current?.focus();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = {
        phone,
        pincode,
        district: location?.district || null,
        state: location?.state || null
      };

      const leadResult = await storefrontApi.submitFirstVisitLead(payload);
      if (!leadResult?.id) throw new Error("We couldn't confirm your details. Please try again.");

      const details = {
        phone,
        pincode,
        district: leadResult?.district || location?.district || "",
        state: leadResult?.state || location?.state || "",
        leadId: leadResult.id,
        savedAt: new Date().toISOString()
      };

      saveVisitorDetails(details);
      try {
        localStorage.setItem("hoodee_welcome_modal_dismissed", "true");
      } catch {}
      setCompleted({ details, isExisting: leadResult?.is_existing === true });
    } catch (error) {
      setSubmitError(error.message || "Unable to save your details. Check your connection and try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children}

      {isOpen && (
        <div className="fvm-backdrop" onClick={handleBackdropClick}>
          <section
            className={`fvm-popup-card${completed ? " is-complete" : ""}`}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fvm-title"
            aria-describedby="fvm-description"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            {/* Top Close Button (✕) */}
            <button
              type="button"
              className="fvm-close-btn"
              onClick={handleDismiss}
              aria-label="Close welcome coupon popup"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Top Decorative Gradient Accent Bar */}
            <div className="fvm-card-accent-bar" aria-hidden="true" />

            {completed ? (
              <div className="fvm-success-view" role="status" aria-live="polite">
                <div className="fvm-success-icon-wrap">
                  <CheckIcon />
                </div>
                <h2 className="fvm-success-title">
                  {completed.isExisting ? "Welcome Back!" : "Delivery Details Confirmed! ✓"}
                </h2>
                <p className="fvm-success-desc">
                  {completed.isExisting
                    ? "Welcome back to HooDee Daddy! Taking you to the collection..."
                    : `Express delivery to PIN ${completed.details.pincode}${completed.details.district ? ` (${completed.details.district})` : ""} is confirmed. Happy shopping!`}
                </p>
                <div className="fvm-success-bar" aria-hidden="true">
                  <div className="fvm-success-bar-fill" />
                </div>
              </div>
            ) : (
              <div className="fvm-content">
                {/* Header Badge */}
                <div className="fvm-badge-wrap">
                  <span className="fvm-pill-badge">
                    <SparkleIcon />
                    <span>EXPRESS DELIVERY CHECK</span>
                  </span>
                </div>

                {/* Title & Description */}
                <h2 id="fvm-title" className="fvm-heading">
                  Welcome to HooDee Daddy
                </h2>

                <p id="fvm-description" className="fvm-subheading">
                  Enter your mobile number and PIN code to check express delivery availability in your area.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="fvm-form">
                  {submitError && (
                    <div className="fvm-submit-error" role="alert" tabIndex={-1} ref={errorRef}>
                      {submitError}
                    </div>
                  )}

                  {/* Mobile Number Field */}
                  <div className="fvm-field-group">
                    <div className="fvm-label-row">
                      <label htmlFor="fvm-phone">
                        Mobile Number <span className="fvm-required" aria-hidden="true">*</span>
                      </label>
                      <span className="fvm-hint-count">10 digits</span>
                    </div>

                    <div className={`fvm-phone-wrapper ${errors.phone ? "is-error" : ""}`}>
                      <div className="fvm-country-badge" aria-hidden="true">
                        <span className="fvm-code">IN +91</span>
                      </div>
                      <div className="fvm-prefix-divider" aria-hidden="true" />
                      <input
                        id="fvm-phone"
                        ref={phoneRef}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={phone}
                        disabled={isSubmitting}
                        required
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? "fvm-phone-error" : undefined}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setPhone(val);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <p className="fvm-error-msg" id="fvm-phone-error">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Delivery PIN Code Field */}
                  <div className="fvm-field-group">
                    <div className="fvm-label-row">
                      <label htmlFor="fvm-pincode">
                        Delivery PIN Code <span className="fvm-required" aria-hidden="true">*</span>
                      </label>
                      <span className="fvm-hint-count">6 digits</span>
                    </div>

                    <div className={`fvm-input-wrapper ${errors.pincode ? "is-error" : ""}`}>
                      <input
                        id="fvm-pincode"
                        ref={pinRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        placeholder="e.g. 641004"
                        value={pincode}
                        disabled={isSubmitting}
                        required
                        aria-invalid={Boolean(errors.pincode)}
                        aria-describedby={errors.pincode ? "fvm-pincode-error" : "fvm-location"}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setPincode(val);
                          setLocation(null);
                          setIsDetectingLocation(false);
                          if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: "" }));
                        }}
                      />
                    </div>

                    {errors.pincode && (
                      <p className="fvm-error-msg" id="fvm-pincode-error">
                        {errors.pincode}
                      </p>
                    )}

                    {/* Location Detection Status Pill */}
                    <div className="fvm-location-status" id="fvm-location" aria-live="polite">
                      {isDetectingLocation ? (
                        <span className="fvm-location-detecting">
                          <span className="fvm-micro-spinner" aria-hidden="true" />
                          Detecting serviceable area...
                        </span>
                      ) : location ? (
                        <span className="fvm-location-found">
                          📍 {location.district}, {location.state} • Express Serviceable
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Fast & Easy Feature Callout Box */}
                  <div className="fvm-fast-callout" role="note">
                    <div className="fvm-zap-icon-wrap" aria-hidden="true">
                      <ZapIcon />
                    </div>
                    <div className="fvm-callout-text">
                      <strong>Fast &amp; Easy:</strong> Your phone number and delivery location will be auto-filled during checkout so you can order in seconds.
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    className="fvm-submit-cta"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="fvm-spinner" aria-hidden="true" />
                        <span>Activating your 10% OFF...</span>
                      </>
                    ) : (
                      <>
                        <span>Claim 10% OFF &amp; Continue Shopping</span>
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>

                  {/* Skip Button */}
                  <button
                    type="button"
                    className="fvm-skip-btn"
                    onClick={handleDismiss}
                  >
                    Skip and browse store
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
