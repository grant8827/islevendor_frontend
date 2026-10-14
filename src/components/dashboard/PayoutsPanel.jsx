import { useEffect, useState } from 'react';
import { Wallet, History, Banknote } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import PayoutHistoryPanel from './PayoutHistoryPanel.jsx';
import { describePayoutTime, expectedArrival, formatArrivalDate } from '../../lib/payoutTiming.js';

const escrowLabelOf = (t) => (t.escrowState === 'HELD_IN_ESCROW' ? 'Pending' : 'Available');

const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-300',
  Available: 'bg-primary/10 text-primary-dark border-primary/30',
};

const SUBTABS = [
  { key: 'payout', label: 'Payout', icon: Wallet },
  { key: 'history', label: 'Payout History', icon: History },
];

/**
 * Balance + withdrawal for the current user's ledger account — identical
 * across the warehouse/shop/reseller/driver dashboards, since a
 * LedgerAccount is per-user, not per-warehouse/shop/store (see
 * ledger.routes.ts). Unlike OrdersPanel/FeedbackPanel, this needs no
 * `endpoint` prop for that reason.
 *
 * Two sub-tabs, same "one sidebar entry, sub-tabs underneath" pattern as
 * ApplicationsPage: "Payout" shows the current balance and every ledger leg
 * not yet withdrawn, with a Withdraw button; "Payout History" (see
 * PayoutHistoryPanel.jsx) lists past withdrawals, filterable by month/year.
 * Pending is what customers have paid (confirmed by WiPay) for orders not
 * yet delivered; it becomes Available on delivery. Withdrawing Available
 * creates a payout request that IsleVendor sends to the owner's bank by
 * hand, with the expected arrival date shown before and after.
 */
export default function PayoutsPanel() {
  const [subTab, setSubTab] = useState('payout');
  const [accounts, setAccounts] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [timing, setTiming] = useState(null);
  const { notify } = useToast();

  function load() {
    apiRequest('/ledger/accounts/me').then(setAccounts);
    apiRequest('/ledger/transactions/me').then(setTransactions);
    apiRequest('/ledger/payout-timing')
      .then(setTiming)
      .catch(() => setTiming(null));
  }

  useEffect(load, []);

  const totals = (accounts ?? []).reduce(
    (acc, a) => ({
      pending: acc.pending + Number(a.pendingBalanceJmd),
      available: acc.available + Number(a.availableBalanceJmd),
    }),
    { pending: 0, available: 0 },
  );

  async function withdraw() {
    setWithdrawing(true);
    try {
      const [payout] = await apiRequest('/ledger/withdraw', { method: 'POST' });
      notify(
        payout?.expectedBy
          ? `Withdrawal requested — it should be in your account by ${formatArrivalDate(payout.expectedBy)}.`
          : 'Withdrawal requested — see Payout History.',
      );
      setConfirming(false);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-4">Payouts</h2>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {SUBTABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              subTab === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'history' && <PayoutHistoryPanel />}

      {subTab === 'payout' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mb-4">
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">J${totals.pending.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-1">Paid for by the customer. Becomes available once the order is delivered.</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
              <p className="text-xs text-slate-500">Available</p>
              <p className="text-2xl font-bold text-primary-dark mt-1">J${totals.available.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-1">Delivered and ready to withdraw to your bank.</p>
            </div>
          </div>

          {timing && (
            <p className="text-xs text-slate-600 mb-3">
              Withdrawals usually reach your bank account in {describePayoutTime(timing)}.
            </p>
          )}

          {confirming && (
            <div className="max-w-lg bg-white border border-primary/40 rounded-xl p-4 mb-4 text-sm" role="dialog" aria-label="Confirm withdrawal">
              <p className="font-bold text-slate-900">Withdraw J${totals.available.toLocaleString()} to your bank?</p>
              <p className="text-xs text-slate-600 mt-1">
                It goes to the bank or Lynk account you gave when you signed up
                {timing && <>, and should arrive by <strong>{formatArrivalDate(expectedArrival(timing.maxBusinessDays))}</strong> ({describePayoutTime(timing)})</>}.
              </p>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={withdraw} disabled={withdrawing} className="btn-primary text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-40">
                  {withdrawing ? 'Requesting…' : 'Yes, withdraw'}
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="text-xs font-bold px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-surface">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={totals.available <= 0 || withdrawing || confirming}
            className="flex items-center gap-2 btn-primary text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-40 mb-8"
          >
            <Banknote className="w-4 h-4" />
            {withdrawing ? 'Withdrawing…' : `Withdraw J$${totals.available.toLocaleString()}`}
          </button>

          <h3 className="font-bold text-navy text-sm mb-3">Not yet withdrawn</h3>

          {transactions === null && <p className="text-sm text-slate-500">Loading…</p>}
          {transactions?.length === 0 && <p className="text-sm text-slate-500">Nothing waiting to be withdrawn.</p>}

          {transactions?.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="table-header-row uppercase">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const label = escrowLabelOf(t);
                    return (
                      <tr key={t.id} className="hover:bg-surface transition">
                        <td className="px-5 py-3 font-mono text-slate-500">#{t.order.id.slice(0, 8)}</td>
                        <td className="px-5 py-3 text-slate-900">J${Number(t.amountJmd).toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_STYLES[label]}`}>{label}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
