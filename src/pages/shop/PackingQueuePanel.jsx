import { useEffect, useState } from 'react';
import { ClipboardList, Truck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function PackingQueuePanel({ shopId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/shop/${shopId}/orders?status=PACKING`)
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, [shopId]);

  async function markReady(orderId) {
    try {
      const result = await apiRequest(`/dispatch/orders/${orderId}/ready`, { method: 'POST' });
      notify(result.dispatched ? 'Boxed & offered to the nearest driver!' : 'Boxed — no drivers online nearby yet.');
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Packing Queue</h2>
          <p className="text-xs text-slate-500">Orders paid for and waiting to be boxed for driver pickup.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && orders.length === 0 && <p className="text-sm text-slate-500">Nothing to pack right now.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Order #{order.id.slice(0, 8)}</span>
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-300">
                Needs Packing
              </span>
            </div>
            <p className="text-xs text-slate-500">Deliver to: {order.deliveryAddress}</p>
            <p className="text-xs text-slate-500">Your share: J${Number(order.resellerMarginJmd).toLocaleString()}</p>
            <button
              type="button"
              onClick={() => markReady(order.id)}
              className="w-full flex items-center justify-center gap-2 btn-primary text-xs font-bold py-2.5 rounded-lg transition"
            >
              <Truck className="w-4 h-4" />
              Mark Boxed & Ready for Pickup
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
