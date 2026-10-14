import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../api/client.js';
import { ListState, Pagination } from './adminShared.jsx';
import { formatDateTime, inputClass } from './adminFormat.js';

const ACTIONS = {
  'applicant.decision': 'Applicant decision',
  'kyc_document.access_granted': 'Document viewed',
  'kyc_document.deleted': 'Document deleted',
  'admin.created': 'Administrator created',
  'user.sessions_revoked': 'User signed out everywhere',
  'settings.isledash_rate_changed': 'IsleDash pricing changed',
  'settings.payout_timing_changed': 'Payout time changed',
  'ledger.platform_withdrawal_requested': 'IsleVendor withdrawal requested',
  'payout.paid': 'Payout paid',
  'payout.failed': 'Payout failed',
  'payout.approved': 'Payout approved',
  'payout.wipay_submission_started': 'Payout being sent to WiPay',
  'payout.sent_to_wipay': 'Payout sent to WiPay',
  'payout.checked_with_wipay': 'Payout checked with WiPay',
  'payout_account.updated': 'Payout details changed',
};

function detailOf(event) {
  const { metadata } = event;
  if (event.action === 'applicant.decision') return `${metadata.decision}${metadata.reason ? ` — ${metadata.reason}` : ''}`;
  if (event.action.startsWith('kyc_document.')) return metadata.kind;
  if (event.action === 'user.sessions_revoked') return metadata.reason;
  if (event.action === 'payout_account.updated') return [metadata.method, metadata.bankName, metadata.accountNumber].filter(Boolean).join(' · ');
  if (event.action === 'payout.checked_with_wipay') return `${metadata.status}${metadata.wipayStatus !== undefined ? ` (WiPay ${metadata.wipayStatus})` : ''}`;
  if (event.action === 'settings.payout_timing_changed') {
    const span = (t) => `${t.minBusinessDays}–${t.maxBusinessDays} business days`;
    return `${span(metadata.before)} → ${span(metadata.after)}`;
  }
  if (event.action.startsWith('payout.') || event.action === 'ledger.platform_withdrawal_requested') {
    return [metadata.amountJmd && `J$${Number(metadata.amountJmd).toLocaleString()}`, metadata.reference && `ref ${metadata.reference}`, metadata.transactionId, metadata.note]
      .filter(Boolean)
      .join(' · ');
  }
  if (event.action === 'settings.isledash_rate_changed') {
    const rate = (r) => `J$${Number(r.baseFeeJmd).toLocaleString()} + ${r.extraItemPercent}% per extra item`;
    return `${rate(metadata.before)} → ${rate(metadata.after)}`;
  }
  if (event.action === 'admin.created') return `${metadata.email} (by ${metadata.provisionedBy})`;
  return JSON.stringify(metadata);
}

// The append-only record of privileged actions — who did what, to which
// record, when and from where.
export default function AuditLogPanel() {
  const [filters, setFilters] = useState({ action: '', page: 1 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setResult(null);
    setError(null);
    const params = new URLSearchParams({ page: filters.page });
    if (filters.action) params.set('action', filters.action);
    apiRequest(`/admin/audit-events?${params}`)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(load, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-bold text-navy text-lg">Audit Log</h2>
        <select aria-label="Action" className={inputClass} value={filters.action} onChange={(e) => setFilters({ action: e.target.value, page: 1 })}>
          <option value="">All actions</option>
          {Object.entries(ACTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ListState rows={result?.events ?? null} error={error} onRetry={load} emptyMessage="Nothing recorded yet." />

      {result?.events.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Who</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Record</th>
                  <th className="px-5 py-3">Detail</th>
                  <th className="px-5 py-3">IP address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface transition align-top">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(event.createdAt)}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{event.actor?.fullName ?? 'System'}</p>
                      {event.actor && <p className="text-slate-500">{event.actor.email}</p>}
                    </td>
                    <td className="px-5 py-3">{ACTIONS[event.action] ?? event.action}</td>
                    <td className="px-5 py-3">
                      {event.targetType} <span className="font-mono text-slate-500">#{event.targetId.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-3 break-words max-w-xs">{detailOf(event)}</td>
                    <td className="px-5 py-3 font-mono text-slate-500">{event.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}
    </div>
  );
}
