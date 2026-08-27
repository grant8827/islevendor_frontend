import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import StarRating from '../marketplace/StarRating.jsx';

const STATUS_STYLES = {
  AWAITING_PAYMENT: 'bg-slate-100 text-slate-600 border-slate-200',
  PACKING: 'bg-amber-100 text-amber-700 border-amber-300',
  READY_FOR_PICKUP: 'bg-amber-100 text-amber-700 border-amber-300',
  PICKED_UP: 'bg-secondary/10 text-secondary border-secondary/30',
  DELIVERED: 'bg-primary/10 text-primary-dark border-primary/30',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
};

/**
 * Seller-side "every order, one row each" view — shared across the
 * warehouse, shop, and reseller dashboards, each passing its own
 * `endpoint` (their existing GET .../orders route, called with no ?status
 * filter so it returns full history rather than just the packing queue).
 * Each row shows the rating/feedback the buyer left, if any.
 */
export default function OrdersPanel({ endpoint, showSeller = false }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    setOrders(null);
    apiRequest(endpoint).then(setOrders);
  }, [endpoint]);

  const itemTitleOf = (o) => o.storeListing?.masterProduct?.title ?? o.shopProduct?.title ?? 'Item';

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Orders</h2>
          <p className="text-xs text-slate-500">Every order for your items, with any rating the buyer left.</p>
        </div>
      </div>

      {orders === null && <p className="text-sm text-slate-500">Loading…</p>}
      {orders?.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}

      {orders?.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Item</th>
                {showSeller && <th className="px-5 py-3">Sold Via</th>}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface transition">
                  <td className="px-5 py-3 font-bold text-slate-900">{itemTitleOf(o)}</td>
                  {showSeller && <td className="px-5 py-3">{o.resellerStore?.storeName ?? '—'}</td>}
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_STYLES[o.status] || STATUS_STYLES.AWAITING_PAYMENT}`}>
                      {o.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-900">J${Number(o.totalPaidJmd).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    {o.rating ? (
                      <StarRating value={o.rating.rating} size="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
