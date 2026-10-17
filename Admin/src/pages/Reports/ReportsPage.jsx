import { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  FileSpreadsheet,
  Download,
  IndianRupee,
  ShoppingBag,
  RotateCcw
} from "lucide-react";
import { reportsApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import PaginatedDataTable from "../../components/PaginatedDataTable/PaginatedDataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import "./ReportsPage.css";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales"); // 'sales' | 'products' | 'orders'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [salesData, setSalesData] = useState(null);
  const [productsData, setProductsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);

  const toast = useToast();

  async function loadData() {
    setIsLoading(true);
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    try {
      if (activeTab === "sales") {
        const res = await reportsApi.sales(params);
        setSalesData(res.data || null);
      } else if (activeTab === "products") {
        const res = await reportsApi.products(params);
        setProductsData(res.data || []);
      } else if (activeTab === "orders") {
        const res = await reportsApi.orders(params);
        setOrdersData(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, fromDate, toDate]);

  function exportCsv() {
    let headers = [];
    let rows = [];
    let filename = `ZMW_${activeTab}_report_${new Date().toISOString().split("T")[0]}.csv`;

    if (activeTab === "sales") {
      headers = ["Date", "Orders Count", "Subtotal (INR)", "Discounts (INR)", "Shipping (INR)", "Total (INR)"];
      const trend = salesData?.dailyTrend || salesData?.breakdown || [];
      rows = trend.map((row) => [
        row.date,
        row.ordersCount ?? row.count ?? 0,
        row.subtotal ?? row.grossSales ?? 0,
        row.discounts ?? 0,
        row.shipping ?? 0,
        row.total ?? row.netSales ?? 0
      ]);
    } else if (activeTab === "products") {
      headers = ["Product Name", "Units Sold", "Revenue Generated (INR)", "Current Stock"];
      rows = productsData.map((p) => [
        `"${(p.productName || p.product_name || "").replace(/"/g, '""')}"`,
        p.unitsSold ?? p.units_sold ?? 0,
        p.revenue || 0,
        p.currentStock ?? p.stock_count ?? "N/A"
      ]);
    } else if (activeTab === "orders") {
      headers = [
        "Order Number",
        "Date",
        "Customer Name",
        "Email",
        "Phone",
        "Status",
        "Payment Method",
        "Amount (INR)"
      ];
      rows = ordersData.map((o) => [
        o.orderNumber || o.order_number,
        o.date || o.order_date,
        `"${(o.customerName || o.customer_name || "").replace(/"/g, '""')}"`,
        o.customerEmail || o.customer_email,
        o.customerPhone || o.customer_phone || "",
        o.status,
        o.paymentMethod || o.payment_method,
        o.total || o.total_amount
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => (Array.isArray(e) ? e.join(",") : ""))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully");
  }

  const dailyTrendList = salesData?.dailyTrend || salesData?.breakdown || [];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Analytics & Reports</span>
            <span className="pill-badge badge-gold">Intelligence</span>
          </h1>
          <p className="page-subtitle">
            Track gross & net revenue, sales trends, inventory turnover, and export detailed CSV reports.
          </p>
        </div>
        <button type="button" className="btn btn-accent btn-lg" onClick={exportCsv}>
          <Download size={17} />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Tabs and Filters Toolbar */}
      <div className="reports-toolbar">
        <div className="reports-tabs">
          <button
            type="button"
            className={`report-tab-btn ${activeTab === "sales" ? "active" : ""}`}
            onClick={() => setActiveTab("sales")}
          >
            <TrendingUp size={16} />
            <span>Sales Report</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <Package size={16} />
            <span>Product Performance</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <FileSpreadsheet size={16} />
            <span>Orders Report</span>
          </button>
        </div>

        <div className="reports-filters">
          <div className="reports-filter-group">
            <span className="reports-filter-label">From:</span>
            <input
              type="date"
              className="reports-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="reports-filter-group">
            <span className="reports-filter-label">To:</span>
            <input
              type="date"
              className="reports-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              className="reports-reset-btn"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* SALES TAB CONTENT */}
      {activeTab === "sales" && salesData && (
        <>
          <div className="reports-kpis-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
                <IndianRupee size={22} />
              </div>
              <div className="kpi-content">
                <div className="kpi-title">Gross Sales</div>
                <div className="kpi-val">₹{Number(salesData.summary?.grossSales ?? salesData.grossSales ?? 0).toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#fef3c7", color: "#d97706" }}>
                <TrendingUp size={22} />
              </div>
              <div className="kpi-content">
                <div className="kpi-title">Net Revenue</div>
                <div className="kpi-val">₹{Number(salesData.summary?.netRevenue ?? salesData.netSales ?? 0).toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <ShoppingBag size={22} />
              </div>
              <div className="kpi-content">
                <div className="kpi-title">Total Orders</div>
                <div className="kpi-val">{salesData.summary?.totalOrders ?? salesData.ordersCount ?? 0}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                <IndianRupee size={22} />
              </div>
              <div className="kpi-content">
                <div className="kpi-title" title="Average Order Value">Avg Order Value</div>
                <div className="kpi-val">₹{Number(salesData.summary?.averageOrderValue ?? salesData.aov ?? 0).toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap" style={{ background: "#fef2f2", color: "#dc2626" }}>
                <RotateCcw size={22} />
              </div>
              <div className="kpi-content">
                <div className="kpi-title">Cancellations</div>
                <div className="kpi-val">{salesData.summary?.cancelledCount ?? salesData.cancelledCount ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="card report-table-card">
            <div className="report-table-header">
              <div>
                <h3 className="report-table-title">Daily Revenue Breakdown</h3>
                <p className="report-table-subtitle">Aggregated orders, subtotal and net revenue per calendar day</p>
              </div>
              <span className="report-table-count">
                {dailyTrendList.length} Recorded {dailyTrendList.length === 1 ? "Day" : "Days"}
              </span>
            </div>
            <PaginatedDataTable
              isLoading={isLoading}
              rows={dailyTrendList}
              rowKey={(row) => row.date}
              emptyTitle="No sales records in range"
              emptyDescription="Orders placed in this time period will be aggregated here."
              columns={[
                {
                  header: "Date",
                  align: "left",
                  width: "25%",
                  cell: (row) => <span className="report-date-cell">{row.date}</span>
                },
                {
                  header: "Orders Count",
                  align: "center",
                  width: "20%",
                  cell: (row) => (
                    <span className="report-badge-neutral">
                      {row.ordersCount ?? row.count ?? 0}
                    </span>
                  )
                },
                {
                  header: "Subtotal",
                  align: "right",
                  width: "25%",
                  cell: (row) => (
                    <span className="report-money-subtotal">
                      ₹{Number(row.subtotal ?? row.grossSales ?? 0).toLocaleString("en-IN")}
                    </span>
                  )
                },
                {
                  header: "Net Revenue",
                  align: "right",
                  width: "30%",
                  cell: (row) => (
                    <span className="report-money-net">
                      ₹{Number(row.total ?? row.netSales ?? 0).toLocaleString("en-IN")}
                    </span>
                  )
                }
              ]}
            />
          </div>
        </>
      )}

      {/* PRODUCTS PERFORMANCE TAB */}
      {activeTab === "products" && (
        <div className="card report-table-card">
          <div className="report-table-header">
            <div>
              <h3 className="report-table-title">Product Performance</h3>
              <p className="report-table-subtitle">Sales volume, total revenue generated, and live inventory count</p>
            </div>
            <span className="report-table-count">
              {productsData.length} Products
            </span>
          </div>
          <PaginatedDataTable
            isLoading={isLoading}
            rows={productsData}
            rowKey={(row) => row.productId || row.product_id}
            emptyTitle="No product performance data"
            emptyDescription="Product sales volumes will appear here once items are purchased."
            columns={[
              {
                header: "Product Title",
                align: "left",
                width: "30%",
                cell: (row) => <strong>{row.productName || row.product_name || "Piece"}</strong>
              },
              {
                header: "Category",
                align: "left",
                width: "18%",
                cell: (row) => <span>{row.category || "General"}</span>
              },
              {
                header: "Units Sold",
                align: "center",
                width: "16%",
                cell: (row) => (
                  <span className="report-badge-neutral">
                    {row.unitsSold ?? row.units_sold ?? 0}
                  </span>
                )
              },
              {
                header: "Revenue Generated",
                align: "right",
                width: "20%",
                cell: (row) => (
                  <span className="report-money-net">
                    ₹{Number(row.revenue || 0).toLocaleString("en-IN")}
                  </span>
                )
              },
              {
                header: "Remaining Inventory",
                align: "center",
                width: "16%",
                cell: (row) => {
                  const stock = row.currentStock ?? row.stock_count;
                  const isLow = Number(stock) < 5;
                  return (
                    <span className={isLow ? "report-stock-low" : "report-stock-normal"}>
                      {stock ?? "N/A"}
                    </span>
                  );
                }
              }
            ]}
          />
        </div>
      )}

      {/* ORDERS LEDGER TAB */}
      {activeTab === "orders" && (
        <div className="card report-table-card">
          <div className="report-table-header">
            <div>
              <h3 className="report-table-title">Orders Ledger</h3>
              <p className="report-table-subtitle">Comprehensive transaction log and fulfillment status</p>
            </div>
            <span className="report-table-count">
              {ordersData.length} Orders
            </span>
          </div>
          <PaginatedDataTable
            isLoading={isLoading}
            rows={ordersData}
            rowKey={(row) => row.orderNumber || row.order_number}
            emptyTitle="No orders found"
            emptyDescription="Order history will populate as customers complete checkouts."
            columns={[
              {
                header: "Order Number",
                align: "left",
                width: "18%",
                cell: (row) => (
                  <code className="report-order-code">
                    {row.orderNumber || row.order_number}
                  </code>
                )
              },
              {
                header: "Date",
                align: "left",
                width: "14%",
                cell: (row) => <span className="cell-muted">{row.date || row.order_date}</span>
              },
              {
                header: "Customer",
                align: "left",
                width: "26%",
                cell: (row) => (
                  <div>
                    <div className="cell-title">{row.customerName || row.customer_name || "Guest"}</div>
                    <div className="cell-muted">{row.customerEmail || row.customer_email}</div>
                  </div>
                )
              },
              {
                header: "Status",
                align: "center",
                width: "14%",
                cell: (row) => <StatusBadge status={row.status} label={row.status.toUpperCase()} />
              },
              {
                header: "Payment",
                align: "center",
                width: "14%",
                cell: (row) => (
                  <span className="report-payment-badge">
                    {row.paymentMethod || row.payment_method}
                  </span>
                )
              },
              {
                header: "Total Amount",
                align: "right",
                width: "14%",
                cell: (row) => (
                  <strong style={{ color: "var(--text-main)", fontSize: "13.5px" }}>
                    ₹{Number(row.total || row.total_amount || 0).toLocaleString("en-IN")}
                  </strong>
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  );
}
