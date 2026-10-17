import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { apiRequest, uploadImage } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const PROOF_OPTIONS = [
  {
    type: 'PACKAGE_WITH_ID',
    title: 'Package + their ID',
    hint: "Photograph the package next to the recipient's ID card.",
    confirm: "The package and the recipient's ID are both clearly visible in this photo.",
  },
  {
    type: 'PACKAGE_WITH_RECIPIENT',
    title: 'Package + the person',
    hint: 'Photograph the recipient holding the package.',
    confirm: 'The package and the person receiving it are both clearly visible in this photo.',
  },
];

// Proof-of-delivery capture, opened from a row in DeliveryPanel's Delivery
// tab: pick what the photo will show (the package with the recipient's ID,
// or with the recipient), take it, check it and confirm. Uploaded via the
// generic /uploads/image endpoint, then attached to the order via POST
// /dispatch/orders/:id/delivered, which has the photo checked automatically
// (a flagged one still counts as delivered), flips the order to DELIVERED
// and tells the warehouse/shop that owns it (see backend-node's
// dispatch.routes.ts).
export default function MarkDeliveredModal({ orderId, onClose, onDelivered }) {
  const [proofType, setProofType] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useToast();

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only JPEG, PNG, or WebP photos are allowed');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError('Photo must be under 5MB');
      e.target.value = '';
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    // A new photo needs a fresh look before it's confirmed.
    setConfirmed(false);
  }

  const option = PROOF_OPTIONS.find((o) => o.type === proofType);

  async function submit() {
    if (!file || !proofType || !confirmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const proofOfDeliveryImageUrl = await uploadImage(file);
      const order = await apiRequest(`/dispatch/orders/${orderId}/delivered`, {
        method: 'POST',
        body: { proofOfDeliveryImageUrl, proofType, confirmed: true },
      });
      notify(
        order.proofOfDeliveryCheck === 'FLAGGED'
          ? `Delivered. The photo was flagged for the seller to check: ${order.proofOfDeliveryNote ?? 'it needs a look'}.`
          : 'Delivery confirmed!',
      );
      onDelivered();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-navy">Confirm delivery</h2>
          <button type="button" onClick={onClose} disabled={submitting} className="text-slate-500 hover:text-navy disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <fieldset>
            <legend className="text-xs font-bold text-slate-900 mb-2">1. What will the photo show?</legend>
            <div className="space-y-2">
              {PROOF_OPTIONS.map((o) => (
                <label
                  key={o.type}
                  className={`block rounded-lg border p-3 cursor-pointer transition ${proofType === o.type ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="proof-type"
                    className="sr-only"
                    checked={proofType === o.type}
                    onChange={() => {
                      setProofType(o.type);
                      setConfirmed(false);
                    }}
                    disabled={submitting}
                  />
                  <span className="block text-sm font-bold text-slate-900">{o.title}</span>
                  <span className="block text-xs text-slate-500">{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <p className={`text-xs font-bold mb-2 ${proofType ? 'text-slate-900' : 'text-slate-400'}`}>2. Take the photo</p>
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-6 transition ${
                !proofType ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              } ${previewUrl ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-navy bg-slate-50'}`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Delivery proof preview" className="w-full max-h-56 object-contain rounded-lg" />
              ) : (
                <Camera className="w-8 h-8 text-slate-400" />
              )}
              <span className="text-xs text-slate-600">{previewUrl ? 'Retake photo' : 'Tap to take a photo'}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="sr-only" disabled={submitting || !proofType} />
            </label>
          </div>

          <label className={`flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 ${file ? 'cursor-pointer' : 'opacity-40'}`}>
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--primary)]"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={!file || submitting}
            />
            <span>
              <span className="block font-bold text-slate-900 mb-0.5">3. Check it</span>
              {option?.confirm ?? 'The photo clearly shows the package and the recipient or their ID.'}
            </span>
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={submit}
            disabled={!file || !proofType || !confirmed || submitting}
            className="w-full btn-primary text-xs font-bold py-2.5 rounded-lg transition disabled:opacity-40"
          >
            {submitting ? 'Confirming…' : 'Confirm Delivered'}
          </button>
        </div>
      </div>
    </div>
  );
}
