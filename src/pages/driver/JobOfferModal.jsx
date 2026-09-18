import { useEffect, useState } from 'react';
import { PackageCheck } from 'lucide-react';

// Popup shown when a JOB_OFFER arrives over the socket (see
// DeliveryPanel.jsx) — a warehouse/shop just marked an order ready and it
// was broadcast to every online nearby driver at once. First to tap Accept
// gets it; the countdown is a client-side echo of the server's real 30s
// offer window (dispatch.gateway.ts's JOB_OFFER_TTL_SECONDS), not the
// source of truth — the server independently expires the offer regardless
// of what this component does.
export default function JobOfferModal({ offer, onAccept, onDismiss }) {
  const [secondsLeft, setSecondsLeft] = useState(offer.expiresInSeconds);

  useEffect(() => {
    setSecondsLeft(offer.expiresInSeconds);
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [offer.orderId, offer.expiresInSeconds]);

  useEffect(() => {
    if (secondsLeft === 0) onDismiss();
  }, [secondsLeft, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-sm p-6 text-center">
        <PackageCheck className="w-10 h-10 text-primary mx-auto mb-3" />
        <h2 className="font-bold text-navy text-lg mb-1">New delivery available!</h2>
        <p className="text-xs text-slate-500 mb-4">First driver to accept gets it — {secondsLeft}s left</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 btn-primary text-xs font-bold py-2.5 rounded-lg transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
