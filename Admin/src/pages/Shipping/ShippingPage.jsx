import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Eye, Filter, Search, Send, CheckCircle2, Clock, MapPin, Box } from "lucide-react";
import { shippingApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import Pagination from "../../components/Pagination/Pagination";
import { formatINR } from "../../utils/formatPrice";
import "./Shipping.css";

const SHIPPING_STATUSES = [
  { value: "pending_dispatch", label: "Pending Dispatch" },
  { value: "manifested", label: "Manifested / AWB Ready" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "rto", label: "Returned / RTO" }
];

export default function ShippingPage() {
  const [shipments, setShipments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [shippingStatus, setShippingStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingAwbId, setGeneratingAwbId] = useState(null);
  const toast = useToast();

  async function load() {
    setIsLoading(true);
    try {
      const { data, meta } = await shippingApi.list({
        shipping_status: shippingStatus || undefined,
        search: search.trim() || undefined,
        page,
        limit: 10
      });
      setShipments(data || []);
      setMeta(meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load shipments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingStatus, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleGenerateAwb = async (orderId) => {
    setGeneratingAwbId(orderId);
    try {
      const res = await shippingApi.generateAwb(orderId);
      toast.success(res.message || "Shiprocket AWB generated successfully!");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to generate Shiprocket AWB.");
    } finally {
      setGeneratingAwbId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Shipping & Logistics</span>
            <span className="pill-badge badge-gold">{meta.total} Shipment{meta.total === 1 ? "" : "s"}</span>
          </h1>
          <p className="page-subtitle">
            Manage parcel dispatch, generate Shiprocket AWBs, track express courier delivery, and review delivery destinations.
          </p>
        </div>
      </div>

      <div className="card">
        {/* Filter and Search Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 22px",
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
            background: "var(--surface)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", minWidth: 0, maxWidth: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0, maxWidth: "100%" }}>
              <Filter size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Logistics Status:</span>
              <select
                value={shippingStatus}
                onChange={(e) => {
                  setPage(1);
                  setShippingStatus(e.target.value);
                }}
                style={{
                  minWidth: 150,
                  maxWidth: "100%",
                  flex: "1 1 150px",
                  padding: "7px 10px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                <option value="">All Shipping Stages</option>
                {SHIPPING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "100%", minWidth: 0, flex: "1 1 auto" }}>
            <input
              type="text"
              placeholder="Search Order, AWB, Pincode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "7px 12px",
                fontSize: "13px",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface)",
                minWidth: "140px",
                maxWidth: "100%",
                flex: "1 1 160px"
              }}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>
        </div>

        <DataTable
          isLoading={isLoading}
          rows={shipments}
          rowKey={(row) => row.id}
          emptyTitle="No shipments found"
          emptyDescription="No shipments matching the selected logistics filter."
          columns={[
            {
              key: "order_number",
              label: "Shipment / Order",
              width: "160px",
              render: (row) => {
                const dateVal = row.createdAt || row.created_at;
                const formattedDate = dateVal && !isNaN(new Date(dateVal).getTime())
                  ? new Date(dateVal).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                  : "—";
                return (
                  <div>
                    <Link
                      to={`/shipping/${row.id}`}
                      style={{ fontWeight: 700, color: "var(--primary, #c5a880)", fontSize: 13.5 }}
                    >
                      {row.order_number}
                    </Link>
                    <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      Placed: {formattedDate}
                    </div>
                  </div>
                );
              }
            },
            {
              key: "recipient",
              label: "Recipient & Destination",
              render: (row) => (
                <div>
                  <strong style={{ color: "var(--text-main)", fontSize: 13 }}>{row.customer_name}</strong>
                  <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                    {[row.city, row.state, row.pincode].filter(Boolean).join(", ") || row.shipping_address}
                  </div>
                </div>
              )
            },
            {
              key: "courier",
              label: "Courier & AWB",
              width: "190px",
              render: (row) => {
                const awb = row.awb_code || row.tracking_number;
                return (
                  <div>
                    <span className="carrier-chip">
                      <Truck size={12} />
                      <span>{row.courier_name || "Shiprocket Express"}</span>
                    </span>
                    <div style={{ marginTop: 4 }}>
                      {awb ? (
                        <span className="awb-badge" title="Tracking AWB">
                          AWB: {awb}
                        </span>
                      ) : (
                        <span className="cell-muted" style={{ fontSize: 11.5 }}>
                          AWB Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            },
            {
              key: "shipping_fee",
              label: "Freight Fee",
              width: "100px",
              align: "right",
              render: (row) => (
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {Number(row.shipping_fee) === 0 ? "FREE" : formatINR(row.shipping_fee)}
                </span>
              )
            },
            {
              key: "shipping_status",
              label: "Delivery Status",
              width: "150px",
              align: "center",
              render: (row) => {
                const status = row.shipping_status || "pending_dispatch";
                const isDelivered = status === "delivered";
                const isDispatched = status === "in_transit" || status === "manifested";
                return (
                  <span
                    className="pill-badge"
                    style={{
                      background: isDelivered ? "#ecfdf5" : isDispatched ? "#eff6ff" : "#fffbeb",
                      color: isDelivered ? "#059669" : isDispatched ? "#2563eb" : "#d97706",
                      border: `1px solid ${isDelivered ? "#a7f3d0" : isDispatched ? "#bfdbfe" : "#fde68a"}`,
                      fontSize: 11.5,
                      textTransform: "capitalize"
                    }}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                );
              }
            },
            {
              key: "actions",
              label: "Logistics Actions",
              width: "180px",
              align: "right",
              render: (row) => {
                const hasAwb = Boolean(row.awb_code || row.tracking_number);
                return (
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                    {!hasAwb ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={generatingAwbId === row.id}
                        onClick={() => handleGenerateAwb(row.id)}
                        title="Generate Shiprocket AWB"
                        style={{ fontSize: 12, padding: "5px 9px" }}
                      >
                        <Send size={12} />
                        <span>{generatingAwbId === row.id ? "Assigning..." : "Shiprocket AWB"}</span>
                      </button>
                    ) : null}
                    <Link
                      to={`/shipping/${row.id}`}
                      className="btn btn-secondary btn-sm"
                      title="Manage Shipment Details"
                      style={{ fontSize: 12, padding: "5px 9px" }}
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </Link>
                  </div>
                );
              }
            }
          ]}
        />

        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </div>
    </div>
  );
}
