import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingBag, Eye, Filter, IndianRupee, Clock, CheckCircle2, UserCheck, UserX, Truck } from "lucide-react";
import { ordersApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import Pagination from "../../components/Pagination/Pagination";

const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  const statusParam = searchParams.get("status") || "";
  const customerTypeParam = searchParams.get("customerType") || "";
  const cancellationStatusParam = searchParams.get("cancellation_status") || "";
  const refundStatusParam = searchParams.get("refund_status") || "";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [status, setStatus] = useState(statusParam);
  const [customerType, setCustomerType] = useState(customerTypeParam);
  const [cancellationStatus, setCancellationStatus] = useState(cancellationStatusParam);
  const [refundStatus, setRefundStatus] = useState(refundStatusParam);
  const [search, setSearch] = useState(searchParam);
  const [page, setPage] = useState(pageParam);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Sync internal state when URL search params change
  useEffect(() => {
    setStatus(searchParams.get("status") || "");
    setCustomerType(searchParams.get("customerType") || "");
    setCancellationStatus(searchParams.get("cancellation_status") || "");
    setRefundStatus(searchParams.get("refund_status") || "");
    setSearch(searchParams.get("search") || "");
    setPage(parseInt(searchParams.get("page") || "1", 10) || 1);
  }, [searchParams]);

  function updateFilters(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        next.set(key, val);
      } else {
        next.delete(key);
      }
    });
    setSearchParams(next);
  }

  async function load() {
    setIsLoading(true);
    try {
      const isGuestParam =
        customerType === "guest" ? true : customerType === "registered" ? false : undefined;

      const { data, meta } = await ordersApi.list({
        status: status || undefined,
        cancellation_status: cancellationStatus || undefined,
        refund_status: refundStatus || undefined,
        search: search.trim() || undefined,
        is_guest: isGuestParam,
        page,
        limit: 10
      });
      setOrders(data || []);
      setMeta(meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, customerType, cancellationStatus, refundStatus, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: search.trim(), page: 1 });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Customer Orders</span>
            <span className="pill-badge badge-gold">{meta.total} Order{meta.total === 1 ? "" : "s"}</span>
          </h1>
          <p className="page-subtitle">
            Move each order through the simple fulfillment flow. Open an order for shipment tracking, cancellations, and refunds.
          </p>
        </div>
      </div>

      <div className="card">
        {/* Quick Filter Tabs for Cancellations & Returns */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px clamp(12px, 3vw, 22px)",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            maxWidth: "100%",
            minWidth: 0
          }}
        >
          {[
            { label: "All Orders", key: "all" },
            { label: "⚡ Pending Cancel/Return Requests", key: "cancellation_requested" },
            { label: "💸 Pending Refunds (UPI)", key: "refund_pending" },
            { label: "🚚 RTO In-Transit", key: "rto_in_transit" },
            { label: "📦 Restocked / At Warehouse", key: "rto_delivered" },
            { label: "✅ Completed Refunds", key: "refund_processed" },
            { label: "All Cancellations & Returns", key: "cancellation_any" }
          ].map((tab) => {
            const isSelected =
              (tab.key === "all" && !cancellationStatus && !refundStatus) ||
              (tab.key === "cancellation_requested" && cancellationStatus === "requested") ||
              (tab.key === "refund_pending" && refundStatus === "pending") ||
              (tab.key === "rto_in_transit" && cancellationStatus === "rto_in_transit") ||
              (tab.key === "rto_delivered" && cancellationStatus === "rto_delivered") ||
              (tab.key === "refund_processed" && (refundStatus === "processed" || cancellationStatus === "completed")) ||
              (tab.key === "cancellation_any" && cancellationStatus === "any");

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.key === "all") {
                    updateFilters({ cancellation_status: "", refund_status: "", page: 1 });
                  } else if (tab.key === "cancellation_requested") {
                    updateFilters({ cancellation_status: "requested", refund_status: "", page: 1 });
                  } else if (tab.key === "refund_pending") {
                    updateFilters({ cancellation_status: "", refund_status: "pending", page: 1 });
                  } else if (tab.key === "rto_in_transit") {
                    updateFilters({ cancellation_status: "rto_in_transit", refund_status: "", page: 1 });
                  } else if (tab.key === "rto_delivered") {
                    updateFilters({ cancellation_status: "rto_delivered", refund_status: "", page: 1 });
                  } else if (tab.key === "refund_processed") {
                    updateFilters({ cancellation_status: "", refund_status: "processed", page: 1 });
                  } else if (tab.key === "cancellation_any") {
                    updateFilters({ cancellation_status: "any", refund_status: "", page: 1 });
                  }
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  border: isSelected ? "1.5px solid var(--accent, #faa703)" : "1px solid var(--border)",
                  background: isSelected ? "rgba(250, 167, 3, 0.12)" : "var(--surface-alt)",
                  color: isSelected ? "var(--text-main)" : "var(--text-muted)",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px clamp(12px, 3vw, 22px)",
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
            background: "var(--surface)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", width: "100%", maxWidth: "100%" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", flex: "1 1 200px", maxWidth: "100%" }}>
              <input
                type="text"
                placeholder="Search order #, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "7px 12px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  fontSize: "13px",
                  minWidth: 140,
                  maxWidth: "100%",
                  flex: "1 1 140px"
                }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: "7px 12px" }}>
                Search
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", maxWidth: "100%" }}>
              <Filter size={15} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)", whiteSpace: "nowrap" }}>Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                style={{
                  minWidth: 140,
                  maxWidth: "100%",
                  flex: "1 1 140px",
                  padding: "7px 10px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                <option value="">All Fulfillment Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Checkout Type:</span>
              <select
                value={customerType}
                onChange={(e) => {
                  setPage(1);
                  setCustomerType(e.target.value);
                }}
                style={{
                  minWidth: 170,
                  padding: "7px 10px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                <option value="">All Orders</option>
                <option value="registered">Registered Customers Only</option>
                <option value="guest">Guest Checkouts Only</option>
              </select>
            </div>
          </div>

          <span className="hint">
            Page {meta.page} of {meta.totalPages || 1}
          </span>
        </div>

        <DataTable
          isLoading={isLoading}
          rows={orders}
          rowKey={(row) => row.id}
          emptyTitle="No orders found"
          emptyDescription="When customers place orders on the ZMW storefront, they will immediately appear here for fulfillment."
          columns={[
            {
              key: "order_number",
              label: "Order Reference",
              width: "165px",
              render: (row) => (
                <code
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: "#f8fafc",
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    display: "inline-block"
                  }}
                >
                  {row.order_number}
                </code>
              )
            },
            {
              key: "customer_name",
              label: "Customer & Destination",
              width: "165px",
              render: (row) => (
                <div>
                  <div className="cell-title" style={{ fontSize: 13, fontWeight: 600 }}>{row.customer_name}</div>
                  <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 2, whiteSpace: "nowrap" }}>
                    {row.city ? `${row.city}, ` : ""}{row.state || "India"}
                  </div>
                </div>
              )
            },
            {
              key: "customer_type",
              label: "Account Type",
              width: "135px",
              align: "center",
              render: (row) =>
                row.is_guest ? (
                  <span
                    className="pill-badge"
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                      fontSize: 11,
                      whiteSpace: "nowrap"
                    }}
                  >
                    Guest Checkout
                  </span>
                ) : (
                  <span
                    className="pill-badge"
                    style={{
                      background: "#eef2ff",
                      color: "#4f46e5",
                      border: "1px solid #c7d2fe",
                      fontSize: 11,
                      whiteSpace: "nowrap"
                    }}
                  >
                    Registered Client
                  </span>
                )
            },
            {
              key: "email",
              label: "Customer Contact",
              width: "195px",
              render: (row) => (
                <div style={{ maxWidth: 190 }}>
                  <div
                    style={{
                      color: "var(--text-main)",
                      fontWeight: 500,
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                    title={row.email}
                  >
                    {row.email}
                  </div>
                  <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 1, whiteSpace: "nowrap" }}>
                    {row.phone || "—"}
                  </div>
                </div>
              )
            },
            {
              key: "payment_method",
              label: "Payment",
              width: "85px",
              align: "center",
              render: (row) => (
                <span
                  className="pill-badge"
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    fontSize: 11,
                    whiteSpace: "nowrap"
                  }}
                >
                  {row.payment_method || "COD"}
                </span>
              )
            },
            {
              key: "total",
              label: "Order Amount",
              width: "115px",
              align: "right",
              render: (row) => (
                <span style={{ fontWeight: 800, color: "var(--text-main)", fontSize: 14, whiteSpace: "nowrap" }}>
                  ₹{Number(row.total).toFixed(2)}
                </span>
              )
            },
            {
              key: "status",
              label: "Pipeline Status",
              width: "180px",
              align: "center",
              render: (row) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "center" }}>
                  <StatusBadge value={row.status} />

                  {/* Cancellation / Return Pipeline Badge */}
                  {row.cancellation_status && row.cancellation_status !== "none" && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        whiteSpace: "nowrap",
                        background:
                          row.cancellation_status === "requested" ? "#fef3c7" :
                          row.cancellation_status === "approved" ? "#e0f2fe" :
                          row.cancellation_status === "rto_in_transit" ? "#f3e8ff" :
                          row.cancellation_status === "rto_delivered" ? "#ccfbf1" :
                          row.cancellation_status === "completed" ? "#dcfce7" : "#fee2e2",
                        color:
                          row.cancellation_status === "requested" ? "#b45309" :
                          row.cancellation_status === "approved" ? "#0369a1" :
                          row.cancellation_status === "rto_in_transit" ? "#7e22ce" :
                          row.cancellation_status === "rto_delivered" ? "#0f766e" :
                          row.cancellation_status === "completed" ? "#15803d" : "#b91c1c",
                        border: `1px solid ${
                          row.cancellation_status === "requested" ? "#fde68a" :
                          row.cancellation_status === "approved" ? "#bae6fd" :
                          row.cancellation_status === "rto_in_transit" ? "#e9d5ff" :
                          row.cancellation_status === "rto_delivered" ? "#99f6e4" :
                          row.cancellation_status === "completed" ? "#bbf7d0" : "#fecaca"
                        }`
                      }}
                    >
                      {row.cancellation_type === "post_delivery" ? "Return" : "Cancel"}: {row.cancellation_status.replace(/_/g, " ")}
                    </span>
                  )}

                  {/* Customer UPI Refund Status Badge */}
                  {row.refund_status && row.refund_status !== "not_required" && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "4px",
                        letterSpacing: "0.2px",
                        whiteSpace: "nowrap",
                        background:
                          row.refund_status === "pending" ? "#fff7ed" :
                          row.refund_status === "processed" ? "#ecfdf5" : "#fef2f2",
                        color:
                          row.refund_status === "pending" ? "#c2410c" :
                          row.refund_status === "processed" ? "#047857" : "#b91c1c",
                        border: `1px solid ${
                          row.refund_status === "pending" ? "#ffedd5" :
                          row.refund_status === "processed" ? "#a7f3d0" : "#fecaca"
                        }`
                      }}
                    >
                      {row.refund_status === "pending"
                        ? `⚡ Refund Due: ₹${Number(row.refund_amount || row.total).toFixed(0)}`
                        : row.refund_status === "processed"
                        ? `✓ Refunded: ₹${Number(row.refund_amount || row.total).toFixed(0)}`
                        : "Refund Failed"}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: "created_at",
              label: "Date Placed",
              width: "115px",
              align: "center",
              render: (row) => (
                <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )
            },
            {
              key: "actions",
              label: "Actions",
              width: "155px",
              align: "right",
              render: (row) => {
                const isActionNeeded =
                  row.cancellation_status === "requested" ||
                  row.refund_status === "pending" ||
                  row.cancellation_status === "rto_delivered";

                return (
                  <div className="table-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    <Link
                      to={`/orders/${row.id}`}
                      className="btn btn-secondary btn-sm"
                      title={isActionNeeded ? "Action Required on this Order" : "View Order Details"}
                      style={
                        isActionNeeded
                          ? {
                              background: "#fffbeb",
                              color: "#b45309",
                              borderColor: "#f59e0b",
                              fontWeight: 700
                            }
                          : undefined
                      }
                    >
                      <Eye size={13} />
                      <span>{isActionNeeded ? "Review" : "Order"}</span>
                    </Link>
                    <Link
                      to={`/shipping/${row.id}`}
                      className="btn btn-secondary btn-sm"
                      title="View Shipping & Tracking"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <Truck size={13} />
                      <span>Shipping</span>
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
