import { useEffect, useState } from 'react';
import { Users, Check, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-primary/10 text-primary-dark border-primary/30',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

export default function ApplicationsPanel({ warehouseId, onDecision }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/warehouse/${warehouseId}/authorizations`)
      .then(setApplications)
      .finally(() => setLoading(false));
  }

  useEffect(load, [warehouseId]);

  async function decide(id, status) {
    try {
      await apiRequest(`/authorizations/${id}`, { method: 'PATCH', body: { status } });
      notify(status === 'APPROVED' ? 'Reseller approved to sell your stock.' : 'Application rejected.');
      load();
      onDecision?.();
    } catch (err) {
      notify(err.message);
    }
  }

  const pending = applications.filter((a) => a.status === 'PENDING');
  const decided = applications.filter((a) => a.status !== 'PENDING');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Reseller Applications</h2>
          <p className="text-xs text-slate-500">Approve resellers before they can list your SKUs on their storefront.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && pending.length === 0 && decided.length === 0 && (
        <p className="text-sm text-slate-500">No applications yet.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Pending ({pending.length})</h3>
          {pending.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{app.store.storeName}</p>
                <p className="text-xs text-slate-500">/{app.store.slug} · requested {new Date(app.requestedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(app.id, 'APPROVED')}
                  className="flex items-center gap-1 btn-primary text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(app.id, 'REJECTED')}
                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">History</h3>
          {decided.map((app) => (
            <div key={app.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
              <span className="text-slate-700">{app.store.storeName}</span>
              <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLES[app.status]}`}>{app.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
