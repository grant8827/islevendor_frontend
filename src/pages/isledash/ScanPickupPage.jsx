import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PackageCheck, MapPin, Phone, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../api/client.js';

// Where the QR code printed on a shipping label (see printLabel.js) points
// — a driver's phone camera opens this URL, which (once they're logged in
// as a driver) confirms pickup via POST /dispatch/orders/:id/scan-pickup and
// shows everything about the package: this is the "the QR has everything"
// half of the label — the printed paper itself only carries the order # and
// a link, not the buyer's details directly (see printLabel.js's comment on
// why: a photographed label shouldn't leak PII to anyone with a camera).
export default function ScanPickupPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', order: null, error: null });

  function confirmPickup() {
    setState({ status: 'loading', order: null, error: null });
    apiRequest(`/dispatch/orders/${orderId}/scan-pickup`, { method: 'POST' })
      .then((order) => setState({ status: 'done', order, error: null }))
      .catch((err) => setState({ status: 'error', order: null, error: err.message }));
  }

  useEffect(() => {
    if (user?.role === 'DRIVER') confirmPickup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, user?.role]);

  if (user.role !== 'DRIVER') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-bold text-navy text-lg mb-2">This link is for delivery drivers</h1>
          <p className="text-sm text-slate-500 mb-4">This account ({user.role.toLowerCase()}) can't confirm package pickups.</p>
          <Link to="/dashboard" className="text-primary hover:underline text-sm font-bold">
            Go to your dashboard instead
          </Link>
        </div>
      </div>
    );
  }

  const itemTitle = state.order?.storeListing?.masterProduct?.title ?? state.order?.shopProduct?.title ?? 'Item';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl w-full max-w-sm p-6 text-center">
        {state.status === 'loading' && <p className="text-sm text-slate-500">Confirming pickup…</p>}

        {state.status === 'error' && (
          <>
            <TriangleAlert className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 mb-1">Couldn't confirm pickup</p>
            <p className="text-xs text-slate-500 mb-4">{state.error}</p>
            <button type="button" onClick={confirmPickup} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg transition">
              Try Again
            </button>
          </>
        )}

        {state.status === 'done' && (
          <>
            <PackageCheck className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 mb-1">Pickup confirmed!</p>
            <p className="text-xs text-slate-500 mb-4 font-mono">#{state.order.id.slice(0, 8).toUpperCase()}</p>

            <div className="text-left space-y-2 bg-surface rounded-lg p-4 text-sm">
              <p className="font-bold text-slate-900">{itemTitle}</p>
              <p className="text-slate-700">{state.order.customer?.fullName}</p>
              <p className="flex items-center gap-1.5 text-slate-500 text-xs">
                <MapPin className="w-3.5 h-3.5 shrink-0" /> {state.order.deliveryAddress}
              </p>
              <p className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Phone className="w-3.5 h-3.5 shrink-0" /> {state.order.customer?.phoneNumber}
              </p>
            </div>

            <Link to="/isledash" className="block mt-5 text-primary hover:underline text-sm font-bold">
              Back to Delivery
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
