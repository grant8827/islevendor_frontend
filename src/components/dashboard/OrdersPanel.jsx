import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, MapPinned, Search, Undo2 } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import StarRating from '../marketplace/StarRating.jsx';
import RefundOrderModal from './RefundOrderModal.jsx';
import OrderTrackingList from './OrderTrackingList.jsx';

const SUBTABS = [
  { key: 'order', label: 'Order', icon: ClipboardList },
  { key: 'tracking', label: 'Tracking', icon: MapPinned },
];

// Same short form as the Packing Queue's "Order #" (see PackingQueuePanel.jsx)
// — the full UUID is overkill for a human to read or search by.
const orderNumberOf = (o) => o.id.slice(0, 8);

// Refunding only makes sense once money has actually moved (ledger legs
// exist) and hasn't already been reversed or written off.
const REFUNDABLE_STATUSES = ['PACKING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED'];

const STATUS_STYLES = {
  AWAITING_PAYMENT: 'bg-slate-100 text-slate-600 border-slate-200',
  PACKING: 'bg-amber-100 text-amber-700 border-amber-300',
  READY_FOR_PICKUP: 'bg-amber-100 text-amber-700 border-amber-300',
  PICKED_UP: 'bg-secondary/10 text-secondary border-secondary/30',
  DELIVERED: 'bg-primary/10 text-primary-dark border-primary/30',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
  REFUNDED: 'bg-red-100 text-red-700 border-red-300',
};

/**
 * Seller-side "every order, one row each" view — shared across the
 * warehouse, shop, and reseller dashboards, each passing its own
 * `endpoint` (their existing GET .../orders route, called with no ?status
 * filter so it returns full history rather than just the packing queue).
 * Each row shows the rating/feedback the buyer left, if any.
 *
 * `refundEndpoint`, when passed (warehouse and shop dashboards only — see
 * warehouse.routes.ts / shop.routes.ts's POST .../orders/:orderId/refund),
 * adds a Refund action per eligible row. Omitted entirely for the reseller
 * dashboard, which isn't allowed to issue refunds.
 */
export default function OrdersPanel({ endpoint, showSeller = false, refundEndpoint }) {
  const [subTab, setSubTab] = useState('order');
  const [orders, setOrders] = useState(null);
  const [search, setSearch] = useState('');
  const [refundingOrder, setRefundingOrder] = useState(null);

  useEffect(() => {
    setOrders(null);
    setSearch('');
    apiRequest(endpoint).then(setOrders);
  }, [endpoint]);

  function handleRefunded(updatedOrder) {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)));
    setRefundingOrder(null);
  }

  const itemTitleOf = (o) => o.storeListing?.masterProduct?.title ?? o.shopProduct?.title ?? 'Item';

  const filteredOrders = useMemo(() => {
    if (!orders) return orders;
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [orderNumberOf(o), itemTitleOf(o), o.resellerStore?.storeName, o.status.replaceAll('_', ' ')]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [orders, search]);

  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-4">Orders</h2>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {SUBTABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              subTab === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {orders === null && <p className="text-sm text-slate-500">Loading…</p>}
      {orders?.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}

      {orders?.length > 0 && (
        <>
          <div className="relative mb-4 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, item, or seller…"
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders match “{search}”.</p>
          ) : subTab === 'tracking' ? (
            <OrderTrackingList orders={filteredOrders} />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="table-header-row uppercase">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Item</th>
                    {showSeller && <th className="px-5 py-3">Sold Via</th>}
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Proof</th>
                    <th className="px-5 py-3">Rating</th>
                    <th className="px-5 py-3">Date</th>
                    {refundEndpoint && <th className="px-5 py-3">Refund</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface transition">
                      <td className="px-5 py-3 font-mono text-slate-500">#{orderNumberOf(o)}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{itemTitleOf(o)}</td>
                      {showSeller && <td className="px-5 py-3">{o.resellerStore?.storeName ?? '—'}</td>}
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_STYLES[o.status] || STATUS_STYLES.AWAITING_PAYMENT}`}>
                          {o.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-900">J${Number(o.totalPaidJmd).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        {o.proofOfDeliveryImageUrl ? (
                          <a href={o.proofOfDeliveryImageUrl} target="_blank" rel="noreferrer">
                            <img
                              src={o.proofOfDeliveryImageUrl}
                              alt="Proof of delivery"
                              className="w-9 h-9 object-cover rounded-md border border-slate-200"
                            />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {o.rating ? (
                          <StarRating value={o.rating.rating} size="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      {refundEndpoint && (
                        <td className="px-5 py-3">
                          {REFUNDABLE_STATUSES.includes(o.status) ? (
                            <button
                              type="button"
                              onClick={() => setRefundingOrder(o)}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-600 hover:text-red-700"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Refund
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {refundingOrder && (
        <RefundOrderModal
          endpoint={refundEndpoint(refundingOrder.id)}
          orderNumber={orderNumberOf(refundingOrder)}
          onClose={() => setRefundingOrder(null)}
          onRefunded={handleRefunded}
        />
      )}
    </div>
  );
}
