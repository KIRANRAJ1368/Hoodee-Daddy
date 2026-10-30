import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  checkoutVisitorFields,
  hasDeliveryAddress,
  readVisitorDetails,
  saveVisitorDetails,
  VISITOR_STORAGE_KEY
} from "../../utils/visitorAccess";
import { lookupPincodeLocation } from "../../utils/pincodeLookup";
import "./AddressReminder.css";

const REMINDER_DELAY_MS = 5 * 60 * 1000; // 5 minutes of website usage
const REMINDER_VERSION = 3;

export default function AddressReminder({ paused = false, onSaved }) {
  const [visitor, setVisitor] = useState(readVisitorDetails);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== "hidden");
  const [pageReady, setPageReady] = useState(() => !document.getElementById("hd-loading-screen"));
  const dialog = useRef(null);
  const memory = useRef(visitor);

  useEffect(() => {
    const sync = (event) => {
      if (event.type === "storage" && event.key !== VISITOR_STORAGE_KEY && event.key !== null) return;
      const details = readVisitorDetails();
      memory.current = details;
      setVisitor(details);
      if (!details || hasDeliveryAddress(details)) setOpen(false);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("hd:visitor-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("hd:visitor-updated", sync);
    };
  }, []);

  useEffect(() => {
    const syncVisibility = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", syncVisibility);
    const observer = new MutationObserver(() => {
      if (!document.getElementById("hd-loading-screen")) {
        setPageReady(true);
        observer.disconnect();
      }
    });
    if (!pageReady) observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [pageReady]);

  const canShow = !paused && pageVisible && pageReady;
  const remember = (details) => {
    saveVisitorDetails(details);
    memory.current = details;
    setVisitor(details);
  };

  useEffect(() => {
    if (!visitor || hasDeliveryAddress(visitor) || open || !canShow) return;
    const stored = visitor.addressReminder;

    // If already dismissed or already displayed once, never show again
    if (stored?.status === "dismissed" || (stored?.count && stored.count >= 1 && stored.status !== "open")) {
      if (stored.version !== REMINDER_VERSION) {
        remember({
          ...visitor,
          addressReminder: {
            version: REMINDER_VERSION,
            count: stored.count || 1,
            status: "dismissed",
            nextAt: null
          }
        });
      }
      return;
    }

    const reminder =
      stored?.version === REMINDER_VERSION
        ? stored
        : {
            version: REMINDER_VERSION,
            count: 0,
            status: "waiting",
            nextAt: Date.now() + REMINDER_DELAY_MS
          };

    if (reminder !== stored) {
      remember({ ...visitor, addressReminder: reminder });
      return;
    }

    if (reminder.status === "open") {
      setForm(checkoutVisitorFields(visitor));
      setError("");
      setOpen(true);
      return;
    }

    const nextAt = reminder.nextAt || Date.now() + REMINDER_DELAY_MS;
    const timer = setTimeout(() => {
      const latest = memory.current;
      if (!latest || hasDeliveryAddress(latest) || document.visibilityState === "hidden") return;
      remember({
        ...latest,
        addressReminder: {
          version: REMINDER_VERSION,
          count: 1,
          status: "open",
          nextAt: null
        }
      });
      setForm(checkoutVisitorFields(latest));
      setError("");
      setOpen(true);
    }, Math.max(0, nextAt - Date.now()));
    return () => clearTimeout(timer);
  }, [visitor, open, canShow]);

  const visible = open && canShow;
  useEffect(() => {
    if (!visible) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("input")?.focus();
    const background = document.getElementById("storefront-content");
    background?.setAttribute("inert", "");
    return () => {
      document.body.style.overflow = previousOverflow;
      background?.removeAttribute("inert");
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    const latest = memory.current;
    if (latest) {
      remember({
        ...latest,
        addressReminder: {
          version: REMINDER_VERSION,
          count: 1,
          status: "dismissed",
          nextAt: null
        }
      });
    }
    setOpen(false);
  }, []);

  const handlePincodeChange = async (event) => {
    const val = event.target.value.replace(/\D/g, "").slice(0, 6);
    setError("");
    setForm((prev) => ({ ...prev, postalCode: val }));
    if (val.length === 6 && /^[1-9]\d{5}$/.test(val)) {
      try {
        const result = await lookupPincodeLocation(val);
        if (result && result.success) {
          setForm((prev) => ({
            ...prev,
            postalCode: val,
            city: prev.city || result.district,
            state: prev.state || result.state
          }));
        }
      } catch {}
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const latest = memory.current;
    if (!latest) return;
    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, String(value || "").trim()])
    );
    const details = { ...latest, ...values, pincode: values.postalCode };
    if (!hasDeliveryAddress(details)) {
      setError("Enter your name, street address, city, state and a valid 6-digit PIN code.");
      return;
    }
    if (
      !saveVisitorDetails({
        ...details,
        addressReminder: { version: REMINDER_VERSION, count: 1, status: "dismissed", nextAt: null }
      })
    ) {
      setError("Unable to save in this browser. Please allow site storage and try again.");
      return;
    }
    setOpen(false);
    onSaved?.();
  };

  if (!visible || !visitor) return null;

  return (
    <div
      className="address-reminder-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <section
        className="address-reminder"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-reminder-title"
        aria-describedby="address-reminder-description"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            dismiss();
          }
          if (event.key !== "Tab") return;
          const controls = [...dialog.current.querySelectorAll("input, button")];
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        {/* Top Gradient Accent Bar */}
        <div className="address-reminder-top-bar" aria-hidden="true" />

        {/* Top-Right Close Button */}
        <button
          type="button"
          className="address-reminder-close"
          onClick={dismiss}
          aria-label="Close delivery address reminder"
          title="Close (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header with Colorful Icon */}
        <div className="address-reminder-header">
          <span className="address-reminder-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
          <div className="address-reminder-header-text">
            <span className="address-reminder-eyebrow">
              <span className="address-reminder-eyebrow-dot" aria-hidden="true" />
              A QUICK CHECKOUT STARTS HERE
            </span>
            <h2 id="address-reminder-title">Your delivery address</h2>
          </div>
        </div>

        <p id="address-reminder-description" className="address-reminder-desc">
          Add it once. We'll have it ready at checkout.
        </p>

        {/* Verified Mobile Number Banner */}
        <div className="address-reminder-phone">
          <div className="address-reminder-phone-meta">
            <span className="address-reminder-phone-tag">YOUR MOBILE</span>
            <strong className="address-reminder-phone-num">+91 {visitor.phone}</strong>
          </div>
          <span className="address-reminder-verified-badge" title="Phone verified">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m8.5 12 2.5 2.5 5-5" />
            </svg>
            <span>Verified</span>
          </span>
        </div>

        {error && (
          <p role="alert" className="address-reminder-error">
            {error}
          </p>
        )}

        {/* Compact Form Fields */}
        <form onSubmit={submit} className="address-reminder-form" noValidate>
          <div className="address-reminder-fields">
            <label className="address-field-wrap">
              <span className="address-field-label">
                Full name <span className="address-field-req">*</span>
              </span>
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="e.g. Rahul Sharma"
                value={form.fullName || ""}
                maxLength={100}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, fullName: e.target.value }));
                }}
              />
            </label>

            <label className="address-field-wrap">
              <span className="address-field-label">
                House number / Street address <span className="address-field-req">*</span>
              </span>
              <input
                name="address"
                type="text"
                autoComplete="address-line1"
                required
                placeholder="Flat / House no, Street, Area"
                value={form.address || ""}
                maxLength={200}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, address: e.target.value }));
                }}
              />
            </label>

            <label className="address-field-wrap">
              <span className="address-field-label">Apartment / Landmark (optional)</span>
              <input
                name="apartment"
                type="text"
                autoComplete="address-line2"
                placeholder="Near landmark, building name"
                value={form.apartment || ""}
                maxLength={100}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, apartment: e.target.value }));
                }}
              />
            </label>

            <div className="address-fields-row">
              <label className="address-field-wrap">
                <span className="address-field-label">
                  City <span className="address-field-req">*</span>
                </span>
                <input
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  placeholder="City"
                  value={form.city || ""}
                  maxLength={60}
                  onChange={(e) => {
                    setError("");
                    setForm((prev) => ({ ...prev, city: e.target.value }));
                  }}
                />
              </label>

              <label className="address-field-wrap">
                <span className="address-field-label">
                  State <span className="address-field-req">*</span>
                </span>
                <input
                  name="state"
                  type="text"
                  autoComplete="address-level1"
                  required
                  placeholder="State"
                  value={form.state || ""}
                  maxLength={60}
                  onChange={(e) => {
                    setError("");
                    setForm((prev) => ({ ...prev, state: e.target.value }));
                  }}
                />
              </label>
            </div>

            <label className="address-field-wrap">
              <div className="address-field-label-row">
                <span className="address-field-label">
                  PIN code <span className="address-field-req">*</span>
                </span>
                <span className="address-field-hint">6 digits</span>
              </div>
              <input
                name="postalCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                maxLength={6}
                pattern="[1-9][0-9]{5}"
                placeholder="e.g. 641015"
                value={form.postalCode || ""}
                onChange={handlePincodeChange}
              />
            </label>
          </div>

          {/* Primary Action Button */}
          <button type="submit" className="address-reminder-save">
            <span>Save address &amp; continue</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>

          {/* Secondary Action */}
          <button type="button" className="address-reminder-later" onClick={dismiss}>
            I'll do this later
          </button>
        </form>

        {/* Security / Trust Note */}
        <p className="address-reminder-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <circle cx="12" cy="16" r="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span>Saved on this browser for your next order</span>
        </p>
      </section>
    </div>
  );
}



