import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Store, Warehouse as WarehouseIcon, Package, UserRound } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import StoreSetupForm from './StoreSetupForm.jsx';
import WarehousesPanel from './WarehousesPanel.jsx';
import ProductsPanel from './ProductsPanel.jsx';
import MyStorePanel from './MyStorePanel.jsx';
import ProfilePanel from '../../components/dashboard/ProfilePanel.jsx';

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
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Reseller Portal" />
        <p className="text-slate-500 text-sm p-6">Loading…</p>
      </div>
    );
  }

  if (store === null) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Reseller Portal" />
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
    { key: 'profile', label: 'Profile', icon: UserRound, bottom: true },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <DashboardTopBar title="Reseller Portal" />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-ink">
          {activeTab === 'overview' && (
            <div>
              <h2 className="font-bold text-navy text-lg mb-1">{store.storeName}</h2>
              <p className="text-xs text-slate-500 mb-6">
                <Link to={`/store/${store.slug}`} className="text-primary hover:underline">
                  View your public storefront →
                </Link>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
                  <span className="text-xs text-slate-500">Pending Warehouse Applications</span>
                  <p className="text-2xl font-bold text-secondary mt-1">{pendingCount}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'products' && <ProductsPanel store={store} />}
          {activeTab === 'store' && <MyStorePanel store={store} />}
          {activeTab === 'warehouses' && <WarehousesPanel />}
          {activeTab === 'profile' && (
            <ProfilePanel
              business={{ name: store.storeName, parish: store.parish, slug: store.slug }}
              businessType="Reseller business"
            />
          )}
        </main>
      </div>
    </div>
  );
}
