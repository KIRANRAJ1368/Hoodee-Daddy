import { Link } from "react-router-dom";
import { Mail, Phone, ShoppingBag, IndianRupee, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import Modal from "../Modal/Modal";
import StatusBadge from "../StatusBadge/StatusBadge";
import "./EntityViewModal.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "—";

export default function CustomerViewModal({ customer, customerDetail, loadingDetail, onClose }) {
  const data = customerDetail || customer || null;

  if (!data) return null;

  const orders = customerDetail?.orders || [];
  const orderCount = Number(data.order_count || orders.length || 0);
  const totalSpent = Number(data.total_spent || 0);
  const aov = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
  const initial = data.name ? data.name.charAt(0).toUpperCase() : "C";

  return (
    <Modal title="Customer Profile" onClose={onClose} width={760}>
      <div className="ev">
        {/* Customer Profile Hero Header */}
        <div className="ev-customer-header">
          <div className="ev-customer-avatar">{initial}</div>

          <div className="ev-customer-info">
            <div className="ev-customer-name-row">
              <h2 className="ev-customer-name">{data.name}</h2>
              <span className="pill-badge badge-gold">
                <ShieldCheck size={12} />
                <span>Verified Account</span>
              </span>
            </div>
            <div className="ev-meta-line">
              <code>ID: {data.id}</code>
              <span className="ev-sep">•</span>
              <span>Member since {formatDate(data.created_at || data.createdAt)}</span>
            </div>
          </div>

          <div className="ev-status-col">
            <StatusBadge value="active" label="Active Shopper" />
          </div>
        </div>

        {/* 4 Key Customer Metric Cards */}
        <div className="ev-stat-grid-4">
          <div className="ev-stat-card">
            <span className="ev-stat-label">Lifetime Spend</span>
            <span className="ev-stat-value" style={{ color: "#059669", fontSize: 16 }}>
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="ev-stat-card">
            <span className="ev-stat-label">Total Orders</span>
            <span className="ev-stat-value">
              <ShoppingBag size={15} style={{ color: "var(--indigo)" }} />
              <span>
                {orderCount} Order{orderCount === 1 ? "" : "s"}
              </span>
            </span>
          </div>

          <div className="ev-stat-card">
            <span className="ev-stat-label">Avg Order Value</span>
            <span className="ev-stat-value">
              <IndianRupee size={14} style={{ color: "var(--indigo)" }} />
              <span>₹{aov.toLocaleString("en-IN")}</span>
            </span>
          </div>

          <div className="ev-stat-card">
            <span className="ev-stat-label">Registered Since</span>
            <span className="ev-stat-value" style={{ fontSize: 13 }}>
              <Calendar size={13} style={{ color: "var(--text-subtle)" }} />
              <span>{formatDate(data.created_at || data.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Direct Concierge Contact Bar */}
        <div className="ev-contact-bar">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              Direct Customer Concierge
            </div>
            <div style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 500, marginTop: 2 }}>
              {data.email} {data.phone ? `• ${data.phone}` : ""}
            </div>
          </div>

          <div className="ev-contact-links">
            {data.email && (
              <a
                href={`mailto:${data.email}?subject=${encodeURIComponent("Regarding Your Order with ZMW Clothing")}`}
                className="ev-contact-btn ev-contact-btn-email"
              >
                <Mail size={13} />
                <span>Send Email</span>
              </a>
            )}

            {data.phone && (
              <a
                href={`https://wa.me/${data.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${data.name}, greetings from ZMW Clothing concierge.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="ev-contact-btn ev-contact-btn-whatsapp"
              >
                <Phone size={13} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Order History Section */}
        <div>
          <div className="ev-section-label">
            <ShoppingBag size={13} />
            <span>Customer Purchase History</span>
            <span className="ev-section-count">({orders.length} Records)</span>
          </div>

          {loadingDetail ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Loading order history details...
            </div>
          ) : orders.length === 0 ? (
            <div className="ev-desc-card">
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                No storefront orders placed yet by this customer account.
              </p>
            </div>
          ) : (
            <div className="ev-orders-wrap">
              <table className="ev-orders-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Placed Date</th>
                    <th>Fulfillment Status</th>
                    <th>Total Amount</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <code style={{ fontWeight: 700, color: "var(--text-main)" }}>
                          {o.order_number}
                        </code>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                        {formatDate(o.created_at || o.createdAt)}
                      </td>
                      <td>
                        <StatusBadge value={o.status} />
                      </td>
                      <td>
                        <strong style={{ color: "var(--text-main)" }}>
                          ₹{Number(o.total || 0).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/orders/${o.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 10px", fontSize: 11.5 }}
                        >
                          <span>Inspect</span>
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Meta & Actions */}
        <div className="ev-footer">
          <div className="ev-footer-meta">
            <span>Customer UID: <strong>{data.id}</strong></span>
          </div>

          <div className="ev-footer-actions">
            <button type="button" className="btn btn-accent btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
