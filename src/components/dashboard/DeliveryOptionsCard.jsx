import { useState } from 'react';
import { Truck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const inputClass = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary disabled:bg-slate-50';

function Toggle({ checked, onChange, disabled, title, description, children }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span>
          <span className="block text-sm font-bold text-slate-900">{title}</span>
          <span className="block text-xs text-slate-500">{description}</span>
        </span>
      </label>
      {checked && children && <div className="mt-3 ml-7 space-y-2">{children}</div>}
    </div>
  );
}

const fromBusiness = (b) => ({
  offersIsleDash: b.offersIsleDash ?? true,
  offersSellerDelivery: b.offersSellerDelivery ?? false,
  sellerDeliveryFeeJmd: b.sellerDeliveryFeeJmd == null ? '' : String(Number(b.sellerDeliveryFeeJmd)),
  sellerDeliveryNote: b.sellerDeliveryNote ?? '',
  offersPickup: b.offersPickup ?? false,
  pickupInstructions: b.pickupInstructions ?? '',
});

// How customers can get their order from this warehouse or shop — the
// choices they see in the cart (see CartPage.jsx). A warehouse's options
// cover everything its resellers sell, since it packs and ships those too.
// `endpoint` is the business's PUT .../delivery-options route.
export default function DeliveryOptionsCard({ business, endpoint, pickupLocation, readOnly = false, onSaved }) {
  const [form, setForm] = useState(() => fromBusiness(business));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { notify } = useToast();
  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest(endpoint, {
        method: 'PUT',
        body: {
          ...form,
          sellerDeliveryFeeJmd: form.offersSellerDelivery && form.sellerDeliveryFeeJmd !== '' ? Number(form.sellerDeliveryFeeJmd) : null,
        },
      });
      notify('Delivery options saved — customers will see them at checkout.');
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3 text-sm">
      <div>
        <h3 className="font-bold text-navy flex items-center gap-2">
          <Truck className="w-4 h-4" /> Delivery options
        </h3>
        <p className="text-xs text-slate-500 mt-1">Customers choose one of these at checkout.</p>
      </div>

      <Toggle
        checked={form.offersIsleDash}
        onChange={set('offersIsleDash')}
        disabled={readOnly}
        title="IsleDash delivery"
        description="One of your accepted IsleDash drivers collects and delivers it. The customer pays the IsleDash fee."
      />

      <Toggle
        checked={form.offersSellerDelivery}
        onChange={set('offersSellerDelivery')}
        disabled={readOnly}
        title="Our own delivery"
        description="You deliver it yourself and keep the fee you set."
      >
        <label className="block text-xs text-slate-600">
          Delivery fee (J$)
          <input type="number" min="0" step="1" required disabled={readOnly} className={`${inputClass} mt-1`} value={form.sellerDeliveryFeeJmd} onChange={(e) => set('sellerDeliveryFeeJmd')(e.target.value)} />
        </label>
        <label className="block text-xs text-slate-600">
          What customers should know <span className="text-slate-400">(optional)</span>
          <input type="text" maxLength={300} disabled={readOnly} placeholder="e.g. Kingston & St. Andrew only, same day before 3pm" className={`${inputClass} mt-1`} value={form.sellerDeliveryNote} onChange={(e) => set('sellerDeliveryNote')(e.target.value)} />
        </label>
      </Toggle>

      <Toggle
        checked={form.offersPickup}
        onChange={set('offersPickup')}
        disabled={readOnly}
        title="Customer pickup"
        description={`Free. Customers collect from ${pickupLocation}.`}
      >
        <label className="block text-xs text-slate-600">
          Pickup instructions <span className="text-slate-400">(optional)</span>
          <input type="text" maxLength={300} disabled={readOnly} placeholder="e.g. Mon–Sat 9–5, ask at the front desk" className={`${inputClass} mt-1`} value={form.pickupInstructions} onChange={(e) => set('pickupInstructions')(e.target.value)} />
        </label>
      </Toggle>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {readOnly ? (
        <p className="text-xs text-slate-400">Only the owner or a warehouse admin can change these.</p>
      ) : (
        <button type="submit" disabled={saving} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
          {saving ? 'Saving…' : 'Save delivery options'}
        </button>
      )}
    </form>
  );
}
