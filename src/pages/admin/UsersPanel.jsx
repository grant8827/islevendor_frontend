import { useCallback, useEffect, useState } from 'react';
import { LogOut, Search } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge, ListState, Pagination } from './adminShared.jsx';
import { humanize, inputClass } from './adminFormat.js';

const ROLES = ['CUSTOMER', 'WAREHOUSE', 'RESELLER', 'STORE', 'DRIVER', 'ADMIN'];

// Every account on the platform, searchable by name or email. The one action
// so far is signing a user out of every device (for a suspected compromised
// account) — suspending and role changes come with the user management work.
export default function UsersPanel() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', page: 1 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { user: me, signOut } = useAuth();
  const { notify } = useToast();

  async function signOutEverywhere(target) {
    const reason = window.prompt(`Sign ${target.fullName} out of every device?\n\nReason (recorded in the audit log):`);
    if (!reason?.trim()) return;
    try {
      await apiRequest(`/admin/users/${target.id}/revoke-sessions`, { method: 'POST', body: { reason: reason.trim() } });
      // Doing it to your own account ends this session too.
      if (target.id === me.id) signOut();
      else notify(`${target.fullName} has been signed out everywhere.`);
    } catch (err) {
      notify(err.message);
    }
  }

  const load = useCallback(() => {
    setResult(null);
    setError(null);
    const params = new URLSearchParams({ page: filters.page });
    if (filters.q) params.set('q', filters.q);
    if (filters.role) params.set('role', filters.role);
    apiRequest(`/admin/users?${params}`)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(load, [load]);

  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-4">Users</h2>

      <form
        className="flex flex-wrap gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: query.trim(), page: 1 }));
        }}
      >
        <input type="search" aria-label="Search users" placeholder="Search by name or email" className={`${inputClass} w-72`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Role" className={inputClass} value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}>
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {humanize(role)}
            </option>
          ))}
        </select>
        <button type="submit" className="flex items-center gap-1.5 btn-primary text-xs font-bold px-4 rounded-lg">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>

      <ListState rows={result?.users ?? null} error={error} onRetry={load} emptyMessage="No users match." />

      {result?.users.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface transition">
                    <td className="px-5 py-3 font-bold text-slate-900">{u.fullName}</td>
                    <td className="px-5 py-3 break-all">{u.email}</td>
                    <td className="px-5 py-3">{u.phoneNumber}</td>
                    <td className="px-5 py-3">
                      <Badge className={u.role === 'ADMIN' ? 'bg-navy text-white border-navy' : undefined}>{humanize(u.role)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => signOutEverywhere(u)} className="flex items-center gap-1 ml-auto text-red-700 hover:underline font-bold whitespace-nowrap">
                        <LogOut className="w-3.5 h-3.5" /> Sign out everywhere
                      </button>
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
