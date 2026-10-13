import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import WarehouseDashboard from './warehouse/WarehouseDashboard.jsx';
import ResellerDashboard from './reseller/ResellerDashboard.jsx';
import ShopDashboard from './shop/ShopDashboard.jsx';

// Sends each role to its own portal.
export default function DashboardPage() {
  const { user } = useAuth();

  // A customer has no seller portal — "dashboard" for them just means the
  // marketplace they already shop on. Their actual account/orders live at
  // /account (see Navbar's "Account & Orders" link).
  if (user.role === 'CUSTOMER') return <Navigate to="/" replace />;
  if (user.role === 'WAREHOUSE') return <WarehouseDashboard />;
  if (user.role === 'RESELLER') return <ResellerDashboard />;
  if (user.role === 'STORE') return <ShopDashboard />;
  // A driver's dashboard lives in its own isolated app shell now (IsleDash,
  // no marketplace chrome) — see App.jsx's /isledash route and
  // pages/isledash/IsleDashApp.jsx.
  if (user.role === 'DRIVER') return <Navigate to="/isledash" replace />;

  // Platform staff work in the admin console (see pages/admin/AdminApp.jsx).
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/" replace />;
}
