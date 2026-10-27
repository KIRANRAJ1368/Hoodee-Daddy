import { useEffect, useState } from "react";
import { Mail, Trash2, Reply, Eye, User, Calendar, Phone } from "lucide-react";
import { contactApi } from "../../services/resources";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../components/ConfirmDialog/ConfirmDialog";
import DataTable from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import Modal from "../../components/Modal/Modal";
import Pagination from "../../components/Pagination/Pagination";

export default function ContactPage() {
  const [submissions, setSubmissions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const toast = useToast();
  const [confirm, ConfirmModal] = useConfirm();

  async function load() {
    setIsLoading(true);
    try {
      const { data, meta } = await contactApi.list({ page, limit: 10 });
      setSubmissions(data || []);
      setMeta(meta || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load customer inquiries");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openSubmission(row) {
    try {
      const { data } = await contactApi.getById(row.id);
      setViewing(data);
      setSubmissions((prev) => prev.map((s) => (s.id === row.id ? { ...s, status: data.status } : s)));
    } catch (err) {
      toast.error(err.message || "Failed to load inquiry details");
    }
  }

  async function handleStatusChange(status) {
    try {
      const { data } = await contactApi.updateStatus(viewing.id, status);
      setViewing(data);
      setSubmissions((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      toast.success("Inquiry status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update inquiry status");
    }
  }

  async function handleDelete(row) {
    const ok = await confirm({
      title: "Delete Customer Message?",
      message: `The inquiry from "${row.name}" will be permanently removed.`
    });
    if (!ok) return;
    try {
      await contactApi.remove(row.id);
      toast.delete(`Inquiry message from "${row.name}" has been deleted successfully.`);
      setViewing(null);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete customer inquiry");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Customer Messages & Inquiries</span>
            <span className="pill-badge badge-gold">{meta.total} Message{meta.total === 1 ? "" : "s"}</span>
          </h1>
          <p className="page-subtitle">
            Messages and sizing/order feedback submitted through the HooDee Daddy storefront Contact portal.
          </p>
        </div>
      </div>

      <div className="card">
        <DataTable
          isLoading={isLoading}
          rows={submissions}
          rowKey={(row) => row.id}
          emptyTitle="No customer messages"
          emptyDescription="When visitors submit the store Contact Us form, their inquiries will appear here."
          columns={[
            {
              key: "name",
              label: "Customer Name",
              render: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--dark)"
                    }}
                  >
                    {row.name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <span className="cell-title">{row.name}</span>
                </div>
              )
            },
            {
              key: "email",
              label: "Email Address",
              render: (row) => (
                <a
                  href={`mailto:${row.email}`}
                  style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "underline" }}
                >
                  {row.email}
                </a>
              )
            },
            {
              key: "subject",
              label: "Inquiry Topic",
              render: (row) => (
                <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: 13.5 }}>
                  {row.subject || "Store Inquiry"}
                </span>
              )
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge value={row.status} />
            },
            {
              key: "created_at",
              label: "Received Date",
              render: (row) => (
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
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
              width: "200px",
              align: "right",
              render: (row) => (
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openSubmission(row)}
                    title="Read message"
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(row)}
                    title="Delete message"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )
            }
          ]}
        />
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </div>

      {viewing && (
        <Modal
          title={viewing.subject || "Customer Inquiry"}
          onClose={() => setViewing(null)}
          width={600}
        >
          {/* Sender Overview Card */}
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              background: "var(--surface-alt)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>
                {viewing.name}
              </span>
              <span className="hint">{new Date(viewing.created_at).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>
                Email: <strong>{viewing.email}</strong>
              </span>
              {viewing.phone && (
                <span>
                  Phone: <strong>{viewing.phone}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Message Body */}
          <div style={{ padding: "4px 4px 18px" }}>
            <h4
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-subtle)",
                marginBottom: 10
              }}
            >
              Message Content:
            </h4>
            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.65,
                fontSize: 14,
                color: "var(--text-main)",
                background: "var(--surface)",
                padding: 16,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)"
              }}
            >
              {viewing.message}
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="field">
              <label>Update Inquiry Status</label>
              <select value={viewing.status} onChange={(e) => handleStatusChange(e.target.value)}>
                <option value="new">New / Unread</option>
                <option value="read">Mark as Read</option>
                <option value="responded">Responded & Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-danger" onClick={() => handleDelete(viewing)}>
              <Trash2 size={14} />
              <span>Delete Message</span>
            </button>
            <a
              className="btn btn-accent"
              href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(viewing.subject || "Your inquiry with HooDee Daddy")}`}
            >
              <Reply size={14} />
              <span>Reply by Email</span>
            </a>
          </div>
        </Modal>
      )}
      <ConfirmModal />
    </div>
  );
}
