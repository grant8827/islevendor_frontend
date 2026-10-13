import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Badge, ListState, Pagination } from './adminShared.jsx';
import { humanize, inputClass } from './adminFormat.js';

const STATUSES = ['AWAITING_PAYMENT', 'PACKING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const STATUS_STYLES = {
  AWAITING_PAYMENT: 'bg-slate-100 text-slate-600 border-slate-300',
  PACKING: 'bg-amber-100 text-amber-700 border-amber-300',
  READY_FOR_PICKUP: 'bg-sky-100 text-sky-700 border-sky-300',
  PICKED_UP: 'bg-sky-100 text-sky-700 border-sky-300',
  DELIVERED: 'bg-primary/10 text-primary-dark border-primary/30',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
  REFUNDED: 'bg-red-100 text-red-700 border-red-300',
};

// Every order on the platform — lookup only. Find one by the order number
// customers and sellers quote ("#1a2b3c4d"), or browse by status.
export default function AdminOrdersPanel() {
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
    apiRequest(`/admin/orders?${params}`)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(load, [load]);

  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-4">Orders</h2>

      <form
        className="flex flex-wrap gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: query.trim().replace(/^#/, ''), page: 1 }));
        }}
      >
        <input type="search" aria-label="Order number" placeholder="Order number, e.g. #1a2b3c4d" className={`${inputClass} w-72 font-mono`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Status" className={inputClass} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {humanize(status)}
            </option>
          ))}
        </select>
        <button type="submit" className="flex items-center gap-1.5 btn-primary text-xs font-bold px-4 rounded-lg">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      <ListState rows={result?.orders ?? null} error={error} onRetry={load} emptyMessage="No orders match." />

      {result?.orders.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Placed</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface transition">
                    <td className="px-5 py-3 font-mono text-slate-500">#{o.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{o.customer.fullName}</p>
                      <p className="text-slate-500">{o.customer.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {o.shop?.shopName ?? o.resellerStore?.storeName ?? '—'}
                      {o.warehouse && <p className="text-slate-500">via {o.warehouse.name}</p>}
                    </td>
                    <td className="px-5 py-3">{o.driver?.fullName ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-900">J${Number(o.totalPaidJmd).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Badge className={STATUS_STYLES[o.status]}>{humanize(o.status)}</Badge>
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
