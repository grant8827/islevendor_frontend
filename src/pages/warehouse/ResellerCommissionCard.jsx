import { useState } from 'react';
import { Percent } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

// What resellers earn — as a % of this warehouse's own (post-discount)
// wholesale price, added on top alongside the platform's flat 5% to form
// the customer's price (see backend-node/src/lib/pricing.ts). This is the
// warehouse's own call; it isn't the reseller's to set.
//
// TODO: this is meant to grow into the fuller "what we're looking for in a
// reseller" posting on the reseller-application page — for now it's just
// this one number.
export default function ResellerCommissionCard({ warehouse, onSaved }) {
  const [value, setValue] = useState(String(warehouse.resellerCommissionPercent));
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest(`/warehouse/${warehouse.id}`, { method: 'PATCH', body: { resellerCommissionPercent: Number(value) } });
      notify('Reseller commission updated.');
      onSaved?.();
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 max-w-md mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Percent className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-navy text-sm">Reseller Commission</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        What resellers earn on every sale, as a % of your wholesale price — added on top, alongside the platform's
        flat 5%, to form the customer's price. Your own payout is always your full wholesale price.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
        />
        <span className="text-sm text-slate-500">%</span>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 text-xs px-4 py-2 ml-auto">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
