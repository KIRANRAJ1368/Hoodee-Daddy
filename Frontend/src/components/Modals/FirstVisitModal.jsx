import React, { useState, useEffect, useRef } from "react";
import { storefrontApi } from "../../services/storefrontApi";
import { lookupPincodeLocation } from "../../utils/pincodeLookup";
import "./FirstVisitModal.css";

const STORAGE_KEY = "zmw_visitor_details";
const SNOOZE_SESSION_KEY = "zmw_first_visit_dismissed";

export default function FirstVisitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const phoneInputRef = useRef(null);

  // Check whether to show the first-visit modal
  useEffect(() => {
    try {
      // If customer has already submitted their details, do not open
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) return;

      // If dismissed in current browsing session, do not open
      const dismissed = sessionStorage.getItem(SNOOZE_SESSION_KEY);
      if (dismissed) return;

      // Show gracefully ~1.1s after page mount
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1100);

      return () => clearTimeout(timer);
    } catch {
      // Fallback
    }
  }, []);

  // Auto-focus phone input when modal opens
  useEffect(() => {
    if (isOpen && phoneInputRef.current) {
      const focusTimer = setTimeout(() => {
        try {
          phoneInputRef.current?.focus();
        } catch {}
      }, 250);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen]);

  // Requirement 4: When customer enters a valid 6-digit PIN code, auto-fetch District and State
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, "");

    if (cleanPin.length !== 6) {
      setDistrict("");
      setStateName("");
      setLocationStatus(null);
      setIsDetectingLocation(false);
      return;
    }

    let isMounted = true;
    setIsDetectingLocation(true);
    setLocationStatus(null);

    lookupPincodeLocation(cleanPin)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.district) {
          setDistrict(res.district);
          setStateName(res.state);
          setLocationStatus({
            type: "success",
            message: `📍 ${res.district}, ${res.state} — Express Delivery Available`
          });
          if (errors.pincode) {
            setErrors((prev) => ({ ...prev, pincode: null }));
          }
        } else {
          setDistrict("");
          setStateName("");
          setLocationStatus({
            type: "error",
            message: "Location not found for this PIN code. Please verify."
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setLocationStatus(null);
      })
      .finally(() => {
        if (isMounted) setIsDetectingLocation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pincode]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    if (errors.phone && val.length === 10) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    if (errors.pincode && val.length === 6) {
      setErrors((prev) => ({ ...prev, pincode: null }));
    }
  };

  const handleClose = () => {
    try {
      sessionStorage.setItem(SNOOZE_SESSION_KEY, "true");
    } catch {}
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanPin = pincode.replace(/\D/g, "");
    const newErrors = {};

    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    } else if (!/^[6-9]/.test(cleanPhone)) {
      newErrors.phone = "Please enter a valid Indian mobile number starting with 6-9";
    }

    if (!cleanPin) {
      newErrors.pincode = "PIN code is required";
    } else if (cleanPin.length !== 6) {
      newErrors.pincode = "Please enter a valid 6-digit postal PIN code";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // 1. Submit to Backend API (which saves lead & sends email to configured admin email)
      await storefrontApi.submitFirstVisitLead({
        phone: cleanPhone,
        pincode: cleanPin,
        district: district || null,
        state: stateName || null
      });

      // 2. Save in localStorage for instant checkout autofill
      const details = {
        phone: cleanPhone,
        pincode: cleanPin,
        district: district || "",
        state: stateName || "",
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));

      setIsSuccess(true);

      // Close modal smoothly after brief confirmation
      setTimeout(() => {
        setIsOpen(false);
      }, 950);
    } catch (err) {
      // Fallback: save to localStorage even if offline so customer can still checkout seamlessly
      const details = {
        phone: cleanPhone,
        pincode: cleanPin,
        district: district || "",
        state: stateName || "",
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
      }, 950);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fvm-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="fvm-title">
      <div className="fvm-card" onClick={(e) => e.stopPropagation()}>
        {/* Dismiss / Close Button */}
        <button
          type="button"
          className="fvm-close-btn"
          onClick={handleClose}
          aria-label="Close dialog"
          title="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        <div className="fvm-header">
          <div className="fvm-badge">
            <span>✦ Exclusive Welcome</span>
          </div>
          <h2 id="fvm-title" className="fvm-title">Welcome to ZMW Clothing</h2>
          <p className="fvm-subtitle">
            Enter your mobile number and PIN code to check express delivery in your area & unlock instant checkout.
          </p>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="fvm-success-view">
            <div className="fvm-success-icon">✓</div>
            <h3 className="fvm-success-title">Details Saved!</h3>
            <p className="fvm-success-text">
              Welcome to ZMW Clothing. Your delivery details have been recorded for an effortless checkout experience.
            </p>
          </div>
        ) : (
          <div className="fvm-body">
            <form onSubmit={handleSubmit} noValidate>
              {/* 1. Phone Number */}
              <div className="fvm-form-group">
                <label htmlFor="fvm-phone" className="fvm-label">
                  <span>Mobile Number <span className="fvm-req">*</span></span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>10 digits</span>
                </label>
                <div className="fvm-input-wrapper">
                  <span className="fvm-country-prefix">🇮🇳 +91</span>
                  <input
                    ref={phoneInputRef}
                    id="fvm-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`fvm-input has-prefix ${errors.phone ? "is-error" : ""}`}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <p className="fvm-field-error">{errors.phone}</p>}
              </div>

              {/* 2. PIN Code */}
              <div className="fvm-form-group">
                <label htmlFor="fvm-pincode" className="fvm-label">
                  <span>Delivery PIN Code <span className="fvm-req">*</span></span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>6 digits</span>
                </label>
                <div className="fvm-input-wrapper">
                  <input
                    id="fvm-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 641004"
                    value={pincode}
                    onChange={handlePincodeChange}
                    className={`fvm-input ${errors.pincode ? "is-error" : ""}`}
                    autoComplete="postal-code"
                  />
                </div>
                {errors.pincode && <p className="fvm-field-error">{errors.pincode}</p>}

                {/* Auto-Fetched Location Feedback */}
                {isDetectingLocation && (
                  <div className="fvm-location-pill is-detecting">
                    <span className="fvm-spinner" style={{ width: 12, height: 12, borderColor: "#94a3b8", borderTopColor: "#334155" }}></span>
                    <span>Detecting delivery location...</span>
                  </div>
                )}
                {!isDetectingLocation && locationStatus && (
                  <div className={`fvm-location-pill is-${locationStatus.type}`}>
                    <span>{locationStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Guarantee / Benefit Callout */}
              <div className="fvm-benefit-note">
                <span style={{ fontSize: 14 }}>⚡</span>
                <span>
                  <strong>Fast & Easy:</strong> Your phone number and delivery location will be auto-filled during checkout so you can order in seconds.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="fvm-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="fvm-spinner"></span>
                    <span>Saving Details...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Continue Shopping</span>
                    <span aria-hidden="true">&rarr;</span>
                  </>
                )}
              </button>

              {/* Skip Option */}
              <div className="fvm-skip-row">
                <button
                  type="button"
                  className="fvm-skip-btn"
                  onClick={handleClose}
                >
                  Browse as guest for now
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
