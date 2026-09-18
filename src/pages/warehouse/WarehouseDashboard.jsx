import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Warehouse as WarehouseIcon, Package, Briefcase, ClipboardList, UserRound, UsersRound, ListOrdered, MessageSquare, Wallet, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import OrdersPanel from '../../components/dashboard/OrdersPanel.jsx';
import FeedbackPanel from '../../components/dashboard/FeedbackPanel.jsx';
import PayoutsPanel from '../../components/dashboard/PayoutsPanel.jsx';
import DeliveryNotificationListener from '../../components/dashboard/DeliveryNotificationListener.jsx';
import WarehouseSelector from './WarehouseSelector.jsx';
import WarehouseSetupForm from './WarehouseSetupForm.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import ProductsPanel from './ProductsPanel.jsx';
import ApplicationsPage from './ApplicationsPage.jsx';
import PackingQueuePanel from './PackingQueuePanel.jsx';
import ApprovedResellersSection from './ApprovedResellersSection.jsx';
import ResellerCommissionCard from './ResellerCommissionCard.jsx';
import StaffPanel from './StaffPanel.jsx';
import DashboardLoadError from '../../components/dashboard/DashboardLoadError.jsx';
import ProfilePanel from '../../components/dashboard/ProfilePanel.jsx';

export default function WarehouseDashboard() {
  const { user } = useAuth();
  // A login a warehouse admin created via the Staff tab — it only ever works
  // inside warehouses it was added to, and can't register its own.
  const isStaffAccount = Boolean(user?.staffOfUserId);
  const [warehouses, setWarehouses] = useState(undefined); // undefined = loading, [] = none yet
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ productCount: 0, pendingApplications: 0, pendingDeliveryApplications: 0, packingCount: 0 });

  // Guards against out-of-order responses: React StrictMode double-invokes
  // this effect in dev, firing two concurrent requests. Without this, a
  // stale pre-creation response arriving after a later fetch can silently
  // revert the dashboard back to the "create your warehouse" form.
  const requestId = useRef(0);
  const loadWarehouses = useCallback((selectId) => {
    const id = ++requestId.current;
    apiRequest('/warehouse/mine')
      .then((data) => {
        if (id !== requestId.current) return;
        setLoadError(null);
        setWarehouses(data);
        setSelectedId((current) => {
          if (selectId) return selectId;
          if (current && data.some((w) => w.id === current)) return current;
          return data[0]?.id ?? null;
        });
      })
      .catch((err) => {
        if (id === requestId.current) setLoadError(err.message);
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

  if (warehouses === undefined && loadError) {
    return (
      <DashboardLoadError
        title="Warehouse Portal"
        message={loadError}
        onRetry={() => {
          setLoadError(null);
          loadWarehouses();
        }}
      />
    );
  }

  if (warehouses === undefined) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Warehouse Portal" />
        <p className="text-slate-500 text-sm p-6">Loading…</p>
      </div>
    );
  }

  // A staff login that hasn't been added to a warehouse (or was removed from
  // its last one) has nothing to operate and mustn't be offered the
  // "create your warehouse" form.
  if (warehouses.length === 0 && isStaffAccount) {
    return (
      <div className="min-h-screen bg-surface">
        <DashboardTopBar title="Warehouse Portal" />
        <div className="p-8 max-w-md">
          <h2 className="font-bold text-navy text-lg mb-2">No warehouse access yet</h2>
          <p className="text-sm text-slate-500">
            Your account hasn't been added to a warehouse. Ask your warehouse admin to add you from their Staff tab.
          </p>
        </div>
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

  // What this login may see in *this* warehouse (it can differ per warehouse
  // — staff at one, admin at another). The API enforces the same limits; this
  // just hides what they couldn't use. See lib/warehouseAccess.ts.
  //  - STAFF: products, orders, feedback, applications, packing queue.
  //  - ADMIN: everything, plus Staff — but not Payouts (those are the owner's).
  //  - OWNER: everything.
  const accessRole = warehouse.accessRole ?? 'OWNER';
  const isStaff = accessRole === 'STAFF';
  const isOwner = accessRole === 'OWNER';

  const items = isStaff
    ? [
        { key: 'products', label: 'Products', icon: Package, badge: stats.productCount },
        { key: 'orders', label: 'Orders', icon: ListOrdered },
        { key: 'feedback', label: 'Feedback', icon: MessageSquare },
        { key: 'applications', label: 'Applications', icon: Briefcase, badge: stats.pendingApplications + stats.pendingDeliveryApplications },
        { key: 'packing', label: 'Packing Queue', icon: ClipboardList, badge: stats.packingCount },
      ]
    : [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard },
        { key: 'warehouse', label: 'My Warehouse', icon: WarehouseIcon },
        { key: 'products', label: 'Products', icon: Package, badge: stats.productCount },
        { key: 'orders', label: 'Orders', icon: ListOrdered },
        ...(isOwner ? [{ key: 'payouts', label: 'Payouts', icon: Wallet }] : []),
        { key: 'feedback', label: 'Feedback', icon: MessageSquare },
        { key: 'applications', label: 'Applications', icon: Briefcase, badge: stats.pendingApplications + stats.pendingDeliveryApplications },
        { key: 'packing', label: 'Packing Queue', icon: ClipboardList, badge: stats.packingCount },
        { key: 'profile', label: 'Profile', icon: UserRound, bottom: true },
        { key: 'staff', label: 'Staff', icon: UsersRound, bottom: true },
      ];

  // The remembered tab may not exist for this warehouse (switched from one
  // where this login was an admin to one where they're staff, say).
  const tab = items.some((item) => item.key === activeTab) ? activeTab : items[0].key;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <DeliveryNotificationListener kind="warehouse" id={warehouse.id} />
      <DashboardTopBar title="Warehouse Portal" />
      <WarehouseSelector
        warehouses={warehouses}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddNew={() => setShowAddForm(true)}
        canAdd={!isStaffAccount}
      />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={tab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-ink">
          {tab === 'overview' && <OverviewPanel warehouse={warehouse} stats={stats} />}
          {tab === 'warehouse' && (
            <div>
              <h2 className="font-bold text-navy text-lg mb-4">My Warehouse</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-2 text-sm">
                  <p><span className="text-slate-500">Name:</span> <span className="text-slate-900">{warehouse.name}</span></p>
                  <p><span className="text-slate-500">Address:</span> <span className="text-slate-900">{warehouse.addressLine}</span></p>
                  <p><span className="text-slate-500">Parish:</span> <span className="text-slate-900">{warehouse.parish}</span></p>
                </div>
                <ResellerCommissionCard warehouse={warehouse} onSaved={() => loadWarehouses(warehouse.id)} />
              </div>
              <ApprovedResellersSection warehouseId={warehouse.id} />
              <div className="mt-8">
                <h3 className="font-bold text-navy text-base mb-4">Products in {warehouse.name}</h3>
                <ProductsPanel warehouseId={warehouse.id} warehouses={warehouses} />
              </div>
            </div>
          )}
          {tab === 'products' && <ProductsPanel warehouseId={warehouse.id} warehouses={warehouses} />}
          {tab === 'orders' && (
            <OrdersPanel
              endpoint={`/warehouse/${warehouse.id}/orders`}
              showSeller
              refundEndpoint={isStaff ? undefined : (orderId) => `/warehouse/${warehouse.id}/orders/${orderId}/refund`}
            />
          )}
          {tab === 'payouts' && <PayoutsPanel />}
          {tab === 'feedback' && <FeedbackPanel endpoint={`/warehouse/${warehouse.id}/feedback`} showSeller />}
          {tab === 'applications' && (
            <ApplicationsPage
              warehouse={warehouse}
              pendingApplicants={stats.pendingApplications}
              pendingDrivers={stats.pendingDeliveryApplications}
              onDecision={loadStats}
              onWarehouseUpdated={() => loadWarehouses(warehouse.id)}
              canEditCommission={!isStaff}
            />
          )}
          {tab === 'packing' && <PackingQueuePanel warehouseId={warehouse.id} warehouse={warehouse} />}
          {tab === 'profile' && (
            <ProfilePanel
              business={{ name: warehouse.name, address: warehouse.addressLine, parish: warehouse.parish }}
              businessType="Warehouse business"
            />
          )}
          {tab === 'staff' && (
            <StaffPanel
              warehouse={warehouse}
              ownedWarehouses={isOwner ? warehouses.filter((w) => w.accessRole === 'OWNER') : []}
            />
          )}
        </main>
      </div>
    </div>
  );
}
