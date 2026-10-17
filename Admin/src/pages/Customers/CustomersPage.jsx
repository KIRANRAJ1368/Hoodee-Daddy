import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Eye, Search, ShoppingBag, Mail, Phone, Calendar, IndianRupee } from "lucide-react";
import { customersApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/DataTable/DataTable";
import Pagination from "../../components/Pagination/Pagination";
import Modal from "../../components/Modal/Modal";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import CustomerViewModal from "../../components/EntityViewModal/CustomerViewModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const toast = useToast();

  async function loadCustomers() {
    setIsLoading(true);
    try {
      const { data, meta } = await customersApi.list({
        search: search.trim() || undefined,
        page,
        limit: 10
      });
      setCustomers(data || []);
      setMeta(meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  const handleViewCustomer = async (cust) => {
    setViewingCustomer(cust);
    setLoadingDetail(true);
    try {
      const { data } = await customersApi.getById(cust.id);
      setCustomerDetail(data);
    } catch (err) {
      toast.error(err.message || "Failed to load customer details");
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Registered Customers</span>
            <span className="pill-badge badge-gold">
              {meta.total} Customer{meta.total === 1 ? "" : "s"}
            </span>
          </h1>
          <p className="page-subtitle">
            Manage your registered customer accounts, view lifetime spend, and track order histories.
          </p>
        </div>
      </div>

      <div className="card">
        {/* Search Toolbar */}
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
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%", maxWidth: 400 }}>
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 0, maxWidth: "100%" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, mobile..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  fontSize: "13px"
                }}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  setTimeout(loadCustomers, 0);
                }}
              >
                Clear
              </button>
            )}
          </form>
          <span className="hint">
            Page {meta.page} of {meta.totalPages || 1}
          </span>
        </div>

        <DataTable
          isLoading={isLoading}
          rows={customers}
          rowKey={(row) => row.id}
          emptyTitle="No registered customers found"
          emptyDescription="When shoppers sign up on the storefront, their accounts will automatically appear here."
          columns={[
            {
              key: "name",
              label: "Customer",
              width: "200px",
              render: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#eef2ff",
                      border: "1px solid #e0e7ff",
                      color: "#4f46e5",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      flexShrink: 0
                    }}
                  >
                    {row.name ? row.name.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div>
                    <span className="cell-title">{row.name}</span>
                    <div className="cell-muted" style={{ fontSize: 11.5 }}>
                      ID: {row.id}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: "contact",
              label: "Contact Details",
              width: "220px",
              render: (row) => (
                <div style={{ fontSize: 12.5, maxWidth: 210 }}>
                  <div
                    style={{
                      color: "var(--text-main)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                    title={row.email}
                  >
                    {row.email}
                  </div>
                  <div className="cell-muted" style={{ whiteSpace: "nowrap" }}>{row.phone || "—"}</div>
                </div>
              )
            },
            {
              key: "order_count",
              label: "Total Orders",
              width: "130px",
              align: "center",
              render: (row) => (
                <span
                  className="pill-badge"
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "var(--text-main)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {Number(row.order_count || 0)} Order{Number(row.order_count) === 1 ? "" : "s"}
                </span>
              )
            },
            {
              key: "total_spent",
              label: "Total Spend",
              width: "120px",
              align: "right",
              render: (row) => (
                <span style={{ fontWeight: 800, color: "var(--text-main)", fontSize: 14, whiteSpace: "nowrap" }}>
                  ₹{Number(row.total_spent || 0).toLocaleString("en-IN")}
                </span>
              )
            },
            {
              key: "created_at",
              label: "Member Since",
              width: "130px",
              align: "center",
              render: (row) => (
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(row.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              )
            },
            {
              key: "actions",
              label: "Actions",
              width: "100px",
              align: "right",
              render: (row) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleViewCustomer(row)}
                    title="View Customer Profile"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                </div>
              )
            }
          ]}
        />

        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </div>

      {/* Customer Detail Modal */}
      {viewingCustomer && (
        <CustomerViewModal
          customer={viewingCustomer}
          customerDetail={customerDetail}
          loadingDetail={loadingDetail}
          onClose={() => {
            setViewingCustomer(null);
            setCustomerDetail(null);
          }}
        />
      )}
    </div>
  );
}
