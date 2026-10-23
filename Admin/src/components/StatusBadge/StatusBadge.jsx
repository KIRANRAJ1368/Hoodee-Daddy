import "./StatusBadge.css";

const TONE_BY_VALUE = {
  // Orders
  pending: { tone: "warning", label: "Pending" },
  confirmed: { tone: "info", label: "Confirmed" },
  packed: { tone: "info", label: "Packed" },
  shipped: { tone: "info", label: "Shipped" },
  delivered: { tone: "success", label: "Delivered" },
  cancelled: { tone: "danger", label: "Cancelled" },
  returned: { tone: "danger", label: "Returned" },

  // Contact
  new: { tone: "info", label: "New Message" },
  read: { tone: "grey", label: "Read" },
  responded: { tone: "success", label: "Responded" },

  // Generic
  active: { tone: "success", label: "Active" },
  inactive: { tone: "grey", label: "Inactive" },
  "in stock": { tone: "success", label: "In Stock" },
  "out of stock": { tone: "danger", label: "Out of Stock" }
};

export default function StatusBadge({ value, label }) {
  const key = String(value).toLowerCase();
  const config = TONE_BY_VALUE[key] || { tone: "grey", label: value };
  const tone = config.tone;
  const displayLabel = label || config.label || value;

  return (
    <span className={`status-badge status-badge-${tone}`}>
      <span>{displayLabel}</span>
    </span>
  );
}
