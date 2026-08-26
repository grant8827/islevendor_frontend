import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Pencil, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import AssignItemsModal from './AssignItemsModal.jsx';

export default function ApprovedResellersSection({ warehouseId }) {
  const [resellers, setResellers] = useState(null);
  const [editingStore, setEditingStore] = useState(null);
  const { notify } = useToast();

  function load() {
    apiRequest(`/warehouse/${warehouseId}/authorizations`).then((all) => {
      setResellers(all.filter((a) => a.status === 'APPROVED' || a.status === 'SUSPENDED'));
    });
  }

  useEffect(load, [warehouseId]);

  async function toggleSuspend(authorization) {
    const nextStatus = authorization.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    try {
      await apiRequest(`/authorizations/${authorization.id}`, { method: 'PATCH', body: { status: nextStatus } });
      notify(`${authorization.store.storeName} ${nextStatus === 'SUSPENDED' ? 'suspended' : 'unsuspended'}.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  async function remove(authorization) {
    if (!window.confirm(`Remove ${authorization.store.storeName}? This deletes their item grants and takes down anything they've listed from your warehouse.`)) return;
    try {
      await apiRequest(`/authorizations/${authorization.id}`, { method: 'DELETE' });
      notify(`${authorization.store.storeName} removed.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-navy text-sm">Approved Resellers</h3>
      </div>

      {resellers === null && <p className="text-sm text-slate-500">Loading…</p>}
      {resellers?.length === 0 && (
        <p className="text-sm text-slate-500">
          No approved resellers yet — decide pending applications from the <strong>Reseller Applications</strong> tab.
        </p>
      )}

      {resellers?.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Approved</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resellers.map((r) => (
                <tr key={r.id} className={r.status === 'SUSPENDED' ? 'opacity-50' : ''}>
                  <td className="px-5 py-3 font-bold text-slate-900">
                    {r.store.storeName}
                    <Link to={`/store/${r.store.slug}`} className="block text-[11px] font-normal text-primary hover:underline">
                      /store/{r.store.slug}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        r.status === 'SUSPENDED'
                          ? 'text-amber-700 bg-amber-100 border-amber-300'
                          : 'text-primary-dark bg-primary/10 border-primary/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="Add/remove items for this seller"
                        onClick={() => setEditingStore(r.store)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={r.status === 'APPROVED' ? 'Suspend' : 'Unsuspend'}
                        onClick={() => toggleSuspend(r)}
                        className={`p-1.5 rounded-lg transition ${
                          r.status === 'APPROVED' ? 'text-slate-500 hover:text-primary hover:bg-slate-100' : 'text-primary hover:bg-slate-100'
                        }`}
                      >
                        {r.status === 'APPROVED' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => remove(r)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingStore && (
        <AssignItemsModal warehouseId={warehouseId} store={editingStore} onClose={() => setEditingStore(null)} />
      )}
    </div>
  );
}
