import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { inputClass } from './adminFormat.js';

const money = (n) => `J$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Platform-wide settings. For now, IsleDash delivery pricing: what the first
// item from a seller costs to deliver, and what % of that each further item
// from the same seller in one checkout costs. Sellers set the same rule for
// their own delivery on their Shipping tab.
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
    </div>
  );
}
