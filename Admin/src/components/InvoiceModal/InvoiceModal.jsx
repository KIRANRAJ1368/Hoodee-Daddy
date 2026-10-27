import React from "react";
import { Printer, X } from "lucide-react";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./InvoiceModal.css";

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const rawDate = order.created_at || order.createdAt || order.order_date;
  const invoiceDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

  const subtotal = Number(order.subtotal ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const shipping = Number(order.shipping_fee ?? 0);
  const total = Number(order.total ?? 0);

  const formatINR = (val) =>
    "₹" + Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Screen Toolbar */}
        <div className="invoice-toolbar no-print">
          <div className="invoice-toolbar-title">
            <span>OFFICIAL TAX INVOICE</span>
            <span className="invoice-pill">{order.order_number || order.id}</span>
          </div>
          <div className="invoice-toolbar-actions">
            <button type="button" className="invoice-btn-print" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
            <button type="button" className="invoice-btn-close" onClick={onClose} aria-label="Close invoice">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="invoice-sheet" id="printable-invoice">
          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-brand">
              <h1 className="brand-logo-text">HooDee Daddy</h1>
              <p className="brand-sub">KIDS HOODIES &amp; EVERYDAY FASHION</p>
              <div className="brand-address">
                <p>HooDee Daddy Flagship &amp; Dispatch</p>
                <p>123, Avinashi Road, Peelamedu, Coimbatore, TN - 641004</p>
                <p>GSTIN: 33AAAAZ0000A1Z5 | support@hoodeedaddy.com</p>
              </div>
            </div>

            <div className="invoice-doc-details">
              <h2 className="doc-title">TAX INVOICE</h2>
              <table className="doc-meta-table">
                <tbody>
                  <tr>
                    <td>Invoice No:</td>
                    <td><strong>INV-{order.order_number || order.id}</strong></td>
                  </tr>
                  <tr>
                    <td>Date:</td>
                    <td>{invoiceDate}</td>
                  </tr>
                  <tr>
                    <td>Order Ref:</td>
                    <td>{order.order_number || order.id}</td>
                  </tr>
                  <tr>
                    <td>Order Status:</td>
                    <td>
                      <span className={`status-badge ${(order.status || "processing").toLowerCase()}`}>
                        {(order.status || "PROCESSING").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Payment Mode:</td>
                    <td>{order.payment_method === "COD" || !order.payment_method ? "Cash on Delivery" : (order.payment_method === "PREPAID" ? "Online Payment" : order.payment_method)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-divider" />

          {/* Client & Shipping Details */}
          <div className="invoice-addresses">
            <div className="addr-block">
              <h3>Billed To:</h3>
              <p className="customer-name">{order.customer_name || "Valued Client"}</p>
              <p>{order.email || "—"}</p>
              <p>{order.phone || "—"}</p>
            </div>
            <div className="addr-block">
              <h3>Delivered To:</h3>
              <p className="customer-name">{order.customer_name || "Valued Client"}</p>
              <p className="addr-text">
                {order.shipping_address_line1 || order.shipping_address || "Client Address on Record"}
                {order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}
              </p>
              <p>
                {[
                  order.city || order.shipping_city,
                  order.state || order.shipping_state,
                  order.pincode || order.shipping_postal_code,
                  order.country || order.shipping_country || "India"
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="invoice-table-wrapper">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th style={{ width: "6%" }}>No.</th>
                  <th style={{ width: "48%" }}>Item Description</th>
                  <th style={{ width: "12%", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "17%", textAlign: "right" }}>Unit Price</th>
                  <th style={{ width: "17%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const qty = Number(item.quantity || 1);
                    const price = Number(item.unit_price ?? item.price ?? 0);
                    const lineTotal = Number(item.line_total ?? qty * price);
                    return (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {item.image_url && (
                              <img
                                src={resolveImageUrl(item.image_url)}
                                alt=""
                                className="invoice-item-thumb"
                              />
                            )}
                            <div>
                              <div className="item-title">
                                {item.product_name_snapshot || item.title || item.product_name || "HooDee Daddy Signature Piece"}
                              </div>
                              <div className="item-variants">
                                {item.sku_snapshot && <span>SKU: {item.sku_snapshot}</span>}
                                {item.size && <span> | Size: {item.size}</span>}
                                {item.color && <span> | Color: {item.color}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}><strong>{qty}</strong></td>
                        <td style={{ textAlign: "right" }}>{formatINR(price)}</td>
                        <td style={{ textAlign: "right" }}><strong>{formatINR(lineTotal)}</strong></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td>1</td>
                    <td>
                      <div className="item-title">Order #{order.order_number || order.id}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>1</td>
                    <td style={{ textAlign: "right" }}>{formatINR(total)}</td>
                    <td style={{ textAlign: "right" }}><strong>{formatINR(total)}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="invoice-summary-section">
            <div className="invoice-notes">
              <h4>Terms &amp; Policy:</h4>
              <p>• Certified authentic handcrafted HooDee Daddy apparel.</p>
              <p>• 7-day hassle-free return and exchange policy from date of delivery.</p>
              <p>• For inquiries, logistics, or support, email support@hoodeedaddy.com.</p>
            </div>

            <div className="invoice-breakdown">
              <div className="calc-row">
                <span>Product Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {order.coupon_code && (
                <div className="calc-row">
                  <span>Coupon Applied:</span>
                  <span><strong>{order.coupon_code}</strong></span>
                </div>
              )}
              {discount > 0 && (
                <div className="calc-row discount-row">
                  <span>Promotional Discount:</span>
                  <span>-{formatINR(discount)}</span>
                </div>
              )}
              <div className="calc-row">
                <span>Shipping &amp; Delivery:</span>
                <span>{shipping > 0 ? formatINR(shipping) : "FREE SHIPPING"}</span>
              </div>
              <div className="calc-row total-row">
                <span>Total Amount Paid:</span>
                <span className="total-gold">{formatINR(total)}</span>
              </div>
            </div>
          </div>

          {/* Signature / Stamp */}
          <div className="invoice-footer">
            <div className="auth-stamp">
              <span className="stamp-badge">AUTHENTICITY VERIFIED</span>
              <p className="stamp-text">Electronically Generated Document. No physical signature required.</p>
            </div>
            <div className="authorized-sign">
              <div className="sign-line" />
              <p>Authorized Signatory</p>
              <p className="sign-company">HooDee Daddy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
