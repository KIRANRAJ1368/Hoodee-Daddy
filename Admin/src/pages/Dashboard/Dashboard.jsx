import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  FolderTree,
  Image as ImageIcon,
  ArrowRight,
  Shirt,
  Edit2,
  Eye,
  Tag,
  Users,
  Wallet,
  CalendarClock,
  CalendarRange,
  TrendingUp,
  Clock,
  BarChart3,
  RefreshCw,
  Store,
  RotateCcw,
  AlertCircle,
  IndianRupee,
  CheckCircle2
} from "lucide-react";
import { dashboardApi, productsApi } from "../../services/resources";
import LoadingState from "../../components/LoadingState/LoadingState";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import EmptyState from "../../components/EmptyState/EmptyState";
import ProductViewModal from "../../components/ProductViewModal/ProductViewModal";
import { formatINR } from "../../utils/formatPrice";
import "./Dashboard.css";

/* ── Animated count-up number display ── */
function StatNumber({ value, prefix = "", suffix = "" }) {
  return (
    <span className="dash-stat-number">
      {prefix}{Number(value ?? 0).toLocaleString("en-IN")}{suffix}
    </span>
  );
}

/* ── Small trend chip ── */
function TrendChip({ label, positive = true }) {
  return (
    <span className={`dash-trend-chip ${positive ? "--up" : "--neutral"}`}>
      <TrendingUp size={11} />
      {label}
    </span>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeSales, setRangeSales] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [viewing, setViewing] = useState(null);

  const fetchData = () => {
    setIsLoading(true);
    Promise.allSettled([
      dashboardApi.summary(),
      productsApi.list({ limit: 8 })
    ]).then(([sumRes, prodsRes]) => {
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data);
      if (prodsRes.status === "fulfilled") {
        const prods = Array.isArray(prodsRes.value?.data)
          ? prodsRes.value.data
          : prodsRes.value?.data?.data || [];
        setRecentProducts(prods);
      }
      setLastRefreshed(new Date());
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  async function handleApplyRange() {
    if (!fromDate || !toDate) return;
    setRangeLoading(true);
    try {
      const res = await dashboardApi.summary({ from: fromDate, to: toDate });
      setRangeSales(res.data?.rangeSales ?? null);
    } catch {
      setRangeSales(null);
    } finally {
      setRangeLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="dash-page dash-page--skeleton" aria-busy="true">
        {/* Welcome Header Skeleton */}
        <div className="dash-welcome">
          <div className="dash-welcome-left">
            <div className="dash-skeleton-box dash-skeleton-box--icon sk" />
            <div className="dash-welcome-text">
              <div className="dash-skeleton-bar dash-skeleton-bar--title sk w3" />
              <div className="dash-skeleton-bar dash-skeleton-bar--sub sk w1" />
            </div>
          </div>
          <div className="dash-skeleton-box dash-skeleton-box--btn sk" />
        </div>

        {/* 1. SALES KPI CARDS SKELETON (3 cards) */}
        <section className="dash-section">
          <div className="dash-section-head">
            <BarChart3 size={15} className="dash-section-icon" />
            <span className="dash-section-label">Sales Overview</span>
          </div>
          <div className="dash-sales-grid">
            <div className="dash-skeleton-card dash-skeleton-card--kpi sk" />
            <div className="dash-skeleton-card dash-skeleton-card--kpi sk" />
            <div className="dash-skeleton-card dash-skeleton-card--kpi sk" />
          </div>
        </section>

        {/* 2. STORE OVERVIEW SKELETON (4 cards matching Picture 2) */}
        <section className="dash-section">
          <div className="dash-section-head">
            <Store size={15} className="dash-section-icon" />
            <span className="dash-section-label">Store Overview</span>
          </div>
          <div className="dash-summary-cards">
            <div className="dash-skeleton-card dash-skeleton-card--summary sk" />
            <div className="dash-skeleton-card dash-skeleton-card--summary sk" />
            <div className="dash-skeleton-card dash-skeleton-card--summary sk" />
            <div className="dash-skeleton-card dash-skeleton-card--summary sk" />
          </div>
        </section>

        {/* 3. ORDER PIPELINE SKELETON (6 cards) */}
        <section className="dash-section">
          <div className="dash-section-head">
            <Clock size={15} className="dash-section-icon" />
            <span className="dash-section-label">Order Pipeline</span>
          </div>
          <div className="dash-summary-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="dash-skeleton-card dash-skeleton-card--pipe sk" />
            <div className="dash-skeleton-card dash-skeleton-card--pipe sk" />
            <div className="dash-skeleton-card dash-skeleton-card--pipe sk" />
            <div className="dash-skeleton-card dash-skeleton-card--pipe sk" />
            <div className="dash-skeleton-card dash-skeleton-card--pipe sk" />
            <div className="dash-skeleton-card dash-skeleton-card--pipe sk" />
          </div>
        </section>

        {/* 4. ACTIVITY & PRODUCTS SKELETON */}
        <section className="dash-section">
          <div className="dash-grid-2col">
            <div className="dash-skeleton-card dash-skeleton-card--table sk" />
            <div className="dash-skeleton-card dash-skeleton-card--table sk" />
          </div>
        </section>
      </div>
    );
  }

  /* ── Derived values ── */
  const totalSales        = summary?.totalSales ?? 0;
  const todaySales        = summary?.todaySales ?? 0;
  const pendingOrders     = summary?.pendingOrders ?? 0;
  const confirmedOrders   = summary?.confirmedOrders ?? 0;
  const packedOrders      = summary?.packedOrders ?? 0;
  const shippedOrders     = summary?.shippedOrders ?? 0;
  const orderCount        = summary?.orderCount ?? 0;
  const deliveredOrders   = summary?.deliveredOrders ?? 0;
  const cancelledOrders   = summary?.cancelledOrders ?? 0;
  const returnedOrders    = summary?.returnedOrders ?? 0;
  const activeOrders      = orderCount - cancelledOrders - returnedOrders;
  const inProgressOrders  = (confirmedOrders + packedOrders + shippedOrders + pendingOrders);
  const newContactCount   = summary?.newContactCount ?? 0;

  // New cancellation and refund metrics
  const pendingCancellationRequests = summary?.pendingCancellationRequests ?? 0;
  const pendingRefundCount          = summary?.pendingRefundCount ?? 0;
  const processedRefundCount        = summary?.processedRefundCount ?? 0;
  const totalRefundAmount           = summary?.totalRefundAmount ?? 0;
  const rtoInTransitCount           = summary?.rtoInTransitCount ?? 0;
  const rtoDeliveredCount           = summary?.rtoDeliveredCount ?? 0;
  const recentCancellations         = summary?.recentCancellations ?? [];

  const currentDateFormatted = new Date().toISOString().slice(0, 10);
  const refreshedAt = lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="dash-page">

      {/* ═══════════════════════════════════════════
          1. WELCOME HEADER
      ═══════════════════════════════════════════ */}
      <div className="dash-welcome fade">
        <div className="dash-welcome-left">
          <div className="dash-welcome-icon">
            <Store size={22} />
          </div>
          <div>
            <h1 className="dash-welcome-title">Store Dashboard</h1>
            <p className="dash-welcome-sub">
              Performance metrics, revenue summary, and catalog overview
            </p>
          </div>
        </div>
        <div className="dash-welcome-right">
          <span className="dash-refresh-hint">
            <Clock size={12} />
            Updated at {refreshedAt}
          </span>
          <button
            type="button"
            className="dash-refresh-btn"
            onClick={fetchData}
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          URGENT ATTENTION BANNER: CANCELLATIONS & REFUNDS
      ═══════════════════════════════════════════ */}
      {(pendingCancellationRequests > 0 || pendingRefundCount > 0 || rtoDeliveredCount > 0) && (
        <div className="dash-alert-banner fade" style={{ animationDelay: "60ms" }}>
          <div className="dash-alert-banner-left">
            <span className="dash-alert-pulse" />
            <div>
              <h4 className="dash-alert-title">Action Required: Pending Cancellations & Refunds</h4>
              <p className="dash-alert-sub">
                Customer cancellation requests, reverse shipments, or UPI refunds require administrative review.
              </p>
            </div>
          </div>
          <div className="dash-alert-banner-actions">
            {pendingCancellationRequests > 0 && (
              <Link to="/orders?cancellation_status=requested" className="dash-alert-pill --amber">
                ⚡ {pendingCancellationRequests} Cancel / Return Request{pendingCancellationRequests === 1 ? "" : "s"}
              </Link>
            )}
            {pendingRefundCount > 0 && (
              <Link to="/orders?refund_status=pending" className="dash-alert-pill --coral">
                💸 {pendingRefundCount} Pending UPI Refund{pendingRefundCount === 1 ? "" : "s"}
              </Link>
            )}
            {rtoDeliveredCount > 0 && (
              <Link to="/orders?cancellation_status=rto_delivered" className="dash-alert-pill --teal">
                📦 {rtoDeliveredCount} Received at Warehouse (QC Pending)
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          2. SALES KPI CARDS
      ═══════════════════════════════════════════ */}
      <section className="dash-section fade" style={{ animationDelay: "120ms" }}>
        <div className="dash-section-head">
          <BarChart3 size={15} className="dash-section-icon" />
          <span className="dash-section-label">Sales Overview</span>
        </div>

        <div className="dash-sales-grid">
          {/* Total Sales — Hero Indigo → Purple gradient card */}
          <div className="dash-kpi-card --indigo-purple">
            <div className="dash-kpi-shimmer" aria-hidden="true" />
            <div className="dash-kpi-header">
              <p className="dash-kpi-label">Total Revenue</p>
              <div className="dash-kpi-icon-box --glass">
                <Wallet size={19} />
              </div>
            </div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-value --large">{formatINR(totalSales)}</span>
            </div>
          </div>

          {/* Today's Sales — Amber → Coral gradient card */}
          <div className="dash-kpi-card --amber-coral">
            <div className="dash-kpi-shimmer" aria-hidden="true" />
            <div className="dash-kpi-header">
              <p className="dash-kpi-label">Today's Sales</p>
              <div className="dash-kpi-icon-box --glass">
                <CalendarClock size={19} />
              </div>
            </div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-value">{formatINR(todaySales)}</span>
            </div>
          </div>

          {/* Range Sales — Sky Blue → Indigo gradient card */}
          <div className="dash-kpi-card --sky-indigo">
            <div className="dash-kpi-shimmer" aria-hidden="true" />
            <div className="dash-kpi-header">
              <div>
                <p className="dash-kpi-label">Custom Period Sales</p>
                {(fromDate && toDate) && (
                  <span className="dash-kpi-range-dates">{fromDate} → {toDate}</span>
                )}
              </div>
              <div className="dash-kpi-icon-box --glass">
                <CalendarRange size={19} />
              </div>
            </div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-value">
                {rangeSales === null || rangeSales === undefined ? "—" : formatINR(rangeSales)}
              </span>
            </div>

            {/* Date filter inline */}
            <div className="dash-date-filter">
              <input
                type="date"
                className="dash-date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
              />
              <span className="dash-date-sep">→</span>
              <input
                type="date"
                className="dash-date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
              />
              <button
                type="button"
                className="dash-date-apply"
                onClick={handleApplyRange}
                disabled={rangeLoading}
              >
                {rangeLoading ? "…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. FOUR PREMIUM SUMMARY CARDS
      ═══════════════════════════════════════════ */}
      <section className="dash-section fade" style={{ animationDelay: "180ms" }}>
        <div className="dash-section-head">
          <Store size={15} className="dash-section-icon" />
          <span className="dash-section-label">Store Overview</span>
        </div>

        <div className="dash-summary-cards">

          {/* ── Total Products (Mint → Sky) ── */}
          <Link to="/products" className="dash-scard" data-accent="mint-sky">
            <div className="dash-scard-icon-col">
              <div className="dash-scard-icon-ring">
                <Shirt size={22} />
              </div>
            </div>
            <div className="dash-scard-body">
              <p className="dash-scard-label">Total Products</p>
              <p className="dash-scard-value">
                {Number(summary?.productCount ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="dash-scard-sub">
                {summary?.activeProductCount ?? 0} active in catalog
              </p>
            </div>
            <div className="dash-scard-arrow">
              <ArrowRight size={15} />
            </div>
          </Link>

          {/* ── Total Orders (Sky → Indigo) ── */}
          <Link to="/orders" className="dash-scard" data-accent="sky-indigo">
            <div className="dash-scard-icon-col">
              <div className="dash-scard-icon-ring">
                <ShoppingBag size={22} />
              </div>
            </div>
            <div className="dash-scard-body">
              <p className="dash-scard-label">Total Orders</p>
              <p className="dash-scard-value">
                {Number(summary?.orderCount ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="dash-scard-sub">
                {summary?.pendingOrders ?? 0} pending fulfillment
              </p>
            </div>
            <div className="dash-scard-arrow">
              <ArrowRight size={15} />
            </div>
          </Link>

          {/* ── Total Registered Customers (Coral → Purple) ── */}
          <Link to="/customers" className="dash-scard" data-accent="coral-purple">
            <div className="dash-scard-icon-col">
              <div className="dash-scard-icon-ring">
                <Users size={22} />
              </div>
            </div>
            <div className="dash-scard-body">
              <p className="dash-scard-label">Total Customers</p>
              <p className="dash-scard-value">
                {Number(summary?.customerCount ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="dash-scard-sub">
                Active customer accounts
              </p>
            </div>
            <div className="dash-scard-arrow">
              <ArrowRight size={15} />
            </div>
          </Link>

          {/* ── Total Categories (Amber → Coral) ── */}
          <Link to="/categories" className="dash-scard" data-accent="amber-coral">
            <div className="dash-scard-icon-col">
              <div className="dash-scard-icon-ring">
                <FolderTree size={22} />
              </div>
            </div>
            <div className="dash-scard-body">
              <p className="dash-scard-label">Product Categories</p>
              <p className="dash-scard-value">
                {Number(summary?.categoryCount ?? 0).toLocaleString("en-IN")}
              </p>
              <p className="dash-scard-sub">
                {summary?.activeCategoryCount ?? 0} active on store
              </p>
            </div>
            <div className="dash-scard-arrow">
              <ArrowRight size={15} />
            </div>
          </Link>

        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. ORDERS QUICK-STATS + PRODUCTS TABLE
      ═══════════════════════════════════════════ */}
      <section className="dash-section fade" style={{ animationDelay: "240ms" }}>
        <div className="dash-section-head">
          <ShoppingBag size={15} className="dash-section-icon" />
          <span className="dash-section-label">Order Fulfillment Summary</span>
          <span className="dash-section-date">{currentDateFormatted}</span>
        </div>

        <div className="dash-order-stats">
          <div className="dash-order-stat-card">
            <span className="dash-order-stat-label">Pending</span>
            <span className="dash-order-stat-val --warning">{pendingOrders}</span>
          </div>
          <div className="dash-order-stat-card">
            <span className="dash-order-stat-label">In Progress</span>
            <span className="dash-order-stat-val --info">{inProgressOrders}</span>
          </div>
          <div className="dash-order-stat-card">
            <span className="dash-order-stat-label">Delivered</span>
            <span className="dash-order-stat-val --success">{deliveredOrders}</span>
          </div>
          {pendingCancellationRequests > 0 && (
            <Link to="/orders?cancellation_status=requested" className="dash-order-stat-card --alert" style={{ textDecoration: "none" }}>
              <span className="dash-order-stat-label" style={{ color: "#b45309", fontWeight: 700 }}>⚡ Cancel Requests</span>
              <span className="dash-order-stat-val" style={{ color: "#b45309" }}>{pendingCancellationRequests}</span>
            </Link>
          )}
          {pendingRefundCount > 0 && (
            <Link to="/orders?refund_status=pending" className="dash-order-stat-card --refund" style={{ textDecoration: "none" }}>
              <span className="dash-order-stat-label" style={{ color: "#c2410c", fontWeight: 700 }}>💸 Due Refunds</span>
              <span className="dash-order-stat-val" style={{ color: "#c2410c" }}>{pendingRefundCount}</span>
            </Link>
          )}
          {totalRefundAmount > 0 && (
            <div className="dash-order-stat-card --settled">
              <span className="dash-order-stat-label" style={{ color: "#047857" }}>Refunds Settled</span>
              <span className="dash-order-stat-val" style={{ color: "#047857", fontSize: 16 }}>{formatINR(totalRefundAmount)}</span>
            </div>
          )}
          <div className="dash-order-stat-card">
            <span className="dash-order-stat-label">All Orders</span>
            <span className="dash-order-stat-val --dark">{orderCount}</span>
          </div>
          {newContactCount > 0 && (
            <div className="dash-order-stat-card">
              <span className="dash-order-stat-label">New Messages</span>
              <span className="dash-order-stat-val --danger">{newContactCount}</span>
            </div>
          )}
        </div>

        {/* Recent Products Table */}
        <div className="dash-products-card">
          <div className="dash-products-header">
            <h3 className="dash-products-title">Recent Products</h3>
            <Link to="/products" className="dash-products-view-all">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {recentProducts?.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Your store catalog does not contain any products yet. Add your first piece to begin selling."
            />
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th style={{ width: "48px", textAlign: "center" }}>No.</th>
                    <th style={{ width: "60px" }}>Image</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ width: "150px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.slice(0, 8).map((prod, idx) => (
                    <tr key={prod.id}>
                      <td style={{ textAlign: "center" }}>
                        <span className="dash-table-idx">{idx + 1}</span>
                      </td>
                      <td>
                        <div className="dash-table-thumb">
                          {prod.images?.[0] ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="dash-table-thumb-img"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            <Shirt size={15} color="#94A3B8" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="dash-table-prod">
                          <span className="dash-table-prod-name">{prod.name}</span>
                          <div className="dash-table-prod-meta">
                            <code className="dash-table-sku">{prod.sku}</code>
                            {prod.productType && (
                              <span className="dash-table-type">{prod.productType}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="dash-table-cats">
                          <span className="dash-table-cat-pill">
                            <Tag size={10} />
                            {prod.category || "—"}
                          </span>

                        </div>
                      </td>
                      <td>
                        <div className="dash-table-price">
                          <span className="dash-table-price-current">₹{prod.price}</span>
                          {prod.originalPrice && prod.originalPrice > prod.price && (
                            <span className="dash-table-price-mrp">₹{prod.originalPrice}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          value={prod.inStock ? "in stock" : "out of stock"}
                          label={prod.inStock ? `${prod.stockCount} in stock` : "Out of Stock"}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewing(prod)}
                            title="View product details"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <Link
                            to={`/products/${prod.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Product"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. CANCELLATION, RETURNS & REFUND ACTION CENTER
      ═══════════════════════════════════════════ */}
      <section className="dash-section">
        <div className="dash-section-head">
          <RotateCcw size={15} className="dash-section-icon" />
          <span className="dash-section-label">Cancellation & Return Action Center</span>
          <span className="dash-section-date">Live requests, reverse couriers & UPI refunds</span>
        </div>

        <div className="dash-products-card">
          <div className="dash-products-header">
            <div>
              <h3 className="dash-products-title">Recent Cancellation & Return Requests</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Pre-pack cancels, courier RTOs, reverse pickups, and pending customer refunds
              </p>
            </div>
            <Link to="/orders?cancellation_status=any" className="dash-products-view-all">
              View All Requests <ArrowRight size={13} />
            </Link>
          </div>

          {recentCancellations?.length === 0 ? (
            <div style={{ padding: "36px 24px", textAlign: "center" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px"
                }}
              >
                <CheckCircle2 size={22} />
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                No Pending Cancellations or Return Requests
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
                All customer orders are fulfilling smoothly. When a customer submits a cancellation or reverse pickup request, it will appear here instantly for review.
              </p>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th style={{ width: "48px", textAlign: "center" }}>No.</th>
                    <th>Order Reference</th>
                    <th>Customer</th>
                    <th>Type & Reason</th>
                    <th>Pipeline Status</th>
                    <th>Refund Status</th>
                    <th style={{ width: "130px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCancellations.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center" }}>
                        <span className="dash-table-idx">{idx + 1}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <code
                            style={{
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#0f172a",
                              background: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: 4,
                              display: "inline-block"
                            }}
                          >
                            {item.order_number}
                          </code>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Total: ₹{Number(item.total).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="dash-table-prod">
                          <span className="dash-table-prod-name">{item.customer_name}</span>
                          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                            {item.phone || item.email}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize" }}>
                            {item.cancellation_type === "post_delivery"
                              ? "Post-Delivery Return"
                              : item.cancellation_type === "in_transit"
                              ? "In-Transit RTO"
                              : "Pre-Pack Cancel"}
                          </span>
                          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                            {item.cancellation_reason || "Customer requested"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                              display: "inline-block",
                              whiteSpace: "nowrap",
                              background:
                                item.cancellation_status === "requested" ? "#fef3c7" :
                                item.cancellation_status === "approved" ? "#e0f2fe" :
                                item.cancellation_status === "rto_in_transit" ? "#f3e8ff" :
                                item.cancellation_status === "rto_delivered" ? "#ccfbf1" :
                                item.cancellation_status === "completed" ? "#dcfce7" : "#fee2e2",
                              color:
                                item.cancellation_status === "requested" ? "#b45309" :
                                item.cancellation_status === "approved" ? "#0369a1" :
                                item.cancellation_status === "rto_in_transit" ? "#7e22ce" :
                                item.cancellation_status === "rto_delivered" ? "#0f766e" :
                                item.cancellation_status === "completed" ? "#15803d" : "#b91c1c"
                            }}
                          >
                            {item.cancellation_status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {item.refund_status === "pending" ? (
                            <>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#c2410c" }}>
                                ⚡ Pending: ₹{Number(item.refund_amount || item.total).toFixed(2)}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                UPI: {item.refund_upi_id || "Awaiting Details"}
                              </span>
                            </>
                          ) : item.refund_status === "processed" ? (
                            <>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#047857" }}>
                                ✓ Settled: ₹{Number(item.refund_amount || item.total).toFixed(2)}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                UTR: {item.refund_utr_number || "Completed"}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                              {item.refund_status || "Not Required"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/orders/${item.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: "6px 12px",
                            fontWeight: 600,
                            background: item.cancellation_status === "requested" || item.refund_status === "pending" ? "#fffbeb" : undefined,
                            borderColor: item.cancellation_status === "requested" || item.refund_status === "pending" ? "#f59e0b" : undefined,
                            color: item.cancellation_status === "requested" || item.refund_status === "pending" ? "#b45309" : undefined
                          }}
                        >
                          <Eye size={13} />
                          <span>Action</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {viewing && (
        <ProductViewModal product={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
