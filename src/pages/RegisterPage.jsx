import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AddressFields from '../components/AddressFields.jsx';
import { EMPTY_ADDRESS, addressPayload } from '../lib/address.js';

// Customer sign-up: the "Sign up" link beside "Log in" on every page.
// Businesses apply through their own pages (/join/*) instead; the backend's
// /auth/register accepts customers only. The delivery address is saved to
// the account and filled in at checkout.
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '', phoneNumber: '' });
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('The passwords don’t match.');
      return;
    }
    setSubmitting(true);
    try {
      const { confirmPassword: _confirm, ...details } = form;
      await register({ ...details, role: 'CUSTOMER', address: addressPayload(address) });
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
        <h3 className="text-sm font-bold text-slate-700">Your details</h3>
        <input placeholder="Full name" autoComplete="name" value={form.fullName} onChange={update('fullName')} required />
        <input type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={update('email')} required />
        <input
          type="tel"
          placeholder="Phone number (e.g. 876 555 0123)"
          autoComplete="tel"
          value={form.phoneNumber}
          onChange={update('phoneNumber')}
          required
          minLength={7}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          required
          minLength={8}
        />
        <input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          required
          minLength={8}
        />

        <h3 className="text-sm font-bold text-slate-700 mt-3">Delivery address</h3>
        <p className="text-xs text-slate-500 -mt-1">Where we bring your orders. You can change it any time on My Account.</p>
        <AddressFields value={address} onChange={setAddress} />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>

      <p className="text-sm text-slate-600 mt-4">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
