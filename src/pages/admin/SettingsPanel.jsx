import { useEffect, useState } from 'react';
import { Banknote, Calculator, Truck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { inputClass } from './adminFormat.js';
import { beyondLimit, chargesByWeight, distanceFee, extraItemFee, money, overWeightLimit, roadMiles, weightFee } from '../../lib/isleDashPricing.js';

// Platform-wide settings, one tab per area. More tabs will join Shipping and
// Payouts; add them to TABS.
const TABS = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payouts', label: 'Payouts' },
];

// ── Shipping ────────────────────────────────────────────────────────────────

// IsleDash delivery pricing for every seller that offers it (backend:
// lib/isleDashPricing.ts). Distance runs from the seller's map pin to the
// buyer's; with no pin on either side the fallback fee applies.
const PRICING_FIELDS = [
  { key: 'baseFeeJmd', label: 'Base fee (J$)', hint: 'Charged on every IsleDash delivery.', step: '1', required: true },
  { key: 'includedMiles', label: 'Miles included in the base fee', hint: 'No per-mile charge until a delivery goes further than this.', step: '0.1', required: true },
  { key: 'perMileJmd', label: 'Price per mile (J$)', hint: 'For each mile after the included miles. 0 = a flat fee.', step: '1', required: true },
  { key: 'minFeeJmd', label: 'Minimum fee (J$)', hint: 'A delivery never costs less than this.', step: '1', required: true },
  { key: 'maxFeeJmd', label: 'Maximum fee (J$)', hint: 'Optional cap for long trips. Leave blank for no cap.', step: '1', required: false },
  { key: 'maxMiles', label: 'Furthest delivery (miles)', hint: "Optional. Further than this, IsleDash isn't offered. Blank = no limit.", step: '0.1', required: false },
  { key: 'extraItemPercent', label: 'Each extra item costs (% of the fee)', hint: 'For further items from the same seller in one checkout. 50 = half price. Not used once a price per pound is set.', step: '1', max: '100', required: true },
  { key: 'fallbackFeeJmd', label: 'Fallback fee (J$)', hint: "Charged when the buyer or the seller hasn't placed a map pin, so distance can't be measured.", step: '1', required: true },
  { key: 'roadAdjustPercent', label: 'Road distance adjustment (%)', hint: "Added to the straight-line distance, since roads don't run straight. 30 = 10 mi on the map is priced as 13.", step: '1', max: '200', required: true },
];

// Weight: everything one seller sends in a delivery is weighed together,
// from the weight sellers enter on each product (none = 0 lb).
const WEIGHT_FIELDS = [
  { key: 'includedWeightLb', label: 'Weight included (lb)', hint: 'No weight charge until a delivery weighs more than this.', step: '0.1', required: true },
  { key: 'perPoundJmd', label: 'Price per extra pound (J$)', hint: 'Added for each pound over the included weight. 0 = weight not charged. When set, it replaces the extra-item charge.', step: '1', required: true },
  { key: 'maxWeightLb', label: 'Heaviest delivery (lb)', hint: "Optional. Heavier than this, IsleDash isn't offered. Blank = no limit.", step: '0.1', required: false },
];

const ALL_FIELDS = [...PRICING_FIELDS, ...WEIGHT_FIELDS];
const toForm = (p) => Object.fromEntries(ALL_FIELDS.map(({ key }) => [key, p[key] === null || p[key] === undefined ? '' : String(Number(p[key]))]));
const toBody = (form) => Object.fromEntries(ALL_FIELDS.map(({ key, required }) => [key, !required && form[key] === '' ? null : Number(form[key])]));

function FieldGrid({ fields, form, setForm }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
      {fields.map(({ key, label, hint, step, max, required }) => (
        <label key={key} className="block text-xs text-slate-600">
          {label}
          {!required && <span className="text-slate-400"> (optional)</span>}
          <input
            type="number"
            min="0"
            max={max}
            step={step}
            required={required}
            className={`${inputClass} w-full mt-1`}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
          <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>
        </label>
      ))}
    </div>
  );
}

