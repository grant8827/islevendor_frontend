import { useEffect, useState } from 'react';
import { Briefcase, Package } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import ViewWarehouseProductsModal from './ViewWarehouseProductsModal.jsx';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-primary/10 text-primary-dark border-primary/30',
  SUSPENDED: 'bg-amber-100 text-amber-700 border-amber-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

// A "job board" of active reseller vacancies (see warehouse/VacanciesPanel.jsx
// for the warehouse-side posting form) — a warehouse with no active vacancy
// simply has no card here. Applying is still "apply to this warehouse"
// (POST /authorizations), the same as before; a vacancy is discovery/
// marketing, not a separate application record, so if a warehouse posted
// more than one vacancy, each card shares the same application status.
export default function WarehousesPanel() {
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingWarehouse, setViewingWarehouse] = useState(null);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      apiRequest('/warehouse/vacancies', { auth: false }),
      apiRequest('/authorizations/mine'),
    ]).then(([vacancyList, apps]) => {
      setVacancies(vacancyList);
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

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Applications</h2>
          <p className="text-xs text-slate-500">Open vacancies from warehouses currently recruiting resellers.</p>
        </div>
      </div>

      {vacancies.length === 0 && (
        <p className="text-sm text-slate-500">No open vacancies right now — check back later.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vacancies.map((v) => {
          const wh = v.warehouse;
          const status = statusFor(wh.id);
          const canApply = !status || status === 'REJECTED';
          return (
            <div key={v.id} className="relative bg-white border border-slate-200 shadow-sm rounded-xl p-5">
              {status && (
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
              )}

              <p className="text-sm font-bold text-slate-900 pr-20">{v.title}</p>
              <p className="text-xs text-slate-500 mt-1">{wh.name} · {wh.addressLine}, {wh.parish}</p>
              <p className="text-sm text-slate-700 mt-3 whitespace-pre-line">{v.description}</p>

              <p className="text-xs text-slate-500 flex items-center gap-1 mt-3">
                <Package className="w-3.5 h-3.5" /> {wh._count.products} SKUs available
              </p>
              <p className="text-xs text-primary-dark font-bold mt-1">{wh.resellerCommissionPercent}% reseller commission</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewingWarehouse(wh)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg transition"
                >
                  View Products
                </button>
                <button
                  type="button"
                  onClick={() => apply(wh.id)}
                  disabled={!canApply}
                  className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed text-xs py-2.5"
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
