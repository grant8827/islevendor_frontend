import { useEffect, useState } from 'react';
import { Wallet, History, Banknote } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import PayoutHistoryPanel from './PayoutHistoryPanel.jsx';

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
 * Withdrawing is bookkeeping only — no real bank/Lynk disbursement is wired
 * up yet (see ledger.service.ts's withdrawBalance).
 */
export default function PayoutsPanel() {
  const [subTab, setSubTab] = useState('payout');
  const [accounts, setAccounts] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const { notify } = useToast();

  function load() {
    apiRequest('/ledger/accounts/me').then(setAccounts);
    apiRequest('/ledger/transactions/me').then(setTransactions);
  }

  useEffect(load, []);

  const totals = (accounts ?? []).reduce(
    (acc, a) => ({
      pending: acc.pending + Number(a.pendingBalanceJmd),
      available: acc.available + Number(a.availableBalanceJmd),
    }),
    { pending: 0, available: 0 },
  );
  const totalBalance = totals.pending + totals.available;

  async function withdraw() {
    setWithdrawing(true);
    try {
      await apiRequest('/ledger/withdraw', { method: 'POST' });
      notify('Withdrawal recorded — see Payout History.');
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
              <p className="text-xs text-slate-500">Pending (in escrow)</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">J${totals.pending.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
              <p className="text-xs text-slate-500">Available</p>
              <p className="text-2xl font-bold text-primary-dark mt-1">J${totals.available.toLocaleString()}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={withdraw}
            disabled={totalBalance <= 0 || withdrawing}
            className="flex items-center gap-2 btn-primary text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-40 mb-8"
          >
            <Banknote className="w-4 h-4" />
            {withdrawing ? 'Withdrawing…' : `Withdraw J$${totalBalance.toLocaleString()}`}
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