function PricePreview({ pricing }) {
  const [mapMiles, setMapMiles] = useState('10');
  const [pounds, setPounds] = useState('5');
  const miles = roadMiles(pricing, Number(mapMiles) || 0);
  const weight = Number(pounds) || 0;
  const forWeight = weightFee(pricing, weight);
  const fee = distanceFee(pricing, miles) + forWeight;
  const byWeight = chargesByWeight(pricing);
  const extra = byWeight ? 0 : extraItemFee(pricing, fee);

  return (
    <div className="bg-surface rounded-lg p-3 space-y-2">
      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Calculator className="w-3.5 h-3.5" /> Try it
      </p>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        A buyer
        <input type="number" min="0" step="0.1" className={`${inputClass} w-20 py-1`} value={mapMiles} onChange={(e) => setMapMiles(e.target.value)} />
        miles away on the map, ordering
        <input type="number" min="0" step="0.1" className={`${inputClass} w-20 py-1`} value={pounds} onChange={(e) => setPounds(e.target.value)} />
        lb in all
      </label>
      {beyondLimit(pricing, miles) ? (
        <p className="text-xs text-red-700">
          Priced as {miles} road miles — further than the {pricing.maxMiles} mi limit, so IsleDash isn't offered.
        </p>
      ) : overWeightLimit(pricing, weight) ? (
        <p className="text-xs text-red-700">Heavier than the {pricing.maxWeightLb} lb limit, so IsleDash isn't offered.</p>
      ) : (
        <div className="text-xs text-slate-700">
          <p className="mb-1 text-slate-500">
            Priced as {miles} road miles{forWeight > 0 && <>, plus {money(forWeight)} for weight</>}.
          </p>
          {byWeight ? (
            <p>
              Delivery: <strong>{money(fee)}</strong> however many items that is.
            </p>
          ) : (
            <ul className="space-y-0.5">
              <li>1 item: <strong>{money(fee)}</strong></li>
              <li>2 items: <strong>{money(fee + extra)}</strong></li>
              <li>3 items: <strong>{money(fee + extra * 2)}</strong></li>
            </ul>
          )}
        </div>
      )}
      <p className="text-[11px] text-slate-500">No map pin on either side: {money(pricing.fallbackFeeJmd || 0)} for the first item.</p>
    </div>
  );
}

function ShippingTab() {
  const { notify } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/admin/settings/isledash')
      .then((p) => setForm(toForm(p)))
      .catch((err) => setError(err.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = await apiRequest('/admin/settings/isledash', { method: 'PUT', body: toBody(form) });
      setForm(toForm(saved));
      notify('IsleDash pricing saved. It applies to checkouts from now on.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return error ? <p className="text-sm text-red-600" role="alert">{error}</p> : <p className="text-sm text-slate-500">Loading…</p>;
  return (
    <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 text-sm">
      <div>
        <h3 className="font-bold text-navy flex items-center gap-2">
          <Truck className="w-4 h-4" /> IsleDash delivery pricing
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          What customers pay when they choose IsleDash, for every seller that offers it. It's measured from the store or warehouse's map pin to the buyer's. The fee goes to the driver. Orders already placed keep what they were charged.
        </p>
      </div>

      <FieldGrid fields={PRICING_FIELDS} form={form} setForm={setForm} />

      <div className="border-t border-slate-100 pt-4">
        <h4 className="font-bold text-navy text-xs uppercase tracking-wide">Weight</h4>
        <p className="text-xs text-slate-500 mt-1 mb-3">
          Everything a buyer gets from one seller in a delivery is weighed together, using the weight sellers enter on each product. Products without a weight count as 0 lb.
        </p>
        <FieldGrid fields={WEIGHT_FIELDS} form={form} setForm={setForm} />
      </div>

      <PricePreview pricing={form} />

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
        {saving ? 'Saving…' : 'Save shipping'}
      </button>
    </form>
  );
}

// ── Payouts ─────────────────────────────────────────────────────────────────

// How long withdrawals take to reach people's banks — the promise every
// Payouts tab shows, and the due date on each request in the admin queue.
function PayoutsTab() {
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

  if (!form) return error ? <p className="text-sm text-red-600" role="alert">{error}</p> : <p className="text-sm text-slate-500">Loading…</p>;
  return (
    <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 text-sm">
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
  const [tab, setTab] = useState('shipping');

  return (
    <div className="max-w-2xl">
      <h2 className="font-bold text-navy text-lg mb-4">Settings</h2>
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              tab === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'shipping' && <ShippingTab />}
      {tab === 'payouts' && <PayoutsTab />}
    </div>
  );
}
