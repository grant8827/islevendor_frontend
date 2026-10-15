import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import { Badge, ListState, Pagination } from '../adminShared.jsx';
import { formatDateTime, humanize, inputClass, money } from '../adminFormat.js';
import { SectionTitle } from './payShared.jsx';

const STATUSES = ['PENDING', 'PAID', 'FAILED', 'SUPERSEDED', 'DUPLICATE', 'REFUNDED'];
const STYLES = {
  PAID: 'bg-primary/10 text-primary-dark border-primary/30',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
  DUPLICATE: 'bg-red-100 text-red-700 border-red-300',
};

export default function PayTransactions() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', page: 1 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setResult(null);
    setError(null);
    const params = new URLSearchParams({ page: filters.page });
    if (filters.q) params.set('q', filters.q);
    if (filters.status) params.set('status', filters.status);
    apiRequest(`/admin/pay/transactions?${params}`)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [filters]);
  useEffect(load, [load]);

  return (
    <div className="max-w-6xl">
      <SectionTitle title="Transactions" description="Every card payment attempt through WiPay. One payment can cover several orders from the same checkout." />
      <form
        className="flex flex-wrap gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: query.trim(), page: 1 }));
        }}
      >
        <input type="search" aria-label="Search" placeholder="Reference, WiPay transaction or customer email" className={`${inputClass} w-80`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Status" className={inputClass} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <button type="submit" className="flex items-center gap-1.5 btn-primary text-xs font-bold px-4 rounded-lg">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>
      <ListState rows={result?.payments ?? null} error={error} onRetry={load} emptyMessage="No transactions match." />
      {result?.payments.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Started</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {result.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                    <td className="px-5 py-3 font-mono">
                      {p.reference}
                      {p.wipayTransactionId && <p className="text-slate-500">{p.wipayTransactionId}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{p.customer.fullName}</p>
                      <p className="text-slate-500">{p.customer.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500">{p.orderIds.map((id) => `#${id.slice(0, 8)}`).join(', ')}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap">{money(p.amountJmd)}</td>
                    <td className="px-5 py-3">
                      <Badge className={STYLES[p.status]}>{humanize(p.status)}</Badge>
                      {p.paidAt && <p className="mt-1 text-slate-500">Paid {formatDateTime(p.paidAt)}</p>}
                      {p.message && <p className="mt-1 text-slate-500 max-w-xs whitespace-normal">{p.message}</p>}
                    </td>
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
