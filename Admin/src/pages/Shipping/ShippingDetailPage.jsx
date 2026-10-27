import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Truck, MapPin, Package, Send, CheckCircle, Clock, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react";
import { shippingApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState/LoadingState";
import { formatINR } from "../../utils/formatPrice";
import "./Shipping.css";

const SHIPPING_STAGES = [
  { value: "pending_dispatch", label: "Pending Dispatch", desc: "Order acknowledged; preparing in packaging center" },
  { value: "manifested", label: "Manifested / AWB Ready", desc: "Shiprocket shipment generated & courier pickup scheduled" },
  { value: "in_transit", label: "In Transit", desc: "Dispatched from origin hub; on express transit" },
  { value: "out_for_delivery", label: "Out for Delivery", desc: "With local courier agent for doorstep delivery" },
  { value: "delivered", label: "Delivered", desc: "Successfully delivered and acknowledged by recipient" },
  { value: "rto", label: "RTO / Returned", desc: "Returned to dispatch hub" }
];

export default function ShippingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingAwb, setIsGeneratingAwb] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = useToast();

  async function load() {
    setIsLoading(true);
    try {
      const { data } = await shippingApi.getById(id);
      setOrder(data);
    } catch (err) {
      toast.error(err.message || "Failed to load shipment details.");
      navigate("/shipping");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const res = await shippingApi.updateStatus(id, { shipping_status: newStatus });
      setOrder(res.data);
      toast.success(res.message || `Shipping status updated to "${newStatus}"`);
    } catch (err) {
      toast.error(err.message || "Failed to update shipping status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateAwb = async () => {
    setIsGeneratingAwb(true);
    try {
      const res = await shippingApi.generateAwb(id);
      setOrder(res.data);
      toast.success(res.message || "Shiprocket AWB successfully created!");
    } catch (err) {
      toast.error(err.message || "Failed to generate Shiprocket AWB.");
    } finally {
      setIsGeneratingAwb(false);
    }
  };

  const handleSyncTracking = async () => {
    setIsSyncing(true);
    try {
      const res = await shippingApi.syncTracking(id);
      setOrder(res.data);
      toast.success(res.message || "Tracking status updated from Shiprocket!");
    } catch (err) {
      toast.error(err.message || "Failed to sync tracking with Shiprocket.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) return <LoadingState label="Loading logistics and tracking information..." />;
  if (!order) return null;

  const currentStatus = order.shipping_status || "pending_dispatch";
  const awb = order.awb_code || order.tracking_number;
  const statusIndex = SHIPPING_STAGES.findIndex((s) => s.value === currentStatus);
  const isDelivered = currentStatus === "delivered";
  const isDispatched = currentStatus === "in_transit" || currentStatus === "manifested";

  return (
    <div className="shipping-detail-page">
      {/* Top Header */}
      <div className="order-detail-header" style={{ marginBottom: 24 }}>
        <Link to="/shipping" className="product-back-link">
          <ArrowLeft size={16} />
          <span>Back to Shipping</span>
        </Link>
        <div className="order-header-main-line">
          <div
            className="order-header-title-group"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 className="page-title">Shipment {order.order_number}</h1>
              {awb && <span className="awb-badge">AWB: {awb}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link
                to={`/orders/${order.id}`}
                className="btn btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Package size={16} />
                <span>View Full Order {order.order_number}</span>
              </Link>
            </div>
          </div>
          <p className="page-subtitle">
            Courier Partner: <strong>{order.courier_name || "Shiprocket Express"}</strong> • Freight Fee:{" "}
            <strong>{Number(order.shipping_fee) === 0 ? "FREE" : formatINR(order.shipping_fee)}</strong> • ETA:{" "}
            <strong>{order.estimated_delivery || "3–5 Business Days"}</strong>
          </p>
        </div>
      </div>

      <div className="shipping-detail-grid">
        {/* Left Column: Live Shipping Timeline & Shipped Items */}
        <div className="shipping-detail-main">
          {/* Timeline Card */}
          <div className="card shipping-timeline-card">
            <div className="panel-title-wrap" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
              <Truck size={18} className="panel-icon" />
              <h3 className="panel-title">Shipment Progress & Tracking</h3>
            </div>

            <div className="shipping-timeline">
              {SHIPPING_STAGES.slice(0, 5).map((stage, idx) => {
                const isCompleted = statusIndex >= idx;
                const isActive = statusIndex === idx;
                return (
                  <div
                    key={stage.value}
                    className={`shipping-timeline-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  >
                    <div className="shipping-timeline-dot">{isCompleted ? "✓" : idx + 1}</div>
                    <div className="shipping-step-title">{stage.label}</div>
                    <div className="shipping-step-desc">{stage.desc}</div>
                    {isActive && (
                      <div className="shipping-step-time" style={{ color: "#d97706", fontWeight: 600 }}>
                        Current Status
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipped Parcels / Items Preview */}
          <div className="card" style={{ marginTop: 20, padding: 20 }}>
            <div className="panel-title-wrap" style={{ marginBottom: 14 }}>
              <Package size={17} className="panel-icon" />
              <h3 className="panel-title">Parcel Items ({order.items?.length || 0})</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(order.items || []).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--surface-alt, #f8fafc)",
                    borderRadius: "6px",
                    border: "1px solid var(--border)"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, color: "var(--text-main)" }}>{item.product_name_snapshot}</strong>
                    <div className="cell-muted" style={{ fontSize: 11.5 }}>
                      SKU: {item.sku_snapshot || "—"} • Size: {item.size || "Standard"} • Color: {item.color || "Standard"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Qty: {item.quantity}</span>
                    <div className="cell-muted" style={{ fontSize: 11.5 }}>
                      ₹{(Number(item.unit_price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Origin, Destination & Logistics Controls */}
        <div className="shipping-detail-sidebar">
          {/* Shiprocket Actions Panel */}
          <div className="card order-panel-card" style={{ padding: 18 }}>
            <div className="panel-title-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} className="panel-icon" />
                <h3 className="panel-title">Shiprocket Dispatch</h3>
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
                ⚡ Live Auto-Track
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                Current Logistics Milestone:
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  background: isDelivered ? "#f0fdf4" : isDispatched ? "#eff6ff" : "#fffbeb",
                  border: `1.5px solid ${isDelivered ? "#bbf7d0" : isDispatched ? "#bfdbfe" : "#fde68a"}`,
                  borderRadius: "8px"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: isDelivered ? "#166534" : isDispatched ? "#1e40af" : "#92400e", textTransform: "capitalize" }}>
                  {currentStatus.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                  {SHIPPING_STAGES.find((s) => s.value === currentStatus)?.desc || "Courier tracking milestone"}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.4 }}>
              Shiprocket checkpoints update these milestones. If a scan is missing, set the latest confirmed status manually.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Set status manually
                <select value={currentStatus} disabled={isUpdating} onChange={(e) => handleStatusChange(e.target.value)} style={{ display: "block", width: "100%", marginTop: 5, padding: 9 }}>
                  {SHIPPING_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                </select>
              </label>
              {awb && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%", justifyContent: "center", gap: 6, fontSize: 12.5 }}
                  disabled={isSyncing}
                  onClick={handleSyncTracking}
                >
                  <RefreshCw size={13} className={isSyncing ? "spin-icon" : ""} />
                  <span>{isSyncing ? "Syncing from Shiprocket..." : "Sync Live Tracking Scans"}</span>
                </button>
              )}

              {!awb ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={isGeneratingAwb}
                  onClick={handleGenerateAwb}
                >
                  <Send size={14} />
                  <span>{isGeneratingAwb ? "Pushing to Shiprocket..." : "Generate Shiprocket AWB"}</span>
                </button>
              ) : (
                <div
                  style={{
                    padding: "10px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "6px",
                    textAlign: "center"
                  }}
                >
                  <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                    ✓ AWB Active on Shiprocket
                  </span>
                  <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    {awb}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="card order-panel-card" style={{ marginTop: 16, padding: 18 }}>
            <div className="panel-title-wrap" style={{ marginBottom: 10 }}>
              <MapPin size={17} className="panel-icon" />
              <h3 className="panel-title">Delivery Destination</h3>
            </div>
            <strong style={{ display: "block", fontSize: 13, color: "var(--text-main)" }}>
              {order.customer_name}
            </strong>
            <p className="destination-text" style={{ fontSize: 12.5, margin: "4px 0" }}>
              {order.shipping_address}
            </p>
            <p className="destination-sub" style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {[order.city, order.state, order.pincode].filter(Boolean).join(", ")}
            </p>
            {order.phone && (
              <p style={{ fontSize: 12, marginTop: 6 }}>
                Phone: <a href={`tel:${order.phone}`}>{order.phone}</a>
              </p>
            )}
          </div>

          {/* Origin Hub */}
          <div className="card order-panel-card" style={{ marginTop: 16, padding: 18 }}>
            <div className="panel-title-wrap" style={{ marginBottom: 10 }}>
              <Truck size={17} className="panel-icon" />
              <h3 className="panel-title">Origin Dispatch Hub</h3>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-main)", fontWeight: 600 }}>
              HooDee Daddy Logistics & Dispatch Center
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0" }}>
              123, Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu - 641004
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
