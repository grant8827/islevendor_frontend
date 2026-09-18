import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { apiRequest, uploadImage } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Proof-of-delivery capture, opened from a row in DeliveryPanel's Delivery
// tab. One photo of the buyer receiving the package — uploaded via the
// existing generic /uploads/image endpoint, then attached to the order via
// POST /dispatch/orders/:id/delivered, which flips it to DELIVERED and
// pushes a live ORDER_DELIVERED notification to the warehouse/shop that
// owns it (see backend-node's dispatch.routes.ts).
export default function MarkDeliveredModal({ orderId, onClose, onDelivered }) {
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
  }

  async function submit() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const proofOfDeliveryImageUrl = await uploadImage(file);
      await apiRequest(`/dispatch/orders/${orderId}/delivered`, { method: 'POST', body: { proofOfDeliveryImageUrl } });
      notify('Delivery confirmed!');
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
          <p className="text-xs text-slate-500">Take a photo of the buyer receiving the package as proof of delivery.</p>

          <label
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-6 cursor-pointer transition ${
              previewUrl ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-navy bg-slate-50'
            }`}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Delivery proof preview" className="w-24 h-24 object-cover rounded-lg" />
            ) : (
              <Camera className="w-8 h-8 text-slate-400" />
            )}
            <span className="text-xs text-slate-600">{previewUrl ? 'Retake photo' : 'Tap to take a photo'}</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="sr-only" disabled={submitting} />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={submit}
            disabled={!file || submitting}
            className="w-full btn-primary text-xs font-bold py-2.5 rounded-lg transition disabled:opacity-40"
          >
            {submitting ? 'Confirming…' : 'Confirm Delivered'}
          </button>
        </div>
      </div>
    </div>
  );
}
