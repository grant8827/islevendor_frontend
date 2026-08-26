import { useState } from 'react';
import { Building2, KeyRound, UserRound } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ProfilePanel({ business, businessType = 'Business' }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputClass = 'mt-1 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary';

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function changePassword(event) {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const result = await apiRequest('/auth/password', {
        method: 'PATCH',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6 text-slate-900">
      <div>
        <h2 className="font-bold text-navy text-lg">Profile</h2>
        <p className="text-xs text-slate-500 mt-1">Manage your user, business, and security information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
          <h3 className="font-bold text-navy flex items-center gap-2 mb-4"><UserRound className="w-4 h-4" /> User details</h3>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs text-slate-500">Name</dt><dd className="font-semibold">{user.fullName}</dd></div>
            <div><dt className="text-xs text-slate-500">Email</dt><dd className="font-semibold break-all">{user.email}</dd></div>
            <div><dt className="text-xs text-slate-500">Phone</dt><dd className="font-semibold">{user.phoneNumber}</dd></div>
            <div><dt className="text-xs text-slate-500">Account type</dt><dd className="font-semibold">{user.role}</dd></div>
          </dl>
        </section>

        {business && (
          <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
            <h3 className="font-bold text-navy flex items-center gap-2 mb-4"><Building2 className="w-4 h-4" /> {businessType}</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-slate-500">Business name</dt><dd className="font-semibold">{business.name}</dd></div>
              {business.address && <div><dt className="text-xs text-slate-500">Address</dt><dd className="font-semibold">{business.address}</dd></div>}
              {business.parish && <div><dt className="text-xs text-slate-500">Parish</dt><dd className="font-semibold">{business.parish}</dd></div>}
              {business.slug && <div><dt className="text-xs text-slate-500">Store URL</dt><dd className="font-semibold">/store/{business.slug}</dd></div>}
            </dl>
          </section>
        )}
      </div>

      <form onSubmit={changePassword} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 max-w-lg space-y-4">
        <h3 className="font-bold text-navy flex items-center gap-2"><KeyRound className="w-4 h-4" /> Change password</h3>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        <label className="block text-xs font-semibold text-slate-600">Current password
          <input type="password" required value={form.currentPassword} onChange={update('currentPassword')} className={inputClass} />
        </label>
        <label className="block text-xs font-semibold text-slate-600">New password
          <input type="password" required minLength={8} value={form.newPassword} onChange={update('newPassword')} className={inputClass} />
        </label>
        <label className="block text-xs font-semibold text-slate-600">Confirm new password
          <input type="password" required minLength={8} value={form.confirmPassword} onChange={update('confirmPassword')} className={inputClass} />
        </label>
        <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
