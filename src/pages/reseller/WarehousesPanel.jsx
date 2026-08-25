import { useEffect, useState } from 'react';
import { Warehouse, Package } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import ViewWarehouseProductsModal from './ViewWarehouseProductsModal.jsx';

const STATUS_STYLES = {
  PENDING: 'bg-amazon-orange/20 text-amazon-yellow border-amazon-orange/30',
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SUSPENDED: 'bg-amazon-orange/20 text-amazon-yellow border-amazon-orange/30',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function WarehousesPanel() {
  const [warehouses, setWarehouses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingWarehouse, setViewingWarehouse] = useState(null);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      apiRequest('/warehouse', { auth: false }),
      apiRequest('/authorizations/mine'),
    ]).then(([wh, apps]) => {
      setWarehouses(wh);
      setApplications(apps);
    }).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function apply(warehouseId) {
    try {
      await apiRequest('/authorizations', { method: 'POST', body: { warehouseId } });
      notify('Application sent — the warehouse will review it.');
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  const statusFor = (warehouseId) => applications.find((a) => a.warehouseId === warehouseId)?.status;

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Warehouse className="w-5 h-5 text-amazon-yellow" />
        <div>
          <h2 className="font-bold text-white text-lg">Applications</h2>
          <p className="text-xs text-slate-400">Browse warehouses and apply for permission to sell their stock.</p>
        </div>
      </div>

      {warehouses.length === 0 && <p className="text-sm text-slate-500">No warehouses registered yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => {
          const status = statusFor(wh.id);
          const canApply = !status || status === 'REJECTED';
          return (
            <div key={wh.id} className="relative bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              {status && (
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
              )}

              <p className="text-sm font-bold text-white pr-20">{wh.name}</p>
              <p className="text-xs text-slate-400 mt-1">{wh.addressLine}, {wh.parish}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                <Package className="w-3.5 h-3.5" /> {wh._count.products} SKUs available
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewingWarehouse(wh)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs py-2.5 rounded-lg transition"
                >
                  View Products
                </button>
                <button
                  type="button"
                  onClick={() => apply(wh.id)}
                  disabled={!canApply}
                  className="flex-1 bg-amazon-yellow hover:bg-amazon-orange disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amazon-yellow text-slate-950 font-bold text-xs py-2.5 rounded-lg transition"
                >
                  {status === 'REJECTED' ? 'Re-apply' : 'Apply'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {viewingWarehouse && (
        <ViewWarehouseProductsModal warehouse={viewingWarehouse} onClose={() => setViewingWarehouse(null)} />
      )}
    </div>
  );
}
