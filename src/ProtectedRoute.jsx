import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// `redirectTo` lets an isolated sub-app (IsleDash) send a logged-out visitor
// to its own login screen instead of the marketplace's — defaults to the
// marketplace login for every other protected route. Carries the page the
// visitor was actually headed to as location state, so a login page can
// send them back there instead of always landing on its own default (see
// IsleDashLoginPage.jsx — needed so a logged-out driver scanning a shipping
// label's QR code, see ScanPickupPage.jsx, ends up back on that scan page
// after signing in rather than the generic Delivery tab).
export default function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to={redirectTo} replace state={{ from: location }} />;
  return children;
}
