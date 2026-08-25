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
        <Users className="w-4 h-4 text-amazon-yellow" />
        <h3 className="font-bold text-white text-sm">Approved Affiliates</h3>
      </div>

      {resellers === null && <p className="text-sm text-slate-400">Loading…</p>}
      {resellers?.length === 0 && (
        <p className="text-sm text-slate-500">
          No approved affiliates yet — decide pending applications from the <strong>Affiliate Applications</strong> tab.
        </p>
      )}

      {resellers?.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Approved</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {resellers.map((r) => (
                <tr key={r.id} className={r.status === 'SUSPENDED' ? 'opacity-50' : ''}>
                  <td className="px-5 py-3 font-bold text-white">
                    {r.store.storeName}
                    <Link to={`/store/${r.store.slug}`} className="block text-[11px] font-normal text-amazon-yellow hover:underline">
                      /store/{r.store.slug}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        r.status === 'SUSPENDED'
                          ? 'text-amazon-orange bg-amazon-orange/10 border-amazon-orange/30'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="Add/remove items for this seller"
                        onClick={() => setEditingStore(r.store)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={r.status === 'APPROVED' ? 'Suspend' : 'Unsuspend'}
                        onClick={() => toggleSuspend(r)}
                        className={`p-1.5 rounded-lg transition ${
                          r.status === 'APPROVED' ? 'text-slate-400 hover:text-amazon-yellow hover:bg-slate-700' : 'text-emerald-400 hover:bg-slate-700'
                        }`}
                      >
                        {r.status === 'APPROVED' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => remove(r)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
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
