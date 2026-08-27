import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Building2, Package, ClipboardList, Truck, UserRound, ListOrdered, MessageSquare, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import DeliveryApplicationsPanel from '../../components/dashboard/DeliveryApplicationsPanel.jsx';
import OrdersPanel from '../../components/dashboard/OrdersPanel.jsx';
import FeedbackPanel from '../../components/dashboard/FeedbackPanel.jsx';
import ShopSelector from './ShopSelector.jsx';
import ShopSetupForm from './ShopSetupForm.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import ProductsPanel from './ProductsPanel.jsx';
import PackingQueuePanel from './PackingQueuePanel.jsx';
import ProfilePanel from '../../components/dashboard/ProfilePanel.jsx';

export default function ShopDashboard() {
  const [shops, setShops] = useState(undefined); // undefined = loading, [] = none yet
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ productCount: 0, pendingDeliveryApplications: 0, packingCount: 0 });

  // Guards against out-of-order responses: React StrictMode double-invokes
  // this effect in dev, firing two concurrent requests. Without this, a
  // stale pre-creation response arriving after a later fetch can silently
  // revert the dashboard back to the "create your store" form.
  const requestId = useRef(0);
  const loadShops = useCallback((selectId) => {
    const id = ++requestId.current;
    apiRequest('/shop/mine').then((data) => {
      if (id !== requestId.current) return;
      setShops(data);
      setSelectedId((current) => {
        if (selectId) return selectId;
        if (current && data.some((s) => s.id === current)) return current;
        return data[0]?.id ?? null;
      });
    });
  }, []);

  useEffect(() => loadShops(), [loadShops]);

  const shop = shops?.find((s) => s.id === selectedId) ?? null;

  const loadStats = useCallback(() => {
    if (!shop) return;
    Promise.all([
      apiRequest(`/shop/products?shopId=${shop.id}`, { auth: false }),
      apiRequest(`/shop/${shop.id}/delivery-applications?status=PENDING`),
      apiRequest(`/shop/${shop.id}/orders?status=PACKING`),
    ]).then(([products, pendingDelivery, packing]) => {
      setStats({ productCount: products.length, pendingDeliveryApplications: pendingDelivery.length, packingCount: packing.length });
    });
  }, [shop]);

  useEffect(loadStats, [loadStats]);

  function handleCreated(newId) {
    setShowAddForm(false);
    loadShops(newId);
  }

  if (shops === undefined) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Store Portal" />
        <p className="text-slate-500 text-sm p-6">Loading…</p>
      </div>
    );
  }

  // No stores yet, or the owner explicitly asked to add one — either way
  // it's the same "create a store" form, just with a way back if they
  // already have at least one.
  if (shops.length === 0 || showAddForm) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Store Portal" />
        <div className="p-8">
          {shops.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy mb-4"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
          <ShopSetupForm onCreated={handleCreated} />
        </div>
      </div>
    );
  }

  const items = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'store', label: 'My Store', icon: Building2 },
    { key: 'products', label: 'Products', icon: Package, badge: stats.productCount },
    { key: 'orders', label: 'Orders', icon: ListOrdered },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare },
    { key: 'delivery-applications', label: 'Delivery Applications', icon: Truck, badge: stats.pendingDeliveryApplications },
    { key: 'packing', label: 'Packing Queue', icon: ClipboardList, badge: stats.packingCount },
    { key: 'profile', label: 'Profile', icon: UserRound, bottom: true },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <DashboardTopBar title="Store Portal" />
      <ShopSelector shops={shops} selectedId={selectedId} onSelect={setSelectedId} onAddNew={() => setShowAddForm(true)} />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-ink">
          {activeTab === 'overview' && <OverviewPanel shop={shop} stats={stats} />}
          {activeTab === 'store' && (
            <div>
              <h2 className="font-bold text-navy text-lg mb-4">My Store</h2>
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 max-w-md space-y-2 text-sm">
                <p><span className="text-slate-500">Name:</span> <span className="text-slate-900">{shop.shopName}</span></p>
                <p><span className="text-slate-500">Address:</span> <span className="text-slate-900">{shop.addressLine}</span></p>
                <p><span className="text-slate-500">Parish:</span> <span className="text-slate-900">{shop.parish}</span></p>
                <p><span className="text-slate-500">URL:</span> <span className="text-slate-900">/store/{shop.slug}</span></p>
              </div>
              <div className="mt-8">
                <h3 className="font-bold text-navy text-base mb-4">Items sold by {shop.shopName}</h3>
                <ProductsPanel shopId={shop.id} />
              </div>
            </div>
          )}
          {activeTab === 'products' && <ProductsPanel shopId={shop.id} />}
          {activeTab === 'orders' && <OrdersPanel endpoint={`/shop/${shop.id}/orders`} />}
          {activeTab === 'feedback' && <FeedbackPanel endpoint={`/shop/${shop.id}/feedback`} />}
          {activeTab === 'delivery-applications' && (
            <DeliveryApplicationsPanel ownerType="shop" ownerId={shop.id} onDecision={loadStats} />
          )}
          {activeTab === 'packing' && <PackingQueuePanel shopId={shop.id} />}
          {activeTab === 'profile' && (
            <ProfilePanel
              business={{ name: shop.shopName, address: shop.addressLine, parish: shop.parish, slug: shop.slug }}
              businessType="Store details"
            />
          )}
        </main>
      </div>
    </div>
  );
}
