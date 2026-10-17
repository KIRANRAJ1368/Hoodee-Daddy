import React from "react";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import "./InvoiceModal.css";

export default function InvoiceModal({ order, onClose }) {
  const { formatPrice } = useShop();
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

  // Read the persisted order amounts straight from the backend. These columns
  // are already stored in the same unit as catalogue prices, so they are
  // rendered as-is and never recomputed here.
  const subtotal = Number(order.subtotal ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const shipping = Number(order.shipping_fee ?? 0);
  const total = Number(order.total ?? 0);

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save PDF
            </button>
            <button type="button" className="invoice-btn-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="invoice-sheet" id="printable-invoice">
          {/* Header */}
          <div className="invoice-header">
            <div className="invoice-brand">
              <h1 className="brand-logo-text">ZMW</h1>
              <p className="brand-sub">HAUTE COUTURE & LUXURY APPAREL</p>
              <div className="brand-address">
                <p>ZMW Luxury Flagship & Atelier</p>
                <p>123, Avinashi Road, Peelamedu, Coimbatore, TN - 641004</p>
                <p>GSTIN: 33AAAAZ0000A1Z5 | contact@zmwclothing.com</p>
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
                    <td>Order No:</td>
                    <td>{order.order_number || order.id}</td>
                  </tr>
                  <tr>
                    <td>Payment Status:</td>
                    <td>
                      <span className={`status-badge ${(order.payment_status || 'paid').toLowerCase()}`}>
                        {(order.payment_status || "PAID").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Payment Method:</td>
                    <td>{(order.payment_method || "Online Card / UPI").toUpperCase()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Client & Shipping Details */}
          <div className="invoice-addresses">
            <div className="addr-block">
              <h3>Billed To:</h3>
              <p className="customer-name">{order.customer_name || "Valued Client"}</p>
              <p>{order.email}</p>
              <p>{order.phone}</p>
            </div>
            <div className="addr-block">
              <h3>Delivered To:</h3>
              <p className="customer-name">{order.customer_name || "Valued Client"}</p>
              <p className="addr-text">
                {order.shipping_address_line1 || order.shipping_address || "Client Address on Record"}
                {order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}
              </p>
              <p>
                {[order.shipping_city, order.shipping_state, order.shipping_postal_code, order.shipping_country]
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
                  <th style={{ width: "8%" }}>No.</th>
                  <th style={{ width: "47%" }}>Item Description</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Qty</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Unit Price</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(order.items && order.items.length > 0 ? order.items : [order]).map((item, index) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.unit_price ?? item.price ?? 0);
                  const lineTotal = Number(item.line_total ?? qty * price);
                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        {item.image_url && <img src={imageUrl(item.image_url)} alt="" className="invoice-item-thumb" />}
                        <div className="item-title">{item.title || item.product_name_snapshot || item.product_name || "ZMW Signature Piece"}</div>
                        {(item.size || item.color || item.sku_snapshot) && (
                          <div className="item-variants">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span> | Color: {item.color}</span>}
                            {item.sku_snapshot && <span> | SKU: {item.sku_snapshot}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>{qty}</td>
                      <td style={{ textAlign: "right" }}>{formatPrice(price)}</td>
                      <td style={{ textAlign: "right" }}>{formatPrice(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="invoice-summary-section">
            <div className="invoice-notes">
              <h4>Terms & Policy:</h4>
              <p>• Certified authentic handcrafted ZMW piece.</p>
              <p>• Complimentary alterations available within 15 days of dispatch at flagship boutiques.</p>
              <p>• For queries or care advisory, contact concierge@zmwclothing.com.</p>
            </div>

            <div className="invoice-breakdown">
              <div className="calc-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {order.coupon_code && <div className="calc-row"><span>Coupon Applied:</span><span>{order.coupon_code}</span></div>}
              {discount > 0 && (
                <div className="calc-row discount-row">
                  <span>Privilege Savings:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="calc-row">
                <span>Express Insured Courier:</span>
                <span>{shipping > 0 ? formatPrice(shipping) : "COMPLIMENTARY"}</span>
              </div>
              <div className="calc-row total-row">
                <span>Total Amount:</span>
                <span className="total-gold">{formatPrice(total)}</span>
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
              <div className="sign-line"></div>
              <p>Authorized Signatory</p>
              <p className="sign-company">ZMW Clothing Atelier</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
