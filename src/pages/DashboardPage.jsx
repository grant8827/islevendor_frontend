import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardTopBar from '../components/dashboard/DashboardTopBar.jsx';
import WarehouseDashboard from './warehouse/WarehouseDashboard.jsx';
import ResellerDashboard from './reseller/ResellerDashboard.jsx';
import ShopDashboard from './shop/ShopDashboard.jsx';
import DriverDashboard from './driver/DriverDashboard.jsx';

// Admin ledger view is still a generic placeholder below — warehouse,
// reseller (RESELLER), store, and driver are the four roles built out so far.
export default function DashboardPage() {
  const { user } = useAuth();

  // A customer has no seller portal — "dashboard" for them just means the
  // marketplace they already shop on. Their actual account/orders live at
  // /account (see Navbar's "Account & Orders" link).
  if (user.role === 'CUSTOMER') return <Navigate to="/" replace />;
  if (user.role === 'WAREHOUSE') return <WarehouseDashboard />;
  if (user.role === 'RESELLER') return <ResellerDashboard />;
  if (user.role === 'STORE') return <ShopDashboard />;
  if (user.role === 'DRIVER') return <DriverDashboard />;

  return (
    <div className="min-h-screen bg-surface">
      <DashboardTopBar />
      <div className="p-8 text-ink">
        <h2 className="font-bold text-navy text-lg mb-1">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Signed in as <strong className="text-slate-900">{user.fullName}</strong> ({user.role})
        </p>
      </div>
    </div>
  );
}
