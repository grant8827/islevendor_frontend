import QRCode from 'qrcode';

// Opens a small popup with a printable shipping label and immediately
// triggers the browser print dialog — used by the warehouse/shop Packing
// Queue's "Print Label" button. No PDF library involved: this is exactly
// what a browser's own print-to-PDF/print-to-label-printer flow is for.

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * The QR deliberately encodes just a URL, not the buyer's name/address/phone
 * directly — a QR containing raw PII would be readable by any camera app
 * that photographs the label, no login required. The URL instead opens
 * IsleDash's scan-to-confirm page (see ScanPickupPage.jsx), which requires
 * an authenticated driver session and, from there, shows the full order
 * (including the buyer's details) and confirms pickup in one step — that's
 * where "the QR has everything" actually lives.
 *
 * @param {{ order: object, seller: { name: string, addressLine: string, parish: string } }} args
 */
export async function printOrderLabel({ order, seller }) {
  const w = window.open('', '_blank', 'width=420,height=650');
  if (!w) return; // popup blocked — nothing else we can do without a library
  w.document.write('<p style="font-family:sans-serif;padding:20px;color:#64748b">Generating label…</p>');

  const scanUrl = `${window.location.origin}/isledash/scan/${order.id}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(scanUrl, { width: 180, margin: 1 });
  } catch {
    // Label still prints fine without it — the order # is there as a
    // fallback for a manual pickup confirmation.
  }

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const buyerName = order.customer?.fullName ?? '—';
  const buyerPhone = order.customer?.phoneNumber ?? '—';

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
<title>Label #${orderNumber}</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
  h1 { font-size: 16px; margin: 0 0 16px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
  .row { margin-bottom: 12px; }
  .label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: .05em; }
  .value { font-size: 15px; font-weight: 700; }
  .order-no { font-family: monospace; font-size: 22px; letter-spacing: 3px; text-align: center;
              margin-top: 20px; border: 2px dashed #94a3b8; padding: 10px; border-radius: 6px; }
  .qr { text-align: center; margin-top: 16px; }
  .qr img { width: 140px; height: 140px; }
  .qr p { font-size: 10px; color: #64748b; margin: 6px 0 0; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <h1>IsleVendor Shipping Label</h1>
  <div class="row">
    <div class="label">From</div>
    <div class="value">${escapeHtml(seller.name)}</div>
    <div>${escapeHtml(seller.addressLine)}, ${escapeHtml(seller.parish)}</div>
  </div>
  <div class="row">
    <div class="label">Deliver To</div>
    <div class="value">${escapeHtml(buyerName)}</div>
    <div>${escapeHtml(order.deliveryAddress)}</div>
    <div>${escapeHtml(buyerPhone)}</div>
  </div>
  <div class="order-no">#${orderNumber}</div>
  ${
    qrDataUrl
      ? `<div class="qr"><img src="${qrDataUrl}" alt="Scan to confirm pickup" /><p>Driver: scan to confirm pickup</p></div>`
      : ''
  }
</body>
</html>`);
  w.document.close();
  w.focus();
  w.print();
}
