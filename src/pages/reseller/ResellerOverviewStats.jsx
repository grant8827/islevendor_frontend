import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client.js';
import { StatTile } from '../../components/dashboard/analytics/charts.jsx';
import { formatJmd } from '../../components/dashboard/analytics/format.js';

// Money has been collected for these — same set RevenueAnalytics.jsx counts.
const PAID_STATUSES = new Set(['PACKING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED']);

// All-time headline numbers for the reseller's own store — what they list and
// what they've sold — not the stats of the warehouses supplying them.
export default function ResellerOverviewStats({ store }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      apiRequest(`/commerce/stores/${store.id}/listings`),
      apiRequest('/commerce/grants/mine'),
      apiRequest(`/commerce/stores/${store.id}/orders`),
    ]).then(([listings, grants, orders]) => {
      const paid = orders.filter((o) => PAID_STATUSES.has(o.status));
      setStats({
        listed: listings.length,
        available: grants.length,
        unitsSold: paid.reduce((sum, o) => sum + (o.quantity ?? 1), 0),
        // What customers paid for the items themselves (delivery fee excluded).
        sales: paid.reduce((sum, o) => sum + Number(o.totalPaidJmd) - Number(o.driverFeeJmd), 0),
        earnings: paid.reduce((sum, o) => sum + Number(o.resellerMarginJmd), 0),
      });
    });
  }, [store.id]);

  if (!stats) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <StatTile label="Items in your store" value={stats.listed.toLocaleString()} note="Listed on your storefront" />
      <StatTile label="Items you can sell" value={stats.available.toLocaleString()} note="Added to your account" />
      <StatTile label="Units sold" value={stats.unitsSold.toLocaleString()} note="All time, paid orders" />
      <StatTile label="Total sales" value={formatJmd(stats.sales)} note="What your customers paid" />
      <StatTile label="Your earnings" value={formatJmd(stats.earnings)} note="Your commission, all time" />
    </div>
  );
}
