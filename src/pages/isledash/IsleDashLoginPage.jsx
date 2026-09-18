import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import isleDashLogo from '../../assets/isledash-logo.png';

const inputClass =
  'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary';

// IsleDash's own entry point — deliberately not the marketplace's Layout/
// Navbar (no shopping nav, no cart, no links back into the marketplace),
// since a driver using this app shouldn't see any of that. Mirrors
// LoginPage.jsx's logic (same /auth/login call, same AuthContext) but as a
// self-contained, IsleDash-branded page — see IsleDashApp.jsx for what
// happens after a successful login.
export default function IsleDashLoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Set by ProtectedRoute when it bounced a logged-out visitor here — e.g. a
  // driver scanning a shipping label's QR code (see ScanPickupPage.jsx)
  // lands back on that scan page after signing in, not just the default
  // Delivery tab.
  const from = location.state?.from?.pathname ?? '/isledash';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in (e.g. a driver hit this URL directly with a live
  // session) — skip straight past the form.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl p-3 flex justify-center mb-6">
          <img src={isleDashLogo} alt="IsleDash" className="h-20 w-auto" />
        </div>

        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
          <h1 className="font-bold text-navy text-lg mb-1">Driver sign in</h1>
          <p className="text-xs text-slate-500 mb-5">Sign in to go online and accept deliveries.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary text-sm font-bold py-2.5 rounded-lg transition disabled:opacity-40"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Not a driver yet?{' '}
          <Link to="/opportunities/driver" className="text-primary hover:underline">
            Apply to deliver
          </Link>
        </p>
      </div>
    </div>
  );
}
