import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Businesses don't sign up here: each has its own application, reviewed by
// IsleVendor before it can sell or deliver (the backend's /auth/register
// accepts customers only).
const BUSINESS_SIGNUPS = [
  { to: '/join/warehouse', label: 'Register a warehouse' },
  { to: '/join/reseller', label: 'Become a reseller' },
  { to: '/join/vendor', label: 'Open a store' },
  { to: '/join/driver', label: 'Drive with IsleDash' },
];

// Customer sign-up: the "Sign up" link beside "Log in" on every page.
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phoneNumber: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ ...form, role: 'CUSTOMER' });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Create your account</h2>
      <p className="text-sm text-slate-500 mb-4">Shop from stores and resellers across Jamaica.</p>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" autoComplete="name" value={form.fullName} onChange={update('fullName')} required />
        <input type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={update('email')} required />
        <input placeholder="Phone number" autoComplete="tel" value={form.phoneNumber} onChange={update('phoneNumber')} required />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          required
          minLength={8}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>

      <p className="text-sm text-slate-600 mt-4">
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-sm font-bold text-slate-700 mb-2">Signing up a business?</p>
        <ul className="space-y-1 text-sm">
          {BUSINESS_SIGNUPS.map(({ to, label }) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
