import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { Badge } from '../adminShared.jsx';
import { formatDateTime, inputClass, money } from '../adminFormat.js';
import { PasswordConfirm, SectionTitle } from './payShared.jsx';

// Payments that have to be given back (a customer charged twice), and
// orders refunded by their seller. WiPay refunds are made in WiPay's own
// dashboard for now; record them here with WiPay's reference.
export default function RefundsPanel() {
  const { notify } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(null);
  const [reference, setReference] = useState('');

  const load = useCallback(() => {
    apiRequest('/admin/pay/refunds')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <p className="text-sm text-red-600" role="alert">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;
  const needed = data.payments.filter((p) => p.status === 'DUPLICATE');

  return (
    <div className="max-w-5xl space-y-8">
      <SectionTitle
        title="Refunds and chargebacks"
        description="Refund the card in WiPay's dashboard, then record it here with WiPay's reference. Chargebacks raised by a customer's bank arrive through WiPay and are handled in WiPay's dashboard."
      />

      <section>
        <h3 className="font-bold text-navy text-sm mb-3">Customers charged twice ({needed.length} to refund)</h3>
        {data.payments.length === 0 ? (
          <p className="text-sm text-slate-500">None.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">WiPay transaction</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{p.customer.fullName}</p>
                      <p className="text-slate-500">{p.customer.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono">{p.wipayTransactionId}</td>
                    <td className="px-5 py-3 font-bold">{money(p.amountJmd)}</td>
                    <td className="px-5 py-3">
                      {p.status === 'DUPLICATE' ? (
                        <button type="button" onClick={() => setMarking(p)} className="btn-primary text-[11px] font-bold px-3 py-1.5 rounded-lg">
                          Mark refunded
                        </button>
                      ) : (
                        <>
                          <Badge className="bg-primary/10 text-primary-dark border-primary/30">Refunded</Badge>
                          <p className="mt-1 text-slate-500">Ref {p.refundReference}</p>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-bold text-navy text-sm mb-3">Orders refunded by sellers</h3>
        {data.orderRefunds.length === 0 ? (
          <p className="text-sm text-slate-500">None.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {data.orderRefunds.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-5 py-3 font-mono">#{r.order.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 font-bold">{money(r.amountJmd)}</td>
                    <td className="px-5 py-3 max-w-xs">{r.reason}</td>
                    <td className="px-5 py-3">{r.initiator?.fullName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {marking && (
        <PasswordConfirm
          title="Record the refund"
          summary={
            <>
              {money(marking.amountJmd)} to {marking.customer.fullName}.
              <label className="block text-xs text-slate-600 mt-3">
                WiPay refund reference
                <input required className={`${inputClass} w-full mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} />
              </label>
            </>
          }
          confirmLabel="Mark refunded"
          onClose={() => setMarking(null)}
          onConfirm={async (currentPassword) => {
            await apiRequest(`/admin/pay/refunds/${marking.id}`, { method: 'POST', body: { reference, currentPassword } });
            notify('Refund recorded.');
            setMarking(null);
            setReference('');
            load();
          }}
        />
      )}
    </div>
  );
}
