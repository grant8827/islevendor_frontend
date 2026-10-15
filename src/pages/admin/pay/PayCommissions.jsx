import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDateTime, inputClass, money } from '../adminFormat.js';
import { PasswordConfirm, SectionTitle } from './payShared.jsx';

export default function PayCommissions() {
  const { notify } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [percent, setPercent] = useState('');
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(() => {
    apiRequest('/admin/pay/commissions')
      .then((d) => {
        setData(d);
        setPercent(String(Number(d.platformCommissionPercent)));
      })
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <p className="text-sm text-red-600" role="alert">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;
  const current = Number(data.platformCommissionPercent);

  return (
    <div className="max-w-4xl space-y-6">
      <SectionTitle
        title="Marketplace commissions"
        description="IsleVendor's commission is a percentage of the seller's price on every item sold. Warehouses set their resellers' commission themselves; IsleDash and shipping fees are set in Settings and each seller's Shipping tab."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
        className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3 text-sm max-w-md"
      >
        <label className="block text-xs text-slate-600">
          IsleVendor commission (%)
          <input type="number" min="0" max="50" step="0.01" required className={`${inputClass} w-full mt-1`} value={percent} onChange={(e) => setPercent(e.target.value)} />
        </label>
        <p className="text-[11px] text-slate-500">
          Changes prices in the marketplace straight away. Orders already placed keep the commission they were charged. On a J$1,000 item, {Number(percent) || 0}% is {money(((Number(percent) || 0) * 1000) / 100)}.
        </p>
        <button type="submit" disabled={Number(percent) === current} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
          Save commission
        </button>
      </form>

      <section>
        <h3 className="font-bold text-navy text-sm mb-3">Earned by month</h3>
        {data.byMonth.length === 0 ? (
          <p className="text-sm text-slate-500">No paid orders yet.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3">Paid orders</th>
                  <th className="px-5 py-3">Sales</th>
                  <th className="px-5 py-3">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.byMonth.map((m) => (
                  <tr key={m.month}>
                    <td className="px-5 py-3">{new Date(m.month).toLocaleDateString('en-JM', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td>
                    <td className="px-5 py-3">{m.orders}</td>
                    <td className="px-5 py-3">{money(m.salesJmd)}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{money(m.commissionJmd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data.history.length > 0 && (
        <section>
          <h3 className="font-bold text-navy text-sm mb-3">Changes</h3>
          <ul className="text-sm space-y-1">
            {data.history.map((h) => (
              <li key={h.id} className="text-slate-700">
                {h.metadata.beforePercent}% → <strong>{h.metadata.afterPercent}%</strong> <span className="text-slate-500">by {h.actor?.fullName ?? 'an admin'}, {formatDateTime(h.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {confirming && (
        <PasswordConfirm
          title="Change IsleVendor's commission"
          summary={`${current}% → ${Number(percent)}% on new orders.`}
          onClose={() => setConfirming(false)}
          onConfirm={async (currentPassword) => {
            await apiRequest('/admin/pay/commissions', { method: 'PUT', body: { percent: Number(percent), currentPassword } });
            notify('Commission saved.');
            setConfirming(false);
            load();
          }}
        />
      )}
    </div>
  );
}
