import { ClipboardCheck } from 'lucide-react';
import { APPLICANT_TYPE_LABELS, humanize } from './adminFormat.js';

function Stat({ label, value, tone = 'text-navy' }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
      <p className="text-xs text-slate-500 capitalize">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value.toLocaleString()}</p>
    </div>
  );
}

const ROLE_ORDER = ['CUSTOMER', 'WAREHOUSE', 'RESELLER', 'STORE', 'DRIVER', 'ADMIN'];
const ORDER_STATUS_ORDER = ['AWAITING_PAYMENT', 'PACKING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export default function OverviewPanel({ overview, error, onRetry, onOpenApplicants }) {
  if (error) {
    return (
      <div role="alert">
        <h2 className="font-bold text-navy text-lg mb-2">Overview</h2>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button type="button" onClick={onRetry} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg">
          Try again
        </button>
      </div>
    );
  }
  if (!overview) return <p className="text-sm text-slate-500">Loading…</p>;

  const pendingTotal = Object.values(overview.pendingApplicants).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="font-bold text-navy text-lg">Overview</h2>
        <p className="text-xs text-slate-500 mt-1">Where the platform stands right now.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy text-sm">Applications awaiting review</h3>
          {pendingTotal > 0 && (
            <button type="button" onClick={onOpenApplicants} className="flex items-center gap-1.5 btn-primary text-xs font-bold px-3 py-2 rounded-lg">
              <ClipboardCheck className="w-4 h-4" /> Review {pendingTotal}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(APPLICANT_TYPE_LABELS).map(([type, label]) => (
            <Stat key={type} label={`${label}s`} value={overview.pendingApplicants[type] ?? 0} tone={overview.pendingApplicants[type] ? 'text-amber-600' : 'text-navy'} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-navy text-sm mb-3">Accounts</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {ROLE_ORDER.map((role) => (
            <Stat key={role} label={humanize(role)} value={overview.usersByRole[role] ?? 0} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-navy text-sm mb-3">Orders</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ORDER_STATUS_ORDER.map((status) => (
            <Stat key={status} label={humanize(status)} value={overview.ordersByStatus[status] ?? 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
