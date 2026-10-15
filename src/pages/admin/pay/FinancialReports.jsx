import { useState } from 'react';
import { Download } from 'lucide-react';
import { API_BASE, getToken } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { inputClass } from '../adminFormat.js';
import { SectionTitle } from './payShared.jsx';

const REPORTS = [
  { type: 'transactions', title: 'Card payments', description: 'Every WiPay payment attempt: reference, transaction, status, amount, customer, orders.' },
  { type: 'ledger', title: 'Ledger', description: 'Every share credited to a seller, driver or IsleVendor, and whether it’s held, available, withdrawn or reversed.' },
  { type: 'payouts', title: 'Payouts', description: 'Every withdrawal: who, how much, status, how it was paid, references and WiPay fees.' },
  { type: 'commissions', title: 'Commissions', description: 'Paid orders with the money split: totals, IsleVendor commission, delivery fees, seller shares.' },
];

const isoDay = (d) => d.toISOString().slice(0, 10);

export default function FinancialReports() {
  const { notify } = useToast();
  const [from, setFrom] = useState(isoDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(isoDay(new Date()));
  const [busy, setBusy] = useState(null);

  // A plain link can't send the admin's login, so the file is fetched and saved.
  async function download(type) {
    setBusy(type);
    try {
      const res = await fetch(`${API_BASE}/api/admin/pay/reports/${type}?${new URLSearchParams({ from, to })}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Download failed (${res.status})`);
      const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `islevendor-${type}.csv`;
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <SectionTitle title="Financial reports" description="Download as CSV for a spreadsheet or your accountant. Each download is recorded in the audit log." />
      <div className="flex flex-wrap gap-3 mb-6">
        <label className="text-xs text-slate-600">
          From
          <input type="date" className={`${inputClass} block mt-1`} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs text-slate-600">
          To
          <input type="date" className={`${inputClass} block mt-1`} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      <div className="space-y-3">
        {REPORTS.map((r) => (
          <div key={r.type} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900 text-sm">{r.title}</p>
              <p className="text-xs text-slate-500">{r.description}</p>
            </div>
            <button type="button" disabled={busy === r.type} onClick={() => download(r.type)} className="flex items-center gap-1.5 btn-primary text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-40">
              <Download className="w-4 h-4" /> {busy === r.type ? 'Preparing…' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
