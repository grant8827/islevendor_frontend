import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/client.js';
import { Badge, ListState, Pagination } from '../adminShared.jsx';
import { humanize, inputClass, money } from '../adminFormat.js';
import { SectionTitle } from './payShared.jsx';

const TYPES = ['WAREHOUSE', 'RESELLER', 'STORE', 'DRIVER'];

export default function VendorEarnings() {
  const [filters, setFilters] = useState({ type: '', page: 1 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setResult(null);
    const params = new URLSearchParams({ page: filters.page });
    if (filters.type) params.set('type', filters.type);
    apiRequest(`/admin/pay/earnings?${params}`)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [filters]);
  useEffect(load, [load]);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title="Vendor earnings" description="What every seller and driver has earned: pending until each order is delivered, then available to withdraw." />
        <select aria-label="Type" className={inputClass} value={filters.type} onChange={(e) => setFilters({ type: e.target.value, page: 1 })}>
          <option value="">Everyone</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {humanize(t)}s
            </option>
          ))}
        </select>
      </div>
      <ListState rows={result?.accounts ?? null} error={error} onRetry={load} emptyMessage="No accounts." />
      {result?.accounts.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Pending</th>
                  <th className="px-5 py-3">Available</th>
                  <th className="px-5 py-3">Paid out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{a.owner?.fullName}</p>
                      <p className="text-slate-500">
                        <Badge>{humanize(a.accountType)}</Badge> {a.owner?.email}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-amber-700">{money(a.pendingJmd)}</td>
                    <td className="px-5 py-3 font-bold text-primary-dark">{money(a.availableJmd)}</td>
                    <td className="px-5 py-3">{money(a.paidOutJmd)}</td>
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
