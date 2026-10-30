import React from "react";
import { useShop } from "../../context/ShopContext";
import { imageUrl } from "../../utils/imageUrl";
import "./InvoiceModal.css";

export default function InvoiceModal({ order, onClose }) {
  const { formatPrice } = useShop();
  if (!order) return null;

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

  const subtotal = Number(order.subtotal ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const shipping = Number(order.shipping_fee ?? 0);
  const total = Number(order.total ?? 0);
  const orderNumber = order.order_number || order.id || "HD-ORD";

  const getPrintStyles = () => `
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #091525;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-sheet {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px 0;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .invoice-brand-logo {
      height: 48px;
      width: auto;
      margin-bottom: 6px;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #ff7300;
      margin: 4px 0 8px 0;
      text-transform: uppercase;
    }
    .brand-address p {
      margin: 2px 0;
      font-size: 11.5px;
      color: #475569;
    }
    .invoice-doc-details {
      text-align: right;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.06em;
      color: #091525;
      margin: 0 0 10px 0;
      border-bottom: 2px solid #ff7300;
      display: inline-block;
      padding-bottom: 4px;
    }
    .doc-meta-table {
      margin-left: auto;
      border-collapse: collapse;
      font-size: 12px;
    }
    .doc-meta-table td {
      padding: 3px 6px;
      text-align: right;
      color: #091525;
    }
    .doc-meta-table td:first-child {
      color: #64748b;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #10b981;
    }
    .invoice-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 18px 0;
    }
    .invoice-addresses {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 20px;
    }
    .addr-block {
      flex: 1;
    }
    .addr-block h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin: 0 0 6px 0;
      font-weight: 700;
    }
    .addr-block .customer-name {
      font-size: 14px;
      font-weight: 700;
      color: #091525;
      margin: 0 0 4px 0;
    }
    .addr-block p {
      margin: 2px 0;
      font-size: 12px;
      color: #334155;
    }
    .invoice-table-wrapper {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .invoice-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .invoice-items-table th {
      background-color: #091525 !important;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 9px 10px;
      text-align: left;
    }
    .invoice-items-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #091525;
    }
    .invoice-items-table tr {
      page-break-inside: avoid;
    }
    .invoice-item-thumb {
      width: 36px;
      height: 46px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      margin-right: 8px;
      display: inline-block;
      vertical-align: middle;
    }
    .item-title {
      font-weight: 600;
      color: #091525;
      font-size: 12.5px;
    }
    .item-variants {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .invoice-summary-section {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 16px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-notes {
      flex: 1.2;
    }
    .invoice-notes h4 {
      font-size: 11px;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #091525;
      font-weight: 700;
    }
    .invoice-notes p {
      font-size: 11.5px;
      color: #64748b;
      margin: 3px 0;
    }
    .invoice-breakdown {
      flex: 1;
      min-width: 240px;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 4px 0;
      color: #334155;
    }
    .discount-row {
      color: #059669;
      font-weight: 600;
    }
    .total-row {
      border-top: 2px solid #091525;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 15px;
      font-weight: 800;
      color: #091525;
    }
    .total-gold {
      color: #ff7300;
      font-weight: 800;
    }
    .invoice-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 28px;
      padding-top: 12px;
    }
    .stamp-badge {
      display: inline-block;
      font-size: 10px;
      letter-spacing: 0.1em;
      color: #ff7300;
      border: 1.5px solid #ff7300;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 800;
    }
    .stamp-text {
      font-size: 10.5px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .authorized-sign {
      text-align: center;
      min-width: 160px;
    }
    .sign-line {
      border-bottom: 1px solid #091525;
      margin-bottom: 6px;
    }
    .authorized-sign p {
      margin: 2px 0;
      font-size: 11px;
      color: #64748b;
    }
    .sign-company {
      font-weight: 700;
      color: #091525;
    }
  `;

  // Direct, rock-solid printing via isolated hidden iframe to prevent clipping & modal overflow issues
  const handlePrint = () => {
    const invoiceElem = document.getElementById("printable-invoice");
    if (!invoiceElem) {
      window.print();
      return;
    }

    let printFrame = document.getElementById("hoodee-invoice-print-frame");
    if (!printFrame) {
      printFrame = document.createElement("iframe");
      printFrame.id = "hoodee-invoice-print-frame";
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice - ${orderNumber} - HooDee Daddy</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        <div class="invoice-sheet">
          ${invoiceElem.innerHTML}
        </div>
      </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        window.print();
      }
    }, 250);
  };

  // Direct Download Invoice as standalone offline HTML document with one-click print & PDF capability
  const handleDownload = () => {
    const invoiceElem = document.getElementById("printable-invoice");
    if (!invoiceElem) return;

    const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice INV-${orderNumber} - HooDee Daddy</title>
  <style>
    ${getPrintStyles()}
    body {
      background: #f8fafc;
      padding: 30px 15px;
    }
    .invoice-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(9, 21, 37, 0.08);
      padding: 36px 40px;
    }
    .print-bar {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .print-btn {
      background: #ff7300;
      color: #ffffff;
      border: none;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #ff8a00;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-bar { display: none !important; }
      .invoice-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="invoice-sheet">
      ${invoiceElem.innerHTML}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-HD-${orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Screen Toolbar */}
        <div className="invoice-toolbar no-print">
          <div className="invoice-toolbar-title">
            <span>OFFICIAL TAX INVOICE</span>
            <span className="invoice-pill">{orderNumber}</span>
          </div>
          <div className="invoice-toolbar-actions">
            <button type="button" className="invoice-btn-download" onClick={handleDownload} title="Download Invoice HTML">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Invoice</span>
            </button>
            <button type="button" className="invoice-btn-print" onClick={handlePrint} title="Print Invoice / Save as PDF">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print / Save PDF</span>
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
              <img src="/images/hoodee-daddy-logo.svg" alt="HooDee Daddy" className="invoice-brand-logo" />
              <p className="brand-sub">PREMIUM HOODIES &amp; EVERYDAY ESSENTIALS</p>
              <div className="brand-address">
                <p>HooDee Daddy Central Distribution &amp; Hub</p>
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
                    <td><strong>INV-{orderNumber}</strong></td>
                  </tr>
                  <tr>
                    <td>Date:</td>
                    <td>{invoiceDate}</td>
                  </tr>
                  <tr>
                    <td>Order No:</td>
                    <td>{orderNumber}</td>
                  </tr>
                  <tr>
                    <td>Payment Status:</td>
                    <td>
                      <span className={`status-badge ${(order.payment_status || "paid").toLowerCase()}`}>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {item.image_url && <img src={imageUrl(item.image_url)} alt="" className="invoice-item-thumb" />}
                          <div>
                            <div className="item-title">{item.title || item.product_name_snapshot || item.product_name || "HooDee Daddy Signature Piece"}</div>
                            {(item.size || item.color || item.sku_snapshot) && (
                              <div className="item-variants">
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span> | Color: {item.color}</span>}
                                {item.sku_snapshot && <span> | SKU: {item.sku_snapshot}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}><strong>{qty}</strong></td>
                      <td style={{ textAlign: "right" }}>{formatPrice(price)}</td>
                      <td style={{ textAlign: "right" }}><strong>{formatPrice(lineTotal)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="invoice-summary-section">
            <div className="invoice-notes">
              <h4>Terms &amp; Policy:</h4>
              <p>• Certified authentic HooDee Daddy apparel.</p>
              <p>• Hassle-free exchanges &amp; returns within 7 days of delivery.</p>
              <p>• For queries or care advisory, contact support@hoodeedaddy.com.</p>
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
                <span>{shipping > 0 ? formatPrice(shipping) : "FREE"}</span>
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
              <p className="sign-company">HooDee Daddy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
