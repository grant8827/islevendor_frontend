import { useEffect, useState } from 'react';
import { Landmark, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const inputClass = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary';

const EMPTY = {
  method: 'BANK',
  bankName: '',
  bankBranch: '',
  bankAccountType: 'SAVINGS',
  accountNumber: '',
  nameInBank: '',
  lynkWalletId: '',
  idType: '',
  idNumber: '',
  email: '',
  phone: '',
  currentPassword: '',
};

// Where this person's withdrawals are paid — shown on every dashboard's
// Payouts tab. Account and ID numbers are stored encrypted and only ever
// shown back as the last four digits; saving needs the current password.
export default function PayoutDetailsCard() {
  const { notify } = useToast();
  const [options, setOptions] = useState(null);
  const [saved, setSaved] = useState(undefined); // undefined = loading, null = none yet
  const [hint, setHint] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function load() {
    Promise.all([apiRequest('/ledger/payout-options'), apiRequest('/ledger/payout-account')])
      .then(([opts, { account, prefill }]) => {
        setOptions(opts);
        setSaved(account);
        const source = account ?? prefill ?? {};
        setHint(account ? account.accountNumber : (prefill?.accountNumberHint ?? null));
        setForm({
          ...EMPTY,
          method: source.method ?? 'BANK',
          bankName: source.bankName ?? '',
          bankBranch: source.bankBranch ?? '',
          bankAccountType: source.bankAccountType ?? 'SAVINGS',
          nameInBank: source.nameInBank ?? '',
          lynkWalletId: source.lynkWalletId ?? '',
          idType: source.idType ?? '',
          email: source.email ?? '',
          phone: source.phone ?? '',
        });
        if (!account) setEditing(true);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const bank = form.method === 'BANK';
    try {
      await apiRequest('/ledger/payout-account', {
        method: 'PUT',
        body: {
          method: form.method,
          ...(bank
            ? {
                bankName: form.bankName,
                bankBranch: form.bankBranch,
                bankAccountType: form.bankAccountType,
                nameInBank: form.nameInBank,
                ...(form.accountNumber.trim() ? { accountNumber: form.accountNumber } : {}),
              }
            : { lynkWalletId: form.lynkWalletId }),
          ...(form.idType && form.idNumber.trim() ? { idType: form.idType, idNumber: form.idNumber } : {}),
          ...(form.email.trim() ? { email: form.email } : {}),
          ...(form.phone.trim() ? { phone: form.phone } : {}),
          currentPassword: form.currentPassword,
        },
      });
      notify('Payout details saved.');
      setEditing(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (saved === undefined) return error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null;

  return (
    <section className="max-w-xl bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-8 text-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-navy flex items-center gap-2">
            <Landmark className="w-4 h-4" /> Payout details
          </h3>
          <p className="text-xs text-slate-500 mt-1">Where your withdrawals are sent.</p>
        </div>
        {saved && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-bold text-secondary hover:underline">
            Change
          </button>
        )}
      </div>

      {saved && !editing && (
        <dl className="space-y-1 text-sm">
          {saved.method === 'BANK' ? (
            <>
              <div>
                <dt className="sr-only">Bank</dt>
                <dd className="font-semibold">
                  {saved.bankName} · {saved.bankBranch}
                </dd>
              </div>
              <dd className="text-slate-600">
                {saved.nameInBank} · {saved.bankAccountType?.toLowerCase()} {saved.accountNumber}
              </dd>
            </>
          ) : (
            <dd className="font-semibold">Lynk wallet {saved.lynkWalletId}</dd>
          )}
          {!saved.readyForAutomaticPayout && saved.method === 'BANK' && (
            <dd className="text-xs text-amber-700 mt-2">
              For faster automatic payouts, add: {saved.missingForAutomaticPayout.join(', ')}.
            </dd>
          )}
        </dl>
      )}

      {editing && options && (
        <form onSubmit={save} className="space-y-3">
          <div className="flex gap-4 text-xs">
            {[
              ['BANK', 'Bank account'],
              ['LYNK_WALLET', 'Lynk wallet'],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="method" value={value} checked={form.method === value} onChange={set('method')} className="accent-[var(--primary)]" /> {label}
              </label>
            ))}
          </div>

          {form.method === 'BANK' ? (
            <>
              <label className="block text-xs text-slate-600">
                Bank
                <select required className={`${inputClass} mt-1`} value={form.bankName} onChange={set('bankName')}>
                  <option value="">Choose your bank</option>
                  {options.banks.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-slate-600">
                  Branch
                  <input required maxLength={255} className={`${inputClass} mt-1`} value={form.bankBranch} onChange={set('bankBranch')} />
                </label>
                <label className="block text-xs text-slate-600">
                  Account type
                  <select className={`${inputClass} mt-1`} value={form.bankAccountType} onChange={set('bankAccountType')}>
                    <option value="SAVINGS">Savings</option>
                    <option value="CHEQUING">Chequing</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs text-slate-600">
                Account number
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  required={!saved}
                  className={`${inputClass} mt-1`}
                  value={form.accountNumber}
                  onChange={set('accountNumber')}
                  placeholder={hint ? `Leave blank to keep ${hint}` : ''}
                />
              </label>
              <label className="block text-xs text-slate-600">
                Name on the account
                <input required maxLength={255} className={`${inputClass} mt-1`} value={form.nameInBank} onChange={set('nameInBank')} />
              </label>
            </>
          ) : (
            <label className="block text-xs text-slate-600">
              Lynk wallet
              <input required maxLength={100} className={`${inputClass} mt-1`} value={form.lynkWalletId} onChange={set('lynkWalletId')} />
            </label>
          )}

          <fieldset className="border-t border-slate-100 pt-3 space-y-3">
            <legend className="text-xs font-bold text-slate-700">For automatic bank payouts (optional)</legend>
            <p className="text-[11px] text-slate-500">WiPay asks for these to send money straight to your bank. Your ID number is stored encrypted.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-600">
                ID type
                <select className={`${inputClass} mt-1`} value={form.idType} onChange={set('idType')}>
                  <option value="">—</option>
                  {options.idTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-600">
                ID number
                <input autoComplete="off" className={`${inputClass} mt-1`} value={form.idNumber} onChange={set('idNumber')} placeholder={saved?.hasIdNumber ? 'Leave blank to keep' : ''} />
              </label>
              <label className="block text-xs text-slate-600">
                Email
                <input type="email" maxLength={255} className={`${inputClass} mt-1`} value={form.email} onChange={set('email')} />
              </label>
              <label className="block text-xs text-slate-600">
                Phone
                <input type="tel" className={`${inputClass} mt-1`} value={form.phone} onChange={set('phone')} placeholder="876-555-1234" />
              </label>
            </div>
          </fieldset>

          <label className="block text-xs text-slate-600 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Your password, to confirm
            </span>
            <input type="password" required autoComplete="current-password" className={`${inputClass} mt-1`} value={form.currentPassword} onChange={set('currentPassword')} />
          </label>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
              {saving ? 'Saving…' : 'Save payout details'}
            </button>
            {saved && (
              <button type="button" onClick={() => setEditing(false)} className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-surface">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
