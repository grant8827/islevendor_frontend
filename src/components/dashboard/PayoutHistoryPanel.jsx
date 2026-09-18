import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { apiRequest } from '../../api/client.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Every past withdrawal (see ledger.routes.ts's GET /payouts/me) — each row
 * is one Payout, with the order(s) whose ledger legs it swept up, so a
 * warehouse/store/reseller/driver can still tell which delivered package(s)
 * a given withdrawal came from. Filterable by month and/or year.
 */
export default function PayoutHistoryPanel() {
  const [payouts, setPayouts] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // One unfiltered load, just to populate the year dropdown's options.
  useEffect(() => {
    apiRequest('/ledger/payouts/me').then((data) => {
      setAvailableYears([...new Set(data.map((p) => new Date(p.createdAt).getFullYear()))].sort((a, b) => b - a));
    });
  }, []);

  useEffect(() => {
    setPayouts(null);
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    const qs = params.toString();
    apiRequest(`/ledger/payouts/me${qs ? `?${qs}` : ''}`).then(setPayouts);
  }, [month, year]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Payout History</h2>
          <p className="text-xs text-slate-500">Every withdrawal you've made.</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
        >
          <option value="">All Years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {payouts === null && <p className="text-sm text-slate-500">Loading…</p>}
      {payouts?.length === 0 && <p className="text-sm text-slate-500">No withdrawals match this filter.</p>}

      {payouts?.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-surface transition">
                  <td className="px-5 py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-bold text-slate-900">J${Number(p.amountJmd).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{p.legs.map((l) => `#${l.order.id.slice(0, 8)}`).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
