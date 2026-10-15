import { useCallback, useEffect, useState } from 'react';
import { Banknote, Landmark, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, ListState, Pagination } from './adminShared.jsx';
import { formatDateTime, humanize, inputClass } from './adminFormat.js';
import { formatArrivalDate } from '../../lib/payoutTiming.js';

const money = (n) => `J$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TABS = [
  { key: 'REQUESTED', label: 'To approve' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SUBMITTED', label: 'Sent to WiPay' },
  { key: 'PROCESSING', label: 'WiPay processing' },
  { key: 'PAID', label: 'Paid' },
  { key: 'FAILED', label: 'Failed' },
];

const STATUS_STYLES = {
  REQUESTED: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-sky-100 text-sky-700 border-sky-300',
  SUBMITTED: 'bg-sky-100 text-sky-700 border-sky-300',
  PROCESSING: 'bg-sky-100 text-sky-700 border-sky-300',
  PAID: 'bg-primary/10 text-primary-dark border-primary/30',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
};

function Stat({ label, value, tone = 'text-navy' }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function Destination({ destination }) {
  if (!destination) return <span className="text-slate-400">No payout details on file</span>;
  if (destination.payoutMethod === 'LYNK_WALLET') return <span>Lynk · {destination.lynkWalletId}</span>;
  return (
    <span className="block">
      {destination.bankName} · {destination.accountHolderName}
      <span className="block font-mono">
        {destination.accountNumber}
        {destination.branchCode && ` · branch ${destination.branchCode}`}
        {destination.bankAccountType && ` · ${destination.bankAccountType.toLowerCase()}`}
      </span>
      {destination.source === 'sign_up' && <span className="block text-amber-700">From sign-up — not confirmed in their payout details yet</span>}
    </span>
  );
}

// Recording how a payout was settled — the money itself goes out by bank or
// Lynk transfer outside IsleVendor.
function SettleModal({ payout, outcome, onClose, onDone }) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const paid = outcome === 'PAID';

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/admin/payouts/${payout.id}`, {
        method: 'PATCH',
        body: { status: outcome, ...(reference.trim() ? { reference: reference.trim() } : {}), ...(note.trim() ? { note: note.trim() } : {}) },
      });
      onDone(paid ? 'Payout marked as paid.' : 'Payout marked as failed — the money is back in their available balance.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form onSubmit={save} role="dialog" aria-modal="true" aria-label={paid ? 'Mark payout paid' : 'Mark payout failed'} className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-navy">{paid ? 'Mark as paid' : 'Mark as failed'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {money(payout.amountJmd)} to {payout.ledgerAccount.user?.fullName ?? 'IsleVendor'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>
        {paid ? (
          <label className="block text-xs text-slate-600">
            Transfer reference
            <input required maxLength={200} className={`${inputClass} w-full mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. the bank or Lynk transaction number" />
          </label>
        ) : (
          <p className="text-xs text-slate-600">The money goes back into their available balance so they can withdraw it again.</p>
        )}
        <label className="block text-xs text-slate-600">
          {paid ? 'Note (optional)' : 'Why it failed'}
          <textarea rows={2} required={!paid} maxLength={1000} className={`${inputClass} w-full mt-1`} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40 ${paid ? 'btn-primary' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {saving ? 'Saving…' : paid ? 'Mark paid' : 'Mark failed'}
          </button>
        </div>
      </form>
    </div>
  );
}

// IsleVendor's own balance (commission, held in escrow until delivery) and
// the queue of payout requests from every seller and driver — paid outside
// the platform, then recorded here.
// `show`: 'platform' for IsleVendor's own balance only, 'queue' for the
// payout requests only, or both.
export default function AdminPayoutsPanel({ show = 'all' }) {
  const { notify } = useToast();
  const [platform, setPlatform] = useState(null);
  const [platformError, setPlatformError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [filters, setFilters] = useState({ status: 'REQUESTED', page: 1 });
  const [queue, setQueue] = useState(null);
  const [queueError, setQueueError] = useState(null);
  const [settling, setSettling] = useState(null); // { payout, outcome }
  const [acting, setActing] = useState(null); // payout id with a request in flight

  // Approve, send through WiPay, or check with WiPay — each a single POST.
  async function act(payout, action, success) {
    setActing(payout.id);
    try {
      await apiRequest(`/admin/payouts/${payout.id}/${action}`, { method: 'POST' });
      notify(success);
    } catch (err) {
      notify(err.message);
    } finally {
      setActing(null);
      loadQueue();
    }
  }

  const loadPlatform = useCallback(() => {
    apiRequest('/admin/ledger/platform')
      .then(setPlatform)
      .catch((err) => setPlatformError(err.message));
  }, []);

  const loadQueue = useCallback(() => {
    setQueue(null);
    setQueueError(null);
    apiRequest(`/admin/payouts?${new URLSearchParams(filters)}`)
      .then(setQueue)
      .catch((err) => setQueueError(err.message));
  }, [filters]);

  useEffect(loadPlatform, [loadPlatform]);
  useEffect(loadQueue, [loadQueue]);

  async function withdrawPlatform() {
    setWithdrawing(true);
    try {
      const payout = await apiRequest('/admin/ledger/platform/withdraw', { method: 'POST' });
      notify(`Withdrawal of ${money(payout.amountJmd)} requested — it's in the queue below to pay out.`);
      loadPlatform();
      loadQueue();
    } catch (err) {
      notify(err.message);
    } finally {
      setWithdrawing(false);
    }
  }

  const account = platform?.account;

  return (
    <div className="space-y-10 max-w-6xl">
      {show !== 'queue' && (
      <section>
        <h2 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" /> IsleVendor balance
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          IsleVendor's commission. It's held until each order is delivered, then becomes available. IsleDash fees move to the driver who delivered, so they're never part of this balance.
        </p>
        {platformError && (
          <p className="text-sm text-red-600" role="alert">
            {platformError}
          </p>
        )}
        {!platform && !platformError && <p className="text-sm text-slate-500">Loading…</p>}
        {platform && !account && <p className="text-sm text-slate-500">The platform ledger account hasn't been set up yet.</p>}
        {account && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mb-4">
              <Stat label="Held until delivery" value={money(account.pendingBalanceJmd)} tone="text-amber-600" />
              <Stat label="Available" value={money(account.availableBalanceJmd)} tone="text-primary-dark" />
            </div>
            <button
              type="button"
              onClick={withdrawPlatform}
              disabled={withdrawing || Number(account.availableBalanceJmd) <= 0}
              className="flex items-center gap-2 btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40 mb-6"
            >
              <Banknote className="w-4 h-4" /> {withdrawing ? 'Requesting…' : `Withdraw ${money(account.availableBalanceJmd)}`}
            </button>

            {platform.entries.length > 0 && (
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="table-header-row uppercase">
                    <tr>
                      <th className="px-5 py-3">Order #</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {platform.entries.map((e) => (
                      <tr key={e.id}>
                        <td className="px-5 py-3 font-mono text-slate-500">#{e.order.id.slice(0, 8)}</td>
                        <td className="px-5 py-3 text-slate-900">{money(e.amountJmd)}</td>
                        <td className="px-5 py-3">
                          {e.reversedAt ? 'Refunded' : e.payoutId ? 'Withdrawn' : e.escrowState === 'AVAILABLE' ? 'Available' : 'Held until delivery'}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDateTime(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
      )}

      {show !== 'platform' && (
      <section>
        <h2 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-primary" /> Payout requests
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Approve each request, then pay it — by your own bank or Lynk transfer (record it with "Paid by hand"){' '}
          {queue?.automatedPayoutsEnabled ? 'or automatically with "Send via WiPay", which is marked paid once WiPay confirms the transfer' : '— automatic WiPay payouts are switched off'}. A failed payout returns the money to the owner's available balance.
        </p>

        <div className="flex gap-1 border-b border-slate-200 mb-4">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilters({ status: key, page: 1 })}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${filters.status === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <ListState rows={queue?.payouts ?? null} error={queueError} onRetry={loadQueue} emptyMessage="Nothing here." />
        {queue?.payouts.length > 0 && (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="table-header-row uppercase">
                  <tr>
                    <th className="px-5 py-3">Requested</th>
                    <th className="px-5 py-3">For</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Send to</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 align-top">
                  {queue.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(p.createdAt)}
                        {p.status === 'REQUESTED' && p.expectedBy && (
                          <span className={`block mt-1 font-bold ${new Date(p.expectedBy) < new Date(new Date().toDateString()) ? 'text-red-600' : 'text-slate-600'}`}>
                            Due by {formatArrivalDate(p.expectedBy)}
                            {new Date(p.expectedBy) < new Date(new Date().toDateString()) && ' — overdue'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-900">{p.ledgerAccount.user?.fullName ?? 'IsleVendor'}</p>
                        <p className="text-slate-500">
                          {humanize(p.ledgerAccount.accountType)}
                          {p.ledgerAccount.user && <> · {p.ledgerAccount.user.email}</>}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap">{money(p.amountJmd)}</td>
                      <td className="px-5 py-3">
                        {p.ledgerAccount.accountType === 'PLATFORM' ? <span>IsleVendor's own account</span> : <Destination destination={p.destination} />}
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={STATUS_STYLES[p.status]}>{humanize(p.status)}</Badge>
                        {p.channel === 'WIPAY' && <p className="mt-1 text-slate-500">via WiPay{p.providerTransactionId && ` · ${p.providerTransactionId}`}</p>}
                        {p.providerStatusDescription && <p className="mt-1 text-slate-500">WiPay: {p.providerStatusDescription}</p>}
                        {p.providerFeeJmd && <p className="mt-1 text-slate-500">WiPay fee {money(p.providerFeeJmd)}</p>}
                        {p.reference && <p className="mt-1 font-mono text-slate-500">Ref {p.reference}</p>}
                        {p.note && <p className="mt-1 text-slate-500">{p.note}</p>}
                        {p.lastError && <p className="mt-1 text-red-600 max-w-xs whitespace-normal">{p.lastError}</p>}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <span className="flex flex-wrap justify-end gap-2">
                          {p.status === 'REQUESTED' && (
                            <button type="button" disabled={acting === p.id} onClick={() => act(p, 'approve', 'Payout approved.')} className="btn-primary text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-40">
                              Approve
                            </button>
                          )}
                          {p.status === 'APPROVED' && queue.automatedPayoutsEnabled && p.destination?.readyForAutomaticPayout && (
                            <button
                              type="button"
                              disabled={acting === p.id}
                              onClick={() => act(p, 'send-wipay', 'Sent to WiPay — it’s marked paid once WiPay confirms the transfer.')}
                              className="btn-primary text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-40"
                            >
                              Send via WiPay
                            </button>
                          )}
                          {['REQUESTED', 'APPROVED'].includes(p.status) && (
                            <>
                              <button type="button" onClick={() => setSettling({ payout: p, outcome: 'PAID' })} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-surface">
                                Paid by hand
                              </button>
                              <button type="button" onClick={() => setSettling({ payout: p, outcome: 'FAILED' })} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50">
                                Failed
                              </button>
                            </>
                          )}
                          {['SUBMITTED', 'PROCESSING'].includes(p.status) && (
                            <button type="button" disabled={acting === p.id} onClick={() => act(p, 'check-wipay', 'Checked with WiPay.')} className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-sky-300 text-sky-700 hover:bg-sky-50 disabled:opacity-40">
                              Check with WiPay
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={queue.page} pageSize={queue.pageSize} total={queue.total} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </section>
      )}

      {settling && (
        <SettleModal
          payout={settling.payout}
          outcome={settling.outcome}
          onClose={() => setSettling(null)}
          onDone={(message) => {
            notify(message);
            setSettling(null);
            loadQueue();
            loadPlatform();
          }}
        />
      )}
    </div>
  );
}
