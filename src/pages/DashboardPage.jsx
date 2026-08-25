import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardTopBar from '../components/dashboard/DashboardTopBar.jsx';
import WarehouseDashboard from './warehouse/WarehouseDashboard.jsx';
import ResellerDashboard from './reseller/ResellerDashboard.jsx';
import ShopDashboard from './shop/ShopDashboard.jsx';

// Driver job feed and admin ledger view are still generic placeholders below —
// warehouse, affiliate (RESELLER), and store are the three seller roles built
// out so far.
export default function DashboardPage() {
  const { user } = useAuth();

  // A customer has no seller portal — "dashboard" for them just means the
  // marketplace they already shop on. Their actual account/orders live at
  // /account (see Navbar's "Account & Orders" link).
  if (user.role === 'CUSTOMER') return <Navigate to="/" replace />;
  if (user.role === 'WAREHOUSE') return <WarehouseDashboard />;
  if (user.role === 'RESELLER') return <ResellerDashboard />;
  if (user.role === 'STORE') return <ShopDashboard />;

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardTopBar />
      <div className="p-8 text-slate-100">
        <h2 className="font-bold text-lg mb-1">Dashboard</h2>
        <p className="text-sm text-slate-400">
          Signed in as <strong className="text-white">{user.fullName}</strong> ({user.role})
        </p>
      </div>
    </div>
  );
}
