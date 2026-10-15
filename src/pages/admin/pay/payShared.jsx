import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { inputClass } from '../adminFormat.js';

export function Stat({ label, value, hint, tone = 'text-navy' }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export function SectionTitle({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="font-bold text-navy text-lg">{title}</h2>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-2xl">{description}</p>}
    </div>
  );
}

// Financial changes need the admin's password again. `onConfirm(password)`
// runs the change and should throw on failure; the error is shown here.
export function PasswordConfirm({ title, summary, confirmLabel = 'Confirm', onConfirm, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={title} className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>
        {summary && <p className="text-sm text-slate-700">{summary}</p>}
        <label className="block text-xs text-slate-600">
          Your password, to confirm
          <input type="password" required autoFocus autoComplete="current-password" className={`${inputClass} w-full mt-1`} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <p className="text-[11px] text-slate-500">This change is recorded in the audit log.</p>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
            {saving ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
