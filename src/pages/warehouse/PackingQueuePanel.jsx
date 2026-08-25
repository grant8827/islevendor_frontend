import { useEffect, useState } from 'react';
import { ClipboardList, Truck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function PackingQueuePanel({ warehouseId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/warehouse/${warehouseId}/orders?status=PACKING`)
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, [warehouseId]);

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
        <ClipboardList className="w-5 h-5 text-amazon-yellow" />
        <div>
          <h2 className="font-bold text-white text-lg">Packing Queue</h2>
          <p className="text-xs text-slate-400">Orders paid for and waiting to be boxed for driver pickup.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {!loading && orders.length === 0 && <p className="text-sm text-slate-500">Nothing to pack right now.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-slate-950 border border-slate-700 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Order #{order.id.slice(0, 8)}</span>
              <span className="bg-amazon-orange/20 text-amazon-yellow px-2 py-0.5 rounded border border-amazon-orange/30">
                Needs Packing
              </span>
            </div>
            <p className="text-xs text-slate-400">Sold via {order.resellerStore.storeName}</p>
            <p className="text-xs text-slate-400">Deliver to: {order.deliveryAddress}</p>
            <p className="text-xs text-slate-500">Wholesale share: J${Number(order.wholesaleTotalJmd).toLocaleString()}</p>
            <button
              type="button"
              onClick={() => markReady(order.id)}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold py-2.5 rounded-lg transition"
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
