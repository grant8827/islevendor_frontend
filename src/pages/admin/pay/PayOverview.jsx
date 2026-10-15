import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/client.js';
import { money } from '../adminFormat.js';
import { SectionTitle, Stat } from './payShared.jsx';
import AdminPayoutsPanel from '../AdminPayoutsPanel.jsx';

const RANGES = [7, 30, 90];

export default function PayOverview({ onOpen }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setData(null);
    apiRequest(`/admin/pay/overview?days=${days}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [days]);

  useEffect(load, [load]);

  const paid = data?.payments.PAID;
  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title="Payment overview" description="Card payments through WiPay, what's owed to sellers and drivers, and what needs your attention." />
        <div className="flex gap-1" role="group" aria-label="Period">
          {RANGES.map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${days === d ? 'bg-navy text-white border-navy' : 'border-slate-300 text-slate-600 hover:bg-surface'}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <>
          {!data.cardPaymentsLive && (
            <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
              Card payments are off — customers can place orders but can't pay yet.{' '}
              <button type="button" onClick={() => onOpen('gateways')} className="underline font-bold">
                Payment gateways
              </button>
            </p>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label={`Card payments received (${days} days)`} value={money(paid?.amountJmd ?? 0)} hint={`${paid?.count ?? 0} payments`} tone="text-primary-dark" />
            <Stat label="IsleVendor commission" value={money(data.paidOrders.commissionJmd)} hint={`on ${data.paidOrders.count} paid orders`} />
            <Stat label="Owed to sellers & drivers" value={money(Number(data.vendorBalances.pendingJmd) + Number(data.vendorBalances.availableJmd))} hint={`${money(data.vendorBalances.availableJmd)} withdrawable now`} />
            <Stat label="Withdrawals waiting" value={data.payoutsWaiting.count} hint={money(data.payoutsWaiting.amountJmd)} tone={data.payoutsWaiting.count ? 'text-amber-600' : 'text-navy'} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Declined or not started" value={data.payments.FAILED?.count ?? 0} />
            <Stat label="Waiting for the customer" value={data.payments.PENDING?.count ?? 0} />
            <Stat label="Paid twice — refund needed" value={data.refundsNeeded} tone={data.refundsNeeded ? 'text-red-600' : 'text-navy'} />
          </div>
        </>
      )}

      <AdminPayoutsPanel show="platform" />
    </div>
  );
}
