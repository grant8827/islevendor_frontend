import { useEffect, useState } from 'react';
import { Truck, Check, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_STYLES = {
  PENDING: 'bg-amazon-orange/20 text-amazon-yellow border-amazon-orange/30',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SUSPENDED: 'bg-amazon-orange/20 text-amazon-yellow border-amazon-orange/30',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

// Owner-side review of driver applications — mirrors warehouse/ApplicationsPanel.jsx
// (the reseller-affiliate equivalent), shared between the warehouse and shop
// dashboards since a delivery application can target either.
export default function DeliveryApplicationsPanel({ ownerType, ownerId, onDecision }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/${ownerType}/${ownerId}/delivery-applications`)
      .then(setApplications)
      .finally(() => setLoading(false));
  }

  useEffect(load, [ownerType, ownerId]);

  async function decide(id, status) {
    try {
      await apiRequest(`/delivery-applications/${id}`, { method: 'PATCH', body: { status } });
      notify(status === 'APPROVED' ? 'Driver approved to deliver for you.' : 'Application rejected.');
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
        <Truck className="w-5 h-5 text-amazon-yellow" />
        <div>
          <h2 className="font-bold text-white text-lg">Delivery Applications</h2>
          <p className="text-xs text-slate-400">Approve drivers before they're one of your regular couriers.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}

      {!loading && pending.length === 0 && decided.length === 0 && (
        <p className="text-sm text-slate-500">No applications yet.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Pending ({pending.length})</h3>
          {pending.map((app) => (
            <div key={app.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{app.driver.user.fullName}</p>
                <p className="text-xs text-slate-500">{app.driver.user.phoneNumber} · requested {new Date(app.requestedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(app.id, 'APPROVED')}
                  className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(app.id, 'REJECTED')}
                  className="flex items-center gap-1 bg-slate-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
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
            <div key={app.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
              <span className="text-slate-300">{app.driver.user.fullName}</span>
              <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLES[app.status]}`}>{app.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
