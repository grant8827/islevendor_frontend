import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, CircleX, CreditCard } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import Navbar from '../components/marketplace/Navbar.jsx';

const formatJmd = (n) => `J$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// How long to keep checking a payment WiPay hasn't confirmed yet before
// telling the customer to check back.
const POLL_MS = 3000;
const POLL_FOR_MS = 60_000;

const COPY = {
  PAID: { icon: CheckCircle2, tone: 'text-primary', title: 'Payment received', body: 'Thank you! The seller is getting your order ready.' },
  PENDING: { icon: Clock, tone: 'text-amber-500', title: 'Confirming your payment…', body: 'This usually takes a moment.' },
  FAILED: { icon: CircleX, tone: 'text-red-500', title: 'Payment didn’t go through', body: 'You haven’t been charged for this attempt. Your order is saved — you can try again.' },
  SUPERSEDED: { icon: Clock, tone: 'text-slate-400', title: 'This payment attempt was replaced', body: 'You started a newer payment for the same order.' },
  DUPLICATE: { icon: CheckCircle2, tone: 'text-amber-500', title: 'Already paid', body: 'Your order was already paid by an earlier attempt. We’ll refund this second payment.' },
};

// Where WiPay's return lands the customer (via the API's /api/webhooks/wipay).
// Everything shown comes from the server — the browser never decides
// whether a payment went through.
export default function PaymentStatusPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const started = useRef(Date.now());

  const load = useCallback(() => {
    apiRequest(`/payments/${id}`)
      .then(setPayment)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(load, [load]);

  // Keep checking while WiPay's confirmation may still be on its way.
  useEffect(() => {
    if (payment?.status !== 'PENDING' || Date.now() - started.current > POLL_FOR_MS) return undefined;
    const timer = setTimeout(load, POLL_MS);
    return () => clearTimeout(timer);
  }, [payment, load]);

  async function retry() {
    setRetrying(true);
    try {
      const next = await apiRequest(`/payments/${id}/retry`, { method: 'POST' });
      if (next.checkoutUrl) window.location.assign(next.checkoutUrl);
      else setError(next.message || 'Couldn’t start the payment — please try again shortly.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  }

  const copy = payment ? (COPY[payment.status] ?? COPY.PENDING) : null;
  const Icon = copy?.icon;
  const stillWaiting = payment?.status === 'PENDING' && Date.now() - started.current > POLL_FOR_MS;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center" role="status">
          {error && !payment && <p className="text-sm text-red-600">{error}</p>}
          {!payment && !error && <p className="text-sm text-slate-500">Loading your payment…</p>}

          {payment && (
            <>
              <Icon className={`w-12 h-12 mx-auto mb-3 ${copy.tone}`} />
              <h1 className="text-xl font-black text-slate-900">{copy.title}</h1>
              <p className="text-sm text-slate-600 mt-2">
                {stillWaiting ? 'We haven’t heard back from WiPay yet. If you completed the payment, it will show up in your orders shortly.' : copy.body}
              </p>
              {payment.status === 'FAILED' && payment.message && <p className="text-xs text-slate-500 mt-2">{payment.message}</p>}
              <p className="text-2xl font-black text-slate-900 mt-5">{formatJmd(payment.amountJmd)}</p>

              <ul className="mt-5 text-left text-sm divide-y divide-slate-100 border-y border-slate-100">
                {payment.orders.map((o) => (
                  <li key={o.id} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-700">
                      {o.sellerName ?? 'Order'} <span className="font-mono text-xs text-slate-400">#{o.id.slice(0, 8)}</span>
                    </span>
                    <span className="text-slate-900">{formatJmd(o.totalPaidJmd)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2 mt-6">
                {payment.status === 'PENDING' && payment.checkoutUrl && (
                  <a href={payment.checkoutUrl} className="btn-primary inline-flex items-center justify-center gap-2 text-sm py-3">
                    <CreditCard className="w-4 h-4" /> Continue to WiPay
                  </a>
                )}
                {payment.canRetry && payment.status !== 'PENDING' && (
                  <button type="button" onClick={retry} disabled={retrying} className="btn-primary inline-flex items-center justify-center gap-2 text-sm py-3 disabled:opacity-50">
                    <CreditCard className="w-4 h-4" /> {retrying ? 'Opening WiPay…' : 'Try paying again'}
                  </button>
                )}
                {error && payment && <p className="text-xs text-red-600">{error}</p>}
                <Link to="/account?tab=orders" className="text-sm font-bold text-secondary hover:underline">
                  View your orders
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
