import { useEffect, useState } from 'react';
import { Truck, Warehouse, Building2, Package } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-primary/10 text-primary-dark border-primary/30',
  SUSPENDED: 'bg-amber-100 text-amber-700 border-amber-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

// Driver-side apply flow — mirrors reseller/WarehousesPanel.jsx, but lists
// both warehouses and shops (a driver can courier for either) and posts to
// delivery-applications instead of authorizations.
export default function ApplyToDeliverPanel() {
  const [warehouses, setWarehouses] = useState([]);
  const [shops, setShops] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      apiRequest('/warehouse', { auth: false }),
      apiRequest('/shop', { auth: false }),
      apiRequest('/delivery-applications/mine'),
    ]).then(([wh, sh, apps]) => {
      setWarehouses(wh);
      setShops(sh);
      setApplications(apps);
    }).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function apply(body) {
    try {
      await apiRequest('/delivery-applications', { method: 'POST', body });
      notify('Application sent — they will review it.');
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  const statusForWarehouse = (warehouseId) => applications.find((a) => a.warehouseId === warehouseId)?.status;
  const statusForShop = (shopId) => applications.find((a) => a.shopId === shopId)?.status;

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Apply to Deliver</h2>
          <p className="text-xs text-slate-500">Browse warehouses and stores and apply to be one of their regular couriers.</p>
        </div>
      </div>

      <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
        <Warehouse className="w-3.5 h-3.5" /> Warehouses
      </h3>
      {warehouses.length === 0 && <p className="text-sm text-slate-500 mb-6">No warehouses registered yet.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {warehouses.map((wh) => {
          const status = statusForWarehouse(wh.id);
          const canApply = !status || status === 'REJECTED';
          return (
            <div key={wh.id} className="relative bg-white border border-slate-200 shadow-sm rounded-xl p-5">
              {status && (
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
              )}
              <p className="text-sm font-bold text-slate-900 pr-20">{wh.name}</p>
              <p className="text-xs text-slate-500 mt-1">{wh.addressLine}, {wh.parish}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                <Package className="w-3.5 h-3.5" /> {wh._count.products} SKUs
              </p>
              <button
                type="button"
                onClick={() => apply({ warehouseId: wh.id })}
                disabled={!canApply}
                className="btn-primary mt-4 w-full disabled:opacity-40 disabled:cursor-not-allowed text-xs py-2.5"
              >
                {status === 'REJECTED' ? 'Re-apply' : 'Apply'}
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" /> Stores
      </h3>
      {shops.length === 0 && <p className="text-sm text-slate-500">No stores registered yet.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shops.map((shop) => {
          const status = statusForShop(shop.id);
          const canApply = !status || status === 'REJECTED';
          return (
            <div key={shop.id} className="relative bg-white border border-slate-200 shadow-sm rounded-xl p-5">
              {status && (
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                  {status}
                </span>
              )}
              <p className="text-sm font-bold text-slate-900 pr-20">{shop.shopName}</p>
              <p className="text-xs text-slate-500 mt-1">{shop.addressLine}, {shop.parish}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                <Package className="w-3.5 h-3.5" /> {shop._count.products} SKUs
              </p>
              <button
                type="button"
                onClick={() => apply({ shopId: shop.id })}
                disabled={!canApply}
                className="btn-primary mt-4 w-full disabled:opacity-40 disabled:cursor-not-allowed text-xs py-2.5"
              >
                {status === 'REJECTED' ? 'Re-apply' : 'Apply'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
