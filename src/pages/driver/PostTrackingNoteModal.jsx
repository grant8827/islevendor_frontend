import { useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * A driver's free-text update on an active delivery, without changing its
 * status — "stuck in traffic", "buyer not answering", etc. Posts to
 * dispatch.routes.ts's POST /orders/:id/note, which shows up on the
 * warehouse/shop/reseller Orders tab's Tracking sub-tab (see
 * OrderTrackingList.jsx) alongside the automatic status-change events.
 */
export default function PostTrackingNoteModal({ orderId, onClose, onPosted }) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useToast();

  async function submit() {
    if (!note.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest(`/dispatch/orders/${orderId}/note`, { method: 'POST', body: { note: note.trim() } });
      notify('Update posted.');
      onPosted();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={submitting ? undefined : onClose} />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-navy">Post an update</h2>
          <button type="button" onClick={onClose} disabled={submitting} className="text-slate-500 hover:text-navy disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-xs text-slate-500">Let the seller know what's happening with this delivery.</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Stuck in traffic on Hope Road, running ~15 min late"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            disabled={submitting}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={submit}
            disabled={!note.trim() || submitting}
            className="w-full btn-primary text-xs font-bold py-2.5 rounded-lg transition disabled:opacity-40"
          >
            {submitting ? 'Posting…' : 'Post Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
