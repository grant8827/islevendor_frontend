import { useEffect, useState } from 'react';
import { Banknote, Truck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { inputClass } from './adminFormat.js';

const money = (n) => `J$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Platform-wide settings. For now, IsleDash delivery pricing: what the first
// item from a seller costs to deliver, and what % of that each further item
// from the same seller in one checkout costs. Sellers set the same rule for
// their own delivery on their Shipping tab.
// How long withdrawals take to reach people's banks — the promise every
// Payouts tab shows, and the due date on each request in the admin queue.
function PayoutTimingCard() {
  const { notify } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/admin/settings/payouts')
      .then((t) => setForm({ minBusinessDays: String(t.minBusinessDays), maxBusinessDays: String(t.maxBusinessDays) }))
      .catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/admin/settings/payouts', {
        method: 'PUT',
        body: { minBusinessDays: Number(form.minBusinessDays), maxBusinessDays: Number(form.maxBusinessDays) },
      });
      notify('Payout time saved. It applies to withdrawals requested from now on.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null;
  return (
    <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 text-sm mt-6">
      <div>
        <h3 className="font-bold text-navy flex items-center gap-2">
          <Banknote className="w-4 h-4" /> Payout time
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          How long a withdrawal takes to reach someone's bank, in business days. Sellers and drivers see this before they withdraw, and each request is due by the longer end.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-slate-600">
          At the soonest
          <input type="number" min="0" max="30" required className={`${inputClass} w-full mt-1`} value={form.minBusinessDays} onChange={(e) => setForm((f) => ({ ...f, minBusinessDays: e.target.value }))} />
        </label>
        <label className="block text-xs text-slate-600">
          At the latest
          <input type="number" min="1" max="30" required className={`${inputClass} w-full mt-1`} value={form.maxBusinessDays} onChange={(e) => setForm((f) => ({ ...f, maxBusinessDays: e.target.value }))} />
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

export default function SettingsPanel() {
  const { notify } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/admin/settings/isledash')
      .then((rate) => setForm({ baseFeeJmd: String(Number(rate.baseFeeJmd)), extraItemPercent: String(rate.extraItemPercent) }))
      .catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/admin/settings/isledash', {
        method: 'PUT',
        body: { baseFeeJmd: Number(form.baseFeeJmd), extraItemPercent: Number(form.extraItemPercent) },
      });
      notify('IsleDash pricing saved. It applies to checkouts from now on.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const base = Number(form?.baseFeeJmd) || 0;
  const extra = Math.round(base * (Number(form?.extraItemPercent) || 0)) / 100;

  return (
    <div className="max-w-xl">
      <h2 className="font-bold text-navy text-lg mb-4">Settings</h2>

      {!form && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {form && (
        <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 text-sm">
          <div>
            <h3 className="font-bold text-navy flex items-center gap-2">
              <Truck className="w-4 h-4" /> IsleDash delivery pricing
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              What customers pay when they choose IsleDash. When they buy several items from one seller in the same checkout, the first item pays the full fee and each extra item pays the percentage below. Orders already placed keep what they were charged.
            </p>
          </div>
          <label className="block text-xs text-slate-600">
            Fee for the first item (J$)
            <input type="number" min="0" step="1" required className={`${inputClass} w-full mt-1`} value={form.baseFeeJmd} onChange={(e) => setForm((f) => ({ ...f, baseFeeJmd: e.target.value }))} />
          </label>
          <label className="block text-xs text-slate-600">
            Each extra item costs (% of the fee)
            <input type="number" min="0" max="100" step="1" required className={`${inputClass} w-full mt-1`} value={form.extraItemPercent} onChange={(e) => setForm((f) => ({ ...f, extraItemPercent: e.target.value }))} />
          </label>
          <p className="text-xs text-slate-600 bg-surface rounded-md px-3 py-2">
            {money(base)} for the first item, {money(extra)} for each extra — 3 items from one seller: {money(base + extra * 2)}
          </p>
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={saving} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
      {!form && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <PayoutTimingCard />
    </div>
  );
}
