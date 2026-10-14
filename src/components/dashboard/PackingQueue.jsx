import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Printer, Truck, PackageCheck, Store, CarFront } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { printOrderLabel } from '../../lib/printLabel.js';

const METHOD = {
  ISLEDASH: { label: 'IsleDash', icon: Truck, ready: 'Mark Boxed & Ready for Pickup' },
  SELLER_DELIVERY: { label: 'Your delivery', icon: CarFront, ready: 'Mark Packed & Ready to Deliver', complete: 'Mark Delivered' },
  PICKUP: { label: 'Customer pickup', icon: Store, ready: 'Mark Ready for Collection', complete: 'Mark Collected' },
};

/**
 * The warehouse/shop packing queue: paid orders waiting to be boxed, plus —
 * for orders that don't go out with IsleDash — ones that are ready and
 * waiting for the customer to collect or for the seller's own delivery. The
 * seller finishes those itself; IsleDash orders leave the queue once a
 * driver is offered them.
 *
 * `ordersEndpoint` is the business's GET .../orders route; `seller` is what
 * the printed label shows as the sender; `shareOf(order)` is the money line
 * this business sees on each card.
 */
export default function PackingQueue({ ordersEndpoint, seller, shareOf, showReseller = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // order id with a request in flight
  const { notify } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiRequest(`${ordersEndpoint}?status=PACKING`), apiRequest(`${ordersEndpoint}?status=READY_FOR_PICKUP`)])
      .then(([packing, ready]) => setOrders([...packing, ...ready.filter((o) => o.deliveryMethod !== 'ISLEDASH')]))
      .catch((err) => notify(err.message))
      .finally(() => setLoading(false));
  }, [ordersEndpoint, notify]);

  useEffect(load, [load]);

  async function act(order, action) {
    setBusy(order.id);
    try {
      const result = await apiRequest(`/dispatch/orders/${order.id}/${action}`, { method: 'POST' });
      if (action === 'complete') notify(order.deliveryMethod === 'PICKUP' ? 'Marked as collected.' : 'Marked as delivered.');
      else if (order.deliveryMethod === 'ISLEDASH') notify(result.dispatched ? 'Boxed & offered to your drivers!' : result.reason);
      else notify(order.deliveryMethod === 'PICKUP' ? "Ready — we'll keep it here until the customer collects." : 'Ready to go out with your delivery.');
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Packing Queue</h2>
          <p className="text-xs text-slate-500">Paid orders to box up, and pickups or your own deliveries waiting to be completed.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && orders.length === 0 && <p className="text-sm text-slate-500">Nothing to pack right now.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => {
          const method = METHOD[order.deliveryMethod] ?? METHOD.ISLEDASH;
          const isReady = order.status === 'READY_FOR_PICKUP';
          const MethodIcon = method.icon;
          return (
            <div key={order.id} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>Order #{order.id.slice(0, 8)}</span>
                <span className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                    <MethodIcon className="w-3.5 h-3.5" /> {method.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      isReady ? 'bg-sky-100 text-sky-700 border-sky-300' : 'bg-amber-100 text-amber-700 border-amber-300'
                    }`}
                  >
                    {isReady ? 'Ready' : 'Needs Packing'}
                  </span>
                </span>
              </div>
              {showReseller && order.resellerStore && <p className="text-xs text-slate-500">Sold via {order.resellerStore.storeName}</p>}
              <p className="text-xs text-slate-500">
                {order.deliveryMethod === 'PICKUP' ? order.deliveryAddress : `Deliver to: ${order.deliveryAddress}`}
              </p>
              {order.customer && (
                <p className="text-xs text-slate-500">
                  Customer: {order.customer.fullName} · {order.customer.phoneNumber}
                </p>
              )}
              <p className="text-xs text-slate-500">{shareOf(order)}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => printOrderLabel({ order, seller })}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-lg transition shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  Print Label
                </button>
                <button
                  type="button"
                  disabled={busy === order.id}
                  onClick={() => act(order, isReady ? 'complete' : 'ready')}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary text-xs font-bold py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {isReady ? <PackageCheck className="w-4 h-4" /> : <MethodIcon className="w-4 h-4" />}
                  {isReady ? method.complete : method.ready}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
