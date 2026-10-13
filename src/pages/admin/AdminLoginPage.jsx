import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import islevendorIcon from '../../assets/islevendor-icon.png';

const inputClass =
  'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary';

// The admin console's own entry point — same /auth/login call and
// AuthContext as LoginPage.jsx, but a self-contained page with no way to
// register from it: administrator accounts are only ever provisioned from
// the server (see backend-node's `npm run admin:create`).
export default function AdminLoginPage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') navigate('/admin', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await login(email, password);
      if (signedIn.role !== 'ADMIN') {
        // A valid seller/customer login is still not an admin one — don't
        // leave that session sitting in this browser tab.
        logout();
        setError('This account does not have administrator access.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 text-white text-2xl font-black tracking-tight mb-6">
          <img src={islevendorIcon} alt="" className="h-8 w-8" />
          isle<span className="text-primary">vendor</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
          <h1 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Administrator sign in
          </h1>
          <p className="text-xs text-slate-500 mb-5">Platform staff only. Everything done here is recorded.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary text-sm font-bold py-2.5 rounded-lg transition disabled:opacity-40"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
