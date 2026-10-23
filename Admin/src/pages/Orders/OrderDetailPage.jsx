import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  User,
  MapPin,
  FileText,
  IndianRupee,
  Truck,
  Printer,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
  Video as VideoIcon
} from "lucide-react";
import { ordersApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState/LoadingState";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { formatINR } from "../../utils/formatPrice";
import { resolveImageUrl } from "../../utils/imageUrl";
import InvoiceModal from "../../components/InvoiceModal/InvoiceModal";
import "./OrderDetailPage.css";

const ALL_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusSelect, setStatusSelect] = useState("");

  // Cancellation, Return & Refund workflow states
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [inspectorName, setInspectorName] = useState("Warehouse QC Lead");
  const [inspectorNotes, setInspectorNotes] = useState("QC Passed: Original tags attached, unworn, restocked.");
  const [utrNumber, setUtrNumber] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [activeMediaModal, setActiveMediaModal] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const toast = useToast();

  async function load() {
    setIsLoading(true);
    try {
      const { data } = await ordersApi.getById(id);
      setOrder(data);
      setStatusSelect(data.status);
      if (data.refund_utr_number) setUtrNumber(data.refund_utr_number);
    } catch (err) {
      toast.error(err.message || "Failed to load order details");
      navigate("/orders");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status) {
    setIsSaving(true);
    try {
      const { data } = await ordersApi.updateStatus(id, status);
      setOrder((o) => ({ ...o, status: data.status, shipping_status: data.shipping_status || o.shipping_status, awb_code: data.awb_code || o.awb_code }));
      toast.success(`Fulfillment status updated to "${status}"`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update order status");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSyncTracking() {
    setIsSyncing(true);
    try {
      const res = await ordersApi.syncTracking(id);
      setOrder(res.data);
      toast.success(res.message || "Tracking status updated from Shiprocket!");
    } catch (err) {
      toast.error(err.message || "Failed to sync tracking with Shiprocket.");
    } finally {
      setIsSyncing(false);
    }
  }

  // Workflow Handlers
  async function handleApproveCancellation() {
    if (!window.confirm("Approve cancellation and execute the automated logistics action?")) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.approveCancellation(id);
      setOrder(res.data);
      toast.success("Cancellation approved successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to approve cancellation.");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleApproveReturn() {
    if (!window.confirm("Approve return and schedule Shiprocket reverse pickup?")) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.approveReturn(id);
      setOrder(res.data);
      toast.success("Return approved! Shiprocket reverse pickup scheduled.");
    } catch (err) {
      toast.error(err.message || "Failed to schedule reverse pickup.");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleRejectCancellation() {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await ordersApi.rejectCancellation(id, { reason: rejectionReason.trim() });
      setOrder(res.data);
      setShowRejectModal(false);
      setRejectionReason("");
      toast.success("Request has been rejected.");
    } catch (err) {
      toast.error(err.message || "Failed to reject request.");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleMarkWarehouseReceived() {
    setIsActionLoading(true);
    try {
      const res = await ordersApi.markWarehouseReceived(id, {
        inspected_by: inspectorName,
        notes: inspectorNotes
      });
      setOrder(res.data);
      toast.success("Package marked received! Inventory restocked in MySQL.");
    } catch (err) {
      toast.error(err.message || "Failed to record warehouse receipt.");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleProcessUpiRefund() {
    if (!utrNumber.trim()) {
      toast.error("Please enter the Bank / UPI Reference (UTR) Number.");
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await ordersApi.processUpiRefund(id, {
        refund_utr_number: utrNumber.trim(),
        refund_notes: refundNotes.trim()
      });
      setOrder(res.data);
      toast.success("UPI refund completed & email confirmation sent to customer!");
    } catch (err) {
      toast.error(err.message || "Failed to record refund settlement.");
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading order invoice details..." />;
  if (!order) return null;

  return (
    <div className="order-detail-page fade">
      {/* Top Header */}
      <div className="order-detail-header">
        <Link to="/orders" className="product-back-link">
          <ArrowLeft size={16} />
          <span>Back to Orders</span>
        </Link>
        <div className="order-header-main-line">
          <div className="order-header-title-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 className="page-title">{order.order_number}</h1>
              <StatusBadge value={order.status} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link
                to={`/shipping/${order.id}`}
                className="btn btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Truck size={16} />
                <span>Shipping Details</span>
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInvoiceModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
          <p className="page-subtitle">
            Placed on {new Date(order.created_at || order.createdAt || Date.now()).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
      </div>

      <div className="order-detail-grid">
        {/* Left Column: Items, Cancellations & Total Breakdown */}
        <div className="order-detail-main">

          {/* ══════════════════════════════════════════════════════════════
              3-TIER CANCELLATION, RETURN & UPI REFUND MANAGEMENT CARD
          ══════════════════════════════════════════════════════════════ */}
          {order.cancellation_status && order.cancellation_status !== "none" && (() => {
            let returnImages = [];
            try {
              if (Array.isArray(order.return_images)) returnImages = order.return_images;
              else if (typeof order.return_images === "string") returnImages = JSON.parse(order.return_images);
            } catch (e) {
              returnImages = [];
            }

            const typeLabel =
              order.cancellation_type === "pre_pack"
                ? "Type 1: Pre-Packing Cancellation"
                : order.cancellation_type === "in_transit"
                ? "Type 2: In-Transit Courier Cancellation (RTO)"
                : "Type 3: Post-Delivery Return & Reverse Pickup";

            const isPrepaid = order.payment_method !== "COD" || order.payment_status === "paid";
            const needsRefund =
              isPrepaid &&
              order.refund_status !== "processed" &&
              (order.cancellation_status === "approved" ||
                order.cancellation_status === "rto_delivered" ||
                order.refund_status === "pending");

            return (
              <div
                className="card"
                style={{
                  marginBottom: 20,
                  border: "1.5px solid #fde68a",
                  background: "#fffdfa",
                  borderRadius: 12,
                  overflow: "hidden"
                }}
              >
                {/* Header Banner */}
                <div
                  style={{
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                    borderBottom: "1px solid #fde68a",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: "#f59e0b",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <RotateCcw size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#92400e" }}>
                        {typeLabel}
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: 11.5, color: "#b45309" }}>
                        Workflow state: <strong>{order.cancellation_status.toUpperCase()}</strong>
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                      background:
                        order.cancellation_status === "completed"
                          ? "#dcfce7"
                          : order.cancellation_status === "rejected"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        order.cancellation_status === "completed"
                          ? "#15803d"
                          : order.cancellation_status === "rejected"
                          ? "#b91c1c"
                          : "#b45309",
                      border: `1px solid ${
                        order.cancellation_status === "completed"
                          ? "#bbf7d0"
                          : order.cancellation_status === "rejected"
                          ? "#fecaca"
                          : "#fde68a"
                      }`
                    }}
                  >
                    {order.cancellation_status.replace(/_/g, " ")}
                  </span>
                </div>

                <div style={{ padding: "20px" }}>
                  {/* Customer Reason & Explanation */}
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #fed7aa",
                      borderRadius: 8,
                      padding: "14px 16px",
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#9a3412" }}>
                        CUSTOMER'S REASON:
                      </span>
                      <strong style={{ fontSize: 13, color: "#1e293b" }}>
                        {order.cancellation_reason || "Not specified"}
                      </strong>
                    </div>
                    {order.cancellation_comments && (
                      <p style={{ margin: "6px 0 0 0", fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>
                        "{order.cancellation_comments}"
                      </p>
                    )}
                  </div>

                  {/* Type 3: Customer Media Proofs (Photos & Video) */}
                  {order.cancellation_type === "post_delivery" && (returnImages.length > 0 || order.return_video_url) && (
                    <div style={{ marginBottom: 18 }}>
                      <h4 style={{ fontSize: 12.5, fontWeight: 700, color: "#334155", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <ImageIcon size={15} /> Customer Return Media Proofs
                      </h4>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                        {returnImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveMediaModal({ type: "image", url: resolveImageUrl(imgUrl) })}
                            style={{
                              width: 90,
                              height: 90,
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              overflow: "hidden",
                              cursor: "pointer",
                              position: "relative",
                              background: "#f1f5f9"
                            }}
                            title="Click to view full photo"
                          >
                            <img
                              src={resolveImageUrl(imgUrl)}
                              alt={`Proof ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                bottom: 2,
                                right: 2,
                                background: "rgba(0,0,0,0.6)",
                                color: "#fff",
                                fontSize: 9.5,
                                padding: "1px 4px",
                                borderRadius: 3
                              }}
                            >
                              Photo #{idx + 1}
                            </span>
                          </div>
                        ))}

                        {order.return_video_url && (
                          <div
                            style={{
                              border: "1px solid #cbd5e1",
                              borderRadius: 8,
                              overflow: "hidden",
                              background: "#0f172a",
                              maxWidth: 220
                            }}
                          >
                            <video
                              controls
                              src={resolveImageUrl(order.return_video_url)}
                              style={{ width: "100%", maxHeight: 110, display: "block" }}
                            />
                            <div style={{ padding: "4px 8px", background: "#1e293b", color: "#f8fafc", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                              <VideoIcon size={12} /> Unboxing Video Clip
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reverse Logistics Tracking Info */}
                  {(order.reverse_awb_code || order.reverse_shipping_status) && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginBottom: 16
                      }}
                    >
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "0 0 6px 0" }}>
                        🚚 SHIPROCKET REVERSE LOGISTICS
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontSize: 12 }}>
                        <div>
                          <span style={{ color: "#64748B" }}>Reverse AWB:</span>{" "}
                          <strong>{order.reverse_awb_code || "Generated"}</strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748B" }}>Reverse Status:</span>{" "}
                          <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                            {(order.reverse_shipping_status || "Pickup Scheduled").replace(/_/g, " ")}
                          </span>
                        </div>
                        {order.reverse_shiprocket_order_id && (
                          <div>
                            <span style={{ color: "#64748B" }}>SR Return ID:</span>{" "}
                            <code>{order.reverse_shiprocket_order_id}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warehouse Receipt Confirmation Info */}
                  {order.warehouse_received_at && (
                    <div
                      style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 10
                      }}
                    >
                      <ShieldCheck size={20} color="#059669" />
                      <div style={{ fontSize: 12, color: "#065f46" }}>
                        <strong>Package QC Passed & Restocked at Warehouse</strong>
                        <div style={{ fontSize: 11, color: "#047857" }}>
                          Inspected by: {order.warehouse_inspected_by || "QC Staff"} • Received on{" "}
                          {new Date(order.warehouse_received_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────
                      ACTION BUTTONS PER CURRENT LIFECYCLE STAGE
                  ──────────────────────────────────────────────────────── */}
                  {order.cancellation_status === "requested" && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                      {order.cancellation_type === "pre_pack" && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isActionLoading}
                          onClick={handleApproveCancellation}
                          style={{ background: "#059669", borderColor: "#059669" }}
                        >
                          <Check size={14} />
                          <span>Approve Pre-Pack Cancellation (Restock Items)</span>
                        </button>
                      )}

                      {order.cancellation_type === "in_transit" && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isActionLoading}
                          onClick={handleApproveCancellation}
                          style={{ background: "#2563eb", borderColor: "#2563eb" }}
                        >
                          <Truck size={14} />
                          <span>Approve & Stop Courier Delivery via Shiprocket (RTO)</span>
                        </button>
                      )}

                      {order.cancellation_type === "post_delivery" && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isActionLoading}
                          onClick={handleApproveReturn}
                          style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
                        >
                          <RotateCcw size={14} />
                          <span>Approve Return & Schedule Shiprocket Reverse Pickup</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={isActionLoading}
                        onClick={() => setShowRejectModal(true)}
                        style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                      >
                        <X size={14} />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  )}

                  {/* Stage 2 & 3: Package in RTO / Reverse Transit -> Warehouse Receipt */}
                  {order.cancellation_status === "rto_in_transit" && (
                    <div
                      style={{
                        background: "#f0fdfa",
                        border: "1.5px dashed #5eead4",
                        borderRadius: 8,
                        padding: "16px",
                        marginTop: 10
                      }}
                    >
                      <h4 style={{ margin: "0 0 10px 0", fontSize: 13, color: "#0f766e", fontWeight: 700 }}>
                        📦 Step: Physical Package Return to Warehouse (QC Inspection)
                      </h4>
                      <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#115e59" }}>
                        When courier hands over returned package, verify original tag, unwashed condition, then confirm below to restock items back into inventory:
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#0f766e", display: "block" }}>
                            INSPECTOR NAME
                          </label>
                          <input
                            type="text"
                            value={inspectorName}
                            onChange={(e) => setInspectorName(e.target.value)}
                            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #99f6e4", fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#0f766e", display: "block" }}>
                            QC NOTES
                          </label>
                          <input
                            type="text"
                            value={inspectorNotes}
                            onChange={(e) => setInspectorNotes(e.target.value)}
                            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #99f6e4", fontSize: 12 }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isActionLoading}
                        onClick={handleMarkWarehouseReceived}
                        style={{ background: "#0d9488", borderColor: "#0d9488" }}
                      >
                        <ShieldCheck size={14} />
                        <span>QC Passed: Package Received Back & Restock Items</span>
                      </button>
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────────────
                      STAGE: UPI REFUND SETTLEMENT LEDGER
                  ──────────────────────────────────────────────────────── */}
                  {needsRefund && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1.5px solid #fcd34d",
                        borderRadius: 8,
                        padding: "16px",
                        marginTop: 14
                      }}
                    >
                      <h4 style={{ margin: "0 0 8px 0", fontSize: 13, color: "#92400e", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <IndianRupee size={15} /> Customer UPI Refund Settlement
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, border: "1px solid #fef08a" }}>
                          <span style={{ fontSize: 11, color: "#78350f", display: "block" }}>CUSTOMER UPI ID</span>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <strong style={{ fontSize: 13, color: "#1e293b" }}>{order.refund_upi_id || "Not Provided"}</strong>
                            {order.refund_upi_id && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(order.refund_upi_id);
                                  toast.success("UPI ID copied to clipboard!");
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#d97706" }}
                                title="Copy UPI ID"
                              >
                                <Copy size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, border: "1px solid #fef08a" }}>
                          <span style={{ fontSize: 11, color: "#78350f", display: "block" }}>ACCOUNT HOLDER NAME</span>
                          <strong style={{ fontSize: 13, color: "#1e293b" }}>{order.refund_account_holder || order.customer_name}</strong>
                        </div>

                        <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, border: "1px solid #fef08a" }}>
                          <span style={{ fontSize: 11, color: "#78350f", display: "block" }}>REFUNDABLE AMOUNT</span>
                          <strong style={{ fontSize: 14, color: "#059669" }}>
                            {formatINR(order.refund_amount || order.total)}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#92400e", display: "block", marginBottom: 4 }}>
                            BANK / UPI REFERENCE TRANSACTION NUMBER (UTR) *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. UPI/627192837192 or Bank Ref #"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #f59e0b", fontSize: 12.5 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#92400e", display: "block", marginBottom: 4 }}>
                            SETTLEMENT NOTES
                          </label>
                          <input
                            type="text"
                            placeholder="Transfer memo, notes..."
                            value={refundNotes}
                            onChange={(e) => setRefundNotes(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #f59e0b", fontSize: 12.5 }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isActionLoading}
                        onClick={handleProcessUpiRefund}
                        style={{ background: "#b45309", borderColor: "#b45309" }}
                      >
                        <CheckCircle size={14} />
                        <span>Confirm UPI Refund Sent & Notify Customer</span>
                      </button>
                    </div>
                  )}

                  {/* Stage Completed & Refunded */}
                  {order.refund_status === "processed" && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <CheckCircle size={22} color="#16a34a" />
                      <div>
                        <strong style={{ fontSize: 13, color: "#166534" }}>
                          ✓ UPI Refund Processed & Credited
                        </strong>
                        <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>
                          Bank UTR Reference: <code>{order.refund_utr_number}</code> • Amount: {formatINR(order.refund_amount || order.total)}
                          {order.refund_processed_at && ` • Processed: ${new Date(order.refund_processed_at).toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Purchased Items Card */}
          <div className="card order-items-card">
            <div className="order-section-header">
              <Package size={18} className="order-section-icon" />
              <h3 className="order-section-title">Purchased Items ({order.items?.length || 0})</h3>
            </div>

            <div className="order-items-table-wrap">
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="order-item-product-cell">
                          {item.image_url && <img src={resolveImageUrl(item.image_url)} alt="" className="order-item-product-thumb" />}
                          <div>
                            <div className="cell-title">{item.product_name_snapshot}</div>
                            <div className="cell-muted" style={{ fontSize: 11 }}><code>{item.sku_snapshot}</code></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pill-badge" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                          {item.size || "Standard"}
                        </span>
                      </td>
                      <td>{item.color || "—"}</td>
                      <td>
                        <strong>{item.quantity}</strong>
                      </td>
                      <td>{formatINR(item.unit_price)}</td>
                      <td>
                        <strong style={{ color: "var(--text-main)" }}>{formatINR(item.line_total)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-totals-box">
              <div className="order-totals-row">
                <span>Product Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="order-totals-row discount-row">
                  <span>Promotional Discount</span>
                  <span>-{formatINR(order.discount_amount)}</span>
                </div>
              )}
              {order.coupon_code && <div className="order-totals-row"><span>Coupon Applied</span><strong>{order.coupon_code}</strong></div>}
              <div className="order-totals-row">
                <span>Shipping & Delivery Fee</span>
                <span>{order.shipping_fee > 0 ? formatINR(order.shipping_fee) : "Free Shipping"}</span>
              </div>
              <div className="order-totals-row final-row">
                <span>Total Amount Paid</span>
                <span className="final-price">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Updater, Courier Partner, Customer & Destination */}
        <div className="order-detail-side">
          {/* Automated Fulfillment Pipeline */}
          <div className="card order-panel-card status-updater-card">
            <div className="panel-title-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Truck size={17} className="panel-icon" />
                <h3 className="panel-title">Fulfillment Pipeline</h3>
              </div>
              <span
                className="pill-badge"
                style={{
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                ⚡ Shiprocket
              </span>
            </div>

            <div style={{ margin: "14px 0 10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Customer Order State:</span>
                <span
                  className="pill-badge"
                  style={{
                    textTransform: "capitalize",
                    fontWeight: 700,
                    fontSize: 12.5,
                    background: order.status === "delivered" ? "#ecfdf5" : order.status === "shipped" || order.status === "packed" ? "#eff6ff" : order.status === "cancelled" ? "#fee2e2" : "#fffbeb",
                    color: order.status === "delivered" ? "#059669" : order.status === "shipped" || order.status === "packed" ? "#2563eb" : order.status === "cancelled" ? "#b91c1c" : "#d97706",
                    border: `1px solid ${order.status === "delivered" ? "#a7f3d0" : order.status === "shipped" || order.status === "packed" ? "#bfdbfe" : order.status === "cancelled" ? "#fecaca" : "#fde68a"}`
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Selected Courier Partner:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>
                  {order.courier_name || "Shiprocket Express"} {order.courier_company_id ? `(#${order.courier_company_id})` : ""}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Shiprocket Status:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize" }}>
                  {(order.shipping_status || "pending_dispatch").replace(/_/g, " ")}
                </span>
              </div>

              {order.awb_code && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Courier AWB:</span>
                  <code style={{ fontSize: 12, fontWeight: 700, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                    {order.awb_code}
                  </code>
                </div>
              )}
              {order.shipment_error && <p style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: 8, borderRadius: 6, fontSize: 12 }}>{order.shipment_error}</p>}
            </div>

            {/* Manual Status Override / Trigger Shiprocket Packed */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                UPDATE FULFILLMENT STATUS
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 6,
                    border: "1.5px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  <option value={order.status}>{order.status.toUpperCase()} (current)</option>
                  {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={isSaving || statusSelect === order.status}
                  onClick={() => handleStatusChange(statusSelect)}
                  style={{ fontSize: 11.5, padding: "6px 12px" }}
                >
                  {isSaving ? "Saving..." : "Update"}
                </button>
              </div>
              {statusSelect === "packed" && order.status !== "packed" && (
                <p style={{ fontSize: 11, color: "#d97706", marginTop: 6, lineHeight: 1.3 }}>
                  Shiprocket shipment creation starts when you pack this order. Use Shipping Details for manual recovery if needed.
                </p>
              )}
            </div>

            <p className="panel-sub" style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.4, margin: "14px 0 14px 0" }}>
              Shiprocket scans update the status when available. If shipment creation or tracking fails, use Shipping Details for manual recovery.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isSyncing}
                onClick={handleSyncTracking}
                style={{ width: "100%", justifyContent: "center", gap: 6, fontSize: 12.5 }}
              >
                <RefreshCw size={13} className={isSyncing ? "spin-icon" : ""} />
                <span>{isSyncing ? "Syncing with Shiprocket..." : "Sync Live Tracking"}</span>
              </button>

              <Link
                to={`/shipping/${order.id}`}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center", gap: 6, fontSize: 12 }}
              >
                <Truck size={13} />
                <span>View Logistics & AWB</span>
              </Link>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="card order-panel-card">
            <div className="panel-title-wrap">
              <User size={17} className="panel-icon" />
              <h3 className="panel-title">Customer Information</h3>
            </div>
            <div style={{ margin: "6px 0 10px 0" }}>
              {order.is_guest ? (
                <span
                  className="pill-badge"
                  style={{
                    background: "var(--surface-alt)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    fontSize: 11.5
                  }}
                >
                  Guest Checkout (No Account)
                </span>
              ) : (
                <span className="pill-badge badge-gold" style={{ fontSize: 11.5 }}>
                  Registered Customer {order.user_id ? `(${order.user_id})` : ""}
                </span>
              )}
            </div>
            <div className="customer-name">{order.customer_name}</div>
            <div className="customer-contact-link">
              <a href={`mailto:${order.email}`}>{order.email}</a>
            </div>
            {order.phone && (
              <div className="customer-contact-link">
                <a href={`tel:${order.phone}`}>{order.phone}</a>
              </div>
            )}
            {(order.refund_upi_id || order.upi_id) && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8
                }}
              >
                <div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", display: "block" }}>
                    Customer UPI ID
                  </span>
                  <strong style={{ fontSize: 13, color: "#0f172a" }}>{order.refund_upi_id || order.upi_id}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(order.refund_upi_id || order.upi_id);
                    toast.success("UPI ID copied to clipboard!");
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#0284c7", padding: 4 }}
                  title="Copy UPI ID"
                >
                  <Copy size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Shipping Destination */}
          <div className="card order-panel-card">
            <div className="panel-title-wrap">
              <MapPin size={17} className="panel-icon" />
              <h3 className="panel-title">Delivery Address</h3>
            </div>
            <p className="destination-text">{order.shipping_address}</p>
            <p className="destination-sub">
              {[order.city, order.state, order.pincode].filter(Boolean).join(", ")}
            </p>
            <div className="payment-method-chip">
              Payment Mode: <strong>{order.payment_method === "COD" || !order.payment_method ? "Cash on Delivery" : (order.payment_method === "PREPAID" ? "Online Payment" : order.payment_method)}</strong>
              {(order.refund_upi_id || order.upi_id) && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
                  Customer UPI ID: <strong>{order.refund_upi_id || order.upi_id}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          {order.notes && (
            <div className="card order-panel-card">
              <div className="panel-title-wrap">
                <FileText size={17} className="panel-icon" />
                <h3 className="panel-title">Customer Instructions</h3>
              </div>
              <p className="customer-notes">"{order.notes}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 450,
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: 16, color: "#b91c1c" }}>
              Reject Cancellation / Return Request
            </h3>
            <p style={{ margin: "0 0 14px 0", fontSize: 12.5, color: "#64748b" }}>
              Please provide a clear reason for the rejection. This reason will be logged with the order audit ledger.
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Return request is outside the 7-day policy window, or item lacks required photos."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                marginBottom: 16
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isActionLoading}
                onClick={handleRejectCancellation}
                style={{ background: "#dc2626", borderColor: "#dc2626" }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Modal */}
      {activeMediaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 20
          }}
          onClick={() => setActiveMediaModal(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              type="button"
              onClick={() => setActiveMediaModal(null)}
              style={{
                position: "absolute",
                top: -36,
                right: 0,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer"
              }}
            >
              ✕ Close
            </button>
            <img
              src={activeMediaModal.url}
              alt="Return Proof Full View"
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: 8, display: "block" }}
            />
          </div>
        </div>
      )}

      {/* Official Printable Tax Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal order={order} onClose={() => setShowInvoiceModal(false)} />
      )}
    </div>
  );
}
