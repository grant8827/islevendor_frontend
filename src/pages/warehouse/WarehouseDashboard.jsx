import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Warehouse as WarehouseIcon, Package, Users, ClipboardList, Truck, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import DeliveryApplicationsPanel from '../../components/dashboard/DeliveryApplicationsPanel.jsx';
import WarehouseSelector from './WarehouseSelector.jsx';
import WarehouseSetupForm from './WarehouseSetupForm.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import ProductsPanel from './ProductsPanel.jsx';
import ApplicationsPanel from './ApplicationsPanel.jsx';
import PackingQueuePanel from './PackingQueuePanel.jsx';
import ApprovedResellersSection from './ApprovedResellersSection.jsx';

export default function WarehouseDashboard() {
  const [warehouses, setWarehouses] = useState(undefined); // undefined = loading, [] = none yet
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ productCount: 0, pendingApplications: 0, pendingDeliveryApplications: 0, packingCount: 0 });

  // Guards against out-of-order responses: React StrictMode double-invokes
  // this effect in dev, firing two concurrent requests. Without this, a
  // stale pre-creation response arriving after a later fetch can silently
  // revert the dashboard back to the "create your warehouse" form.
  const requestId = useRef(0);
  const loadWarehouses = useCallback((selectId) => {
    const id = ++requestId.current;
    apiRequest('/warehouse/mine').then((data) => {
      if (id !== requestId.current) return;
      setWarehouses(data);
      setSelectedId((current) => {
        if (selectId) return selectId;
        if (current && data.some((w) => w.id === current)) return current;
        return data[0]?.id ?? null;
      });
    });
  }, []);

  useEffect(() => loadWarehouses(), [loadWarehouses]);

  const warehouse = warehouses?.find((w) => w.id === selectedId) ?? null;

  const loadStats = useCallback(() => {
    if (!warehouse) return;
    Promise.all([
      apiRequest(`/warehouse/products?warehouseId=${warehouse.id}`, { auth: false }),
      apiRequest(`/warehouse/${warehouse.id}/authorizations?status=PENDING`),
      apiRequest(`/warehouse/${warehouse.id}/delivery-applications?status=PENDING`),
      apiRequest(`/warehouse/${warehouse.id}/orders?status=PACKING`),
    ]).then(([products, pending, pendingDelivery, packing]) => {
      setStats({
        productCount: products.length,
        pendingApplications: pending.length,
        pendingDeliveryApplications: pendingDelivery.length,
        packingCount: packing.length,
      });
    });
  }, [warehouse]);

  useEffect(loadStats, [loadStats]);

  function handleCreated(newId) {
    setShowAddForm(false);
    loadWarehouses(newId);
  }

  if (warehouses === undefined) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Warehouse Portal" />
        <p className="text-slate-500 text-sm p-6">Loading…</p>
      </div>
    );
  }

  // No warehouses yet, or the owner explicitly asked to add one — either way
  // it's the same "create a warehouse" form, just with a way back if they
  // already have at least one.
  if (warehouses.length === 0 || showAddForm) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Warehouse Portal" />
        <div className="p-8">
          {warehouses.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy mb-4"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          <WarehouseSetupForm onCreated={handleCreated} />
        </div>
      </div>
    );
  }

  const items = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'warehouse', label: 'My Warehouse', icon: WarehouseIcon },
    { key: 'products', label: 'Products', icon: Package, badge: stats.productCount },
    { key: 'applications', label: 'Reseller Applications', icon: Users, badge: stats.pendingApplications },
    { key: 'delivery-applications', label: 'Delivery Applications', icon: Truck, badge: stats.pendingDeliveryApplications },
    { key: 'packing', label: 'Packing Queue', icon: ClipboardList, badge: stats.packingCount },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <DashboardTopBar title="Warehouse Portal" />
      <WarehouseSelector
        warehouses={warehouses}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddNew={() => setShowAddForm(true)}
      />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-slate-100">
          {activeTab === 'overview' && <OverviewPanel warehouse={warehouse} stats={stats} />}
          {activeTab === 'warehouse' && (
            <div>
              <h2 className="font-bold text-navy text-lg mb-4">My Warehouse</h2>
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 max-w-md space-y-2 text-sm">
                <p><span className="text-slate-500">Name:</span> <span className="text-slate-900">{warehouse.name}</span></p>
                <p><span className="text-slate-500">Address:</span> <span className="text-slate-900">{warehouse.addressLine}</span></p>
                <p><span className="text-slate-500">Parish:</span> <span className="text-slate-900">{warehouse.parish}</span></p>
              </div>
              <ApprovedResellersSection warehouseId={warehouse.id} />
            </div>
          )}
          {activeTab === 'products' && <ProductsPanel warehouseId={warehouse.id} />}
          {activeTab === 'applications' && <ApplicationsPanel warehouseId={warehouse.id} onDecision={loadStats} />}
          {activeTab === 'delivery-applications' && (
            <DeliveryApplicationsPanel ownerType="warehouse" ownerId={warehouse.id} onDecision={loadStats} />
          )}
          {activeTab === 'packing' && <PackingQueuePanel warehouseId={warehouse.id} />}
        </main>
      </div>
    </div>
  );
}
