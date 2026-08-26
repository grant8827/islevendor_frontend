import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// value = backend UserRole enum (unchanged internally); label = what the
// user sees.
const ROLES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'RESELLER', label: 'Reseller' },
  { value: 'STORE', label: 'Store' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Coming from an "Apply" button on an opportunity page (?role=RESELLER) —
  // preselect it, but only if it's a real role, not whatever's in the URL.
  const requestedRole = searchParams.get('role');
  const initialRole = ROLES.some((r) => r.value === requestedRole) ? requestedRole : 'CUSTOMER';
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phoneNumber: '', role: initialRole });
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
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={form.fullName} onChange={update('fullName')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
        <input placeholder="Phone number" value={form.phoneNumber} onChange={update('phoneNumber')} required />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={update('password')}
          required
          minLength={8}
        />
        <select value={form.role} onChange={update('role')}>
          {ROLES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
