import { useEffect, useState } from "react";
import { Plus, Eye, Edit2, Trash2, Tag, Percent, IndianRupee } from "lucide-react";
import { couponsApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import PaginatedDataTable from "../../components/PaginatedDataTable/PaginatedDataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import CouponFormModal from "./CouponFormModal";
import CouponViewModal from "../../components/EntityViewModal/CouponViewModal";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [viewing, setViewing] = useState(null);
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  async function load() {
    setIsLoading(true);
    try {
      const res = await couponsApi.list();
      setCoupons(res.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(coupon) {
    const ok = await confirm({
      title: "Delete Coupon?",
      message: `Are you sure you want to delete coupon "${coupon.code}"? Customers will no longer be able to use it.`,
      danger: true
    });
    if (!ok) return;
    try {
      await couponsApi.remove(coupon.id);
      toast.delete(`Coupon code "${coupon.code}" has been deleted successfully.`);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to delete coupon");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Discounts & Coupons</span>
            <span className="pill-badge badge-gold">
              {coupons.length} Code{coupons.length === 1 ? "" : "s"}
            </span>
          </h1>
          <p className="page-subtitle">
            Configure luxury promo vouchers, festive sales discounts, and cart redemption rules.
          </p>
        </div>
        <button type="button" className="btn btn-accent btn-lg" onClick={() => setEditing({})}>
          <Plus size={17} />
          <span>Add Coupon</span>
        </button>
      </div>

      <div className="card">
        <PaginatedDataTable
          isLoading={isLoading}
          rows={coupons}
          sortNewestFirst
          rowKey={(row) => row.id}
          emptyTitle="No discount coupons found"
          emptyDescription="Create your first promotional discount voucher."
          emptyAction={
            <button type="button" className="btn btn-accent" onClick={() => setEditing({})}>
              <Plus size={16} />
              <span>Create Coupon</span>
            </button>
          }
          columns={[
            {
              key: "code",
              label: "Coupon Code",
              render: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      background: "rgba(99, 102, 241, 0.12)",
                      color: "#6366F1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Tag size={18} />
                  </div>
                  <div>
                    <strong style={{ letterSpacing: "0.06em", color: "var(--text-main, #111)" }}>{row.code}</strong>
                    {row.description && (
                      <div style={{ fontSize: "0.78rem", color: "var(--text-subtle, #666)" }}>{row.description}</div>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: "benefit",
              label: "Benefit",
              width: "140px",
              align: "center",
              render: (row) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: 600,
                    color: "var(--text-main, #111)"
                  }}
                >
                  {row.discount_type === "percentage" ? (
                    <>
                      <Percent size={14} color="#6366F1" />
                      {Number(row.discount_value)}% OFF
                    </>
                  ) : (
                    <>
                      <IndianRupee size={14} color="#2e7d32" />
                      ₹{Number(row.discount_value).toLocaleString("en-IN")} OFF
                    </>
                  )}
                </span>
              )
            },
            {
              key: "min_spend",
              label: "Min Spend",
              width: "110px",
              align: "right",
              render: (row) =>
                Number(row.min_spend) > 0 ? `₹${Number(row.min_spend).toLocaleString("en-IN")}` : "No Min"
            },
            {
              key: "max_discount",
              label: "Max Cap",
              width: "110px",
              align: "right",
              render: (row) =>
                Number(row.max_discount) > 0
                  ? `₹${Number(row.max_discount).toLocaleString("en-IN")}`
                  : "Uncapped"
            },
            {
              key: "usage",
              label: "Usage",
              width: "120px",
              align: "center",
              render: (row) => (
                <span>
                  {row.times_used ?? row.used_count ?? 0} {row.usage_limit ? `/ ${row.usage_limit}` : "times"}
                </span>
              )
            },
            {
              key: "status",
              label: "Status",
              width: "110px",
              align: "center",
              render: (row) => (
                <StatusBadge
                  status={row.is_active ? "active" : "inactive"}
                  label={row.is_active ? "Active" : "Disabled"}
                />
              )
            },
            {
              key: "actions",
              label: "Actions",
              width: "220px",
              align: "right",
              render: (row) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="View Coupon Details"
                    onClick={() => setViewing(row)}
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    title="Edit Coupon"
                    onClick={() => setEditing(row)}
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    title="Delete Coupon"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>

      {editing && (
        <CouponFormModal
          coupon={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      {viewing && (
        <CouponViewModal
          coupon={viewing}
          onClose={() => setViewing(null)}
          onEdit={(c) => {
            setViewing(null);
            setEditing(c);
          }}
        />
      )}

      <ConfirmModal />
    </div>
  );
}
