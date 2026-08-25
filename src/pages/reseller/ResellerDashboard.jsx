import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Store, Warehouse as WarehouseIcon, Package } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import StoreSetupForm from './StoreSetupForm.jsx';
import WarehousesPanel from './WarehousesPanel.jsx';
import ProductsPanel from './ProductsPanel.jsx';
import MyStorePanel from './MyStorePanel.jsx';

export default function ResellerDashboard() {
  const [store, setStore] = useState(undefined); // undefined = loading, null = none yet
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  // Guards against out-of-order responses: React StrictMode double-invokes
  // this effect in dev, firing two concurrent requests. Without this, a
  // stale pre-creation "null" response arriving after a later fetch can
  // silently revert the dashboard back to the "create your store" form.
  const requestId = useRef(0);
  const loadStore = useCallback(() => {
    const id = ++requestId.current;
    apiRequest('/commerce/stores/mine').then((data) => {
      if (id === requestId.current) setStore(data);
    });
  }, []);

  useEffect(loadStore, [loadStore]);

  useEffect(() => {
    if (!store) return;
    apiRequest('/authorizations/mine').then((apps) => {
      setPendingCount(apps.filter((a) => a.status === 'PENDING').length);
    });
  }, [store]);

  if (store === undefined) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardTopBar title="Affiliate Portal" />
        <p className="text-slate-400 text-sm p-6">Loading…</p>
      </div>
    );
  }

  if (store === null) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardTopBar title="Affiliate Portal" />
        <div className="p-8">
          <StoreSetupForm onCreated={loadStore} />
        </div>
      </div>
    );
  }

  const items = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'store', label: 'My Store', icon: Store },
    { key: 'warehouses', label: 'Applications', icon: WarehouseIcon, badge: pendingCount },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <DashboardTopBar title="Affiliate Portal" />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-slate-100">
          {activeTab === 'overview' && (
            <div>
              <h2 className="font-bold text-white text-lg mb-1">{store.storeName}</h2>
              <p className="text-xs text-slate-400 mb-6">
                <Link to={`/store/${store.slug}`} className="text-amazon-yellow hover:underline">
                  View your public storefront →
                </Link>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400">Pending Warehouse Applications</span>
                  <p className="text-2xl font-bold text-amazon-orange mt-1">{pendingCount}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'products' && <ProductsPanel store={store} />}
          {activeTab === 'store' && <MyStorePanel store={store} />}
          {activeTab === 'warehouses' && <WarehousesPanel />}
        </main>
      </div>
    </div>
  );
}
