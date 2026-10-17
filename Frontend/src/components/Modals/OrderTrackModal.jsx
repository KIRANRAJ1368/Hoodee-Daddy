import React, { useState } from "react";
import { useShop } from "../../context/ShopContext";
import { storefrontApi } from "../../services/storefrontApi";
import { isValidEmail, isNonEmpty } from "../../utils/validators";
import "./OrderTrackModal.css";

const RETURN_REASONS = [
  "Defective / Damaged Piece",
  "Size Mismatch",
  "Fabric Quality",
  "Defective Print",
  "Color Different",
  "Other"
];

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found better price / alternative",
  "Changed mind",
  "Delivery time too long",
  "Incorrect shipping address",
  "Other"
];

export default function OrderTrackModal() {
  const { isOrderTrackOpen, setIsOrderTrackOpen } = useShop();

  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);

  // Return / Cancellation modal state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("pre_pack"); // pre_pack | in_transit | post_delivery
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  if (!isOrderTrackOpen) return null;

  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    if (!isNonEmpty(orderId)) {
      setError("Please enter your Order Number.");
      return;
    }
    if (!isNonEmpty(email)) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setTrackingResult(null);

    try {
      const data = await storefrontApi.trackOrder(orderId.trim(), email.trim());
      setTrackingResult({
        id: data.id,
        orderId: data.orderNumber || data.orderId,
        status: data.status ? data.status.toUpperCase() : "PROCESSING",
        carrier: data.carrier || data.trackingCarrier || "Shiprocket Express",
        trackingNumber: data.trackingNumber || null,
        trackingUrl: data.trackingUrl || null,
        statusHistory: data.statusHistory || [],
        estimatedDelivery: data.estimatedDelivery ? String(data.estimatedDelivery) : "In 3-5 Business Days",
        destination: data.destination || "Customer Address",
        cancellationStatus: data.cancellation_status || "none",
        cancellationType: data.cancellation_type || null,
        cancellationReason: data.cancellation_reason || null,
        refundStatus: data.refund_status || "not_required",
        refundAmount: data.refund_amount,
        refundUtrNumber: data.refund_utr_number,
        reverseAwbCode: data.reverse_awb_code,
        reverseShippingStatus: data.reverse_shipping_status,
        steps: data.steps || data.timeline || []
      });
      if (!accountHolder && data.customerName) {
        setAccountHolder(data.customerName);
      }
    } catch (err) {
      setError(err.message || "Order not found. Please verify your Order Number and Email.");
    } finally {
      setLoading(false);
    }
  };

  const openActionForm = (type) => {
    setActionType(type);
    setReason(type === "post_delivery" ? RETURN_REASONS[0] : CANCEL_REASONS[0]);
    setComments("");
    setPhotoFiles([]);
    setVideoFile(null);
    setActionError("");
    setActionSuccess("");
    setIsActionModalOpen(true);
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setPhotoFiles(files);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
  };

  const handleActionFormSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setActionError("Please select a reason.");
      return;
    }
    if (actionType === "post_delivery" && (!comments || !comments.trim())) {
      setActionError("Please provide a detailed explanation for your return.");
      return;
    }
    setIsSubmittingAction(true);
    setActionError("");

    try {
      let return_images = [];
      let return_video_url = null;

      // Upload proofs if post_delivery return
      if (actionType === "post_delivery") {
        const uploadQueue = [];
        if (photoFiles.length > 0) uploadQueue.push(...photoFiles);
        if (videoFile) uploadQueue.push(videoFile);

        if (uploadQueue.length > 0) {
          const uploadedUrls = await storefrontApi.uploadReturnProof(uploadQueue);
          if (videoFile && uploadedUrls.length > 0) {
            return_video_url = uploadedUrls[uploadedUrls.length - 1];
            return_images = uploadedUrls.slice(0, uploadedUrls.length - 1);
          } else {
            return_images = uploadedUrls;
          }
        }
      }

      const targetOrderId = trackingResult?.id || trackingResult?.orderId;
      await storefrontApi.requestCancellation(targetOrderId, {
        cancellation_type: actionType,
        reason,
        comments: comments.trim() || undefined,
        refund_upi_id: upiId.trim() || undefined,
        refund_account_holder: accountHolder.trim() || undefined,
        return_images,
        return_video_url
      });

      setActionSuccess(
        actionType === "post_delivery"
          ? "Return request submitted! Reverse pickup will be scheduled upon review."
          : "Cancellation request submitted successfully!"
      );

      // Re-fetch tracking info after 1.5s
      setTimeout(() => {
        setIsActionModalOpen(false);
        handleTrackSubmit();
      }, 1500);
    } catch (err) {
      setActionError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="modal-overlay active" onClick={() => setIsOrderTrackOpen(false)}>
      <div className="order-track-container" onClick={(e) => e.stopPropagation()}>
        <button
          className="order-track-close-btn"
          onClick={() => setIsOrderTrackOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="order-track-header">
          <span className="order-track-kicker">CONCIERGE LOGISTICS</span>
          <h2 className="order-track-title">Track Your Shipment</h2>
          <p className="order-track-desc">
            Enter your Order Number and Email to view real-time courier tracking details.
          </p>
        </div>

        {/* Form */}
        <form className="order-track-form" onSubmit={handleTrackSubmit} noValidate>
          <div className="track-form-row">
            <div className="form-group">
              <label htmlFor="orderId">Order Number</label>
              <input
                id="orderId"
                type="text"
                required
                placeholder="e.g. ZMW-89421"
                value={orderId}
                onChange={(e) => {
                  setError("");
                  setOrderId(e.target.value);
                }}
                className="auth-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="trackEmail">Email Address</label>
              <input
                id="trackEmail"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setError("");
                  setEmail(e.target.value);
                }}
                className="auth-input"
              />
            </div>
          </div>
          {error && <div style={{ color: "#d9534f", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? "Searching Dispatch Records..." : "Search Order Status"}
          </button>
        </form>

        {/* Tracking Results View */}
        {trackingResult && (
          <div className="tracking-results-card">
            <div className="tracking-meta-banner">
              <div>
                <span className="meta-sub">ORDER ID</span>
                <span className="meta-val">{trackingResult.orderId}</span>
              </div>
              <div>
                <span className="meta-sub">ESTIMATED ARRIVAL</span>
                <span className="meta-val highlight">{trackingResult.estimatedDelivery}</span>
              </div>
              <div>
                <span className="meta-sub">CARRIER</span>
                <span className="meta-val">{trackingResult.carrier}</span>
              </div>
            </div>
            {trackingResult.trackingNumber ? <p style={{ margin: "-8px 0 16px", fontSize: 13 }}>AWB: <strong>{trackingResult.trackingNumber}</strong> {trackingResult.trackingUrl && <a href={trackingResult.trackingUrl} target="_blank" rel="noreferrer">Open Shiprocket tracking</a>}</p> : <p style={{ margin: "-8px 0 16px", fontSize: 13, color: "#92400e" }}>Shipment tracking will appear after dispatch.</p>}

            {/* Cancellation / Return Banner if Active */}
            {trackingResult.cancellationStatus && trackingResult.cancellationStatus !== "none" && (
              <div
                style={{
                  background: "#fffbeb",
                  border: "1.5px solid #fde68a",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <strong style={{ fontSize: "0.82rem", color: "#92400e", textTransform: "uppercase" }}>
                    {trackingResult.cancellationType === "post_delivery" ? "Return Request" : "Cancellation Request"}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: trackingResult.cancellationStatus === "completed" ? "#dcfce7" : "#fef3c7",
                      color: trackingResult.cancellationStatus === "completed" ? "#15803d" : "#b45309"
                    }}
                  >
                    {trackingResult.cancellationStatus.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                {trackingResult.reverseAwbCode && (
                  <p style={{ margin: "4px 0", fontSize: "0.78rem", color: "#78350f" }}>
                    Reverse AWB: <strong>{trackingResult.reverseAwbCode}</strong> (Status: {trackingResult.reverseShippingStatus || "Scheduled"})
                  </p>
                )}
                {trackingResult.refundStatus === "processed" && (
                  <div style={{ marginTop: 6, fontSize: "0.78rem", color: "#166534", background: "#f0fdf4", padding: "6px 8px", borderRadius: 4 }}>
                    ✓ Refund of ₹{trackingResult.refundAmount} credited to UPI ID. UTR Reference: <code>{trackingResult.refundUtrNumber}</code>
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="tracking-timeline">
              {trackingResult.steps.map((step, index) => (
                <div
                  key={index}
                  className={`timeline-step ${step.done ? "done" : ""} ${step.active ? "active" : ""}`}
                >
                  <div className="timeline-marker">
                    {step.done ? "✓" : index + 1}
                  </div>
                  <div className="timeline-info">
                    <span className="timeline-label">{step.label}</span>
                    <span className="timeline-date">{step.date}</span>
                  </div>
                </div>
              ))}
            </div>
            {trackingResult.statusHistory?.length > 0 && <div style={{ marginTop: 18, padding: 12, borderRadius: 8, background: "#f8fafc" }}>
              <strong style={{ fontSize: 13 }}>Latest tracking updates</strong>
              {trackingResult.statusHistory.slice(-5).reverse().map((entry, index) => <p key={`${entry.date}-${index}`} style={{ margin: "8px 0 0", fontSize: 12 }}><b style={{ textTransform: "capitalize" }}>{String(entry.shippingStatus || entry.status).replace(/_/g, " ")}</b> · {entry.note} <span style={{ color: "#64748b" }}>{entry.date}</span></p>)}
            </div>}

            {/* Action Trigger Buttons for Customers */}
            {(!trackingResult.cancellationStatus || trackingResult.cancellationStatus === "none") && (
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                {/* Type 1: Pre-Pack Cancel */}
                {(trackingResult.status === "PENDING" || trackingResult.status === "CONFIRMED") && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Order not packed yet:</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openActionForm("pre_pack")}
                      style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                    >
                      ✕ Cancel Order
                    </button>
                  </div>
                )}

                {/* Type 2: In-Transit Cancel */}
                {(trackingResult.status === "PACKED" || trackingResult.status === "SHIPPED") && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>In courier transit:</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openActionForm("in_transit")}
                      style={{ color: "#d97706", borderColor: "#fde68a" }}
                    >
                      ✕ Stop Delivery & Cancel
                    </button>
                  </div>
                )}

                {/* Type 3: Post-Delivery Return */}
                {trackingResult.status === "DELIVERED" && (
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.82rem", color: "#334155", marginBottom: 8 }}>
                      Need to return this piece? You have 7 days left in your return window.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openActionForm("post_delivery")}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      ↩ Request Return & Reverse Pickup
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            DYNAMIC MODAL: CANCELLATION / RETURN & REVERSE PICKUP FORM
        ══════════════════════════════════════════════════════════════ */}
        {isActionModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16
            }}
            onClick={() => setIsActionModalOpen(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "24px",
                maxWidth: 520,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}>
                  {actionType === "post_delivery"
                    ? `REQUEST RETURN & REVERSE PICKUP — ${trackingResult?.orderId}`
                    : `CANCEL ORDER — ${trackingResult?.orderId}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, fontSize: "0.82rem", marginBottom: 12 }}>
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div style={{ background: "#f0fdf4", color: "#15803d", padding: "8px 12px", borderRadius: 6, fontSize: "0.82rem", marginBottom: 12 }}>
                  {actionSuccess}
                </div>
              )}

              <form onSubmit={handleActionFormSubmit}>
                {/* 1. Reason */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    1. REASON FOR {actionType === "post_delivery" ? "RETURN" : "CANCELLATION"} *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                    required
                  >
                    {(actionType === "post_delivery" ? RETURN_REASONS : CANCEL_REASONS).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Detailed Explanation */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    2. DETAILED EXPLANATION {actionType === "post_delivery" ? "*" : "(OPTIONAL)"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details for warehouse verification..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                    required={actionType === "post_delivery"}
                  />
                </div>

                {/* 3. Media Proof Upload (For Type 3 Return) */}
                {actionType === "post_delivery" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      3. UPLOAD MEDIA PROOF (OPTIONAL)
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", color: "#475569" }}>
                          📷 Photos ({photoFiles.length}/3)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoSelect}
                          style={{ fontSize: "0.72rem", marginTop: 6, width: "100%" }}
                        />
                      </div>
                      <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", color: "#475569" }}>
                          🎥 Video ({videoFile ? 1 : 0}/1)
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          style={{ fontSize: "0.72rem", marginTop: 6, width: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Customer UPI Refund Details */}
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    {actionType === "post_delivery" ? "4" : "3"}. YOUR UPI ID FOR REFUND TRANSFER
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <input
                        type="text"
                        placeholder="e.g. user@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.82rem" }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Account Holder Name"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.82rem" }}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4, display: "block" }}>
                    Once package passes warehouse inspection, your refund will be deposited directly to this UPI ID.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isSubmittingAction}
                    onClick={() => setIsActionModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSubmittingAction}
                    style={{
                      background: actionType === "post_delivery" ? "#7c3aed" : "#dc2626",
                      borderColor: actionType === "post_delivery" ? "#7c3aed" : "#dc2626"
                    }}
                  >
                    {isSubmittingAction
                      ? "Submitting..."
                      : actionType === "post_delivery"
                      ? "SUBMIT RETURN & REQUEST SHIPROCKET PICKUP"
                      : "CONFIRM CANCELLATION"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
