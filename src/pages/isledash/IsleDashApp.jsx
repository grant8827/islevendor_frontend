import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import DriverDashboard from '../driver/DriverDashboard.jsx';

// Mounted at the protected /isledash route (see App.jsx). A logged-in
// non-driver landing here (e.g. typed the URL, or signed in with a
// warehouse/store account) gets turned away rather than shown the driver
// dashboard, which assumes a driver's shape of account.
export default function IsleDashApp() {
  const { user } = useAuth();

  if (user.role !== 'DRIVER') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-bold text-navy text-lg mb-2">IsleDash is for delivery drivers</h1>
          <p className="text-sm text-slate-500 mb-4">
            This account ({user.role.toLowerCase()}) doesn't have delivery access.
          </p>
          <Link to="/dashboard" className="text-primary hover:underline text-sm font-bold">
            Go to your dashboard instead
          </Link>
        </div>
      </div>
    );
  }

  return <DriverDashboard />;
}
