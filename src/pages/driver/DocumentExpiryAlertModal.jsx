import { AlertTriangle, X } from 'lucide-react';

function formatDaysLeft(alert) {
  if (alert.isExpired) {
    const daysAgo = Math.abs(alert.daysUntilExpiry);
    return `Expired ${daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`}`;
  }
  if (alert.daysUntilExpiry === 0) return 'Expires today';
  return `Expires in ${alert.daysUntilExpiry} day${alert.daysUntilExpiry === 1 ? '' : 's'}`;
}

// Popup shown right after a driver logs in when one of their KYC documents
// (license/insurance/registration) is expired or expiring within 7 days —
// see backend-node's GET /drivers/me/document-alerts.
export default function DocumentExpiryAlertModal({ alerts, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Document{alerts.length > 1 ? 's' : ''} need attention
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.documentType}
              className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
                alert.isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <span className="text-sm font-semibold text-slate-900">{alert.label}</span>
              <span className={`text-xs font-bold whitespace-nowrap ${alert.isExpired ? 'text-red-700' : 'text-amber-700'}`}>
                {formatDaysLeft(alert)}
              </span>
            </div>
          ))}
          <p className="text-xs text-slate-500 pt-1">
            Contact IsleVendor support to update an expiring document before it affects your ability to accept routes.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
