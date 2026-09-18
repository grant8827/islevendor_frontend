import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../../api/client.js';
import { BarList, ChartCard, StatTile, TrendChart } from './charts.jsx';
import { formatJmd, formatJmdCompact } from './format.js';

const RANGES = [
  { key: '7', label: '7 days', days: 7 },
  { key: '30', label: '30 days', days: 30 },
  { key: '90', label: '90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
];

// Money has been collected (ledger legs exist) for these — AWAITING_PAYMENT
// hasn't paid yet, and REFUNDED / CANCELLED have been unwound.
const PAID_STATUSES = new Set(['PACKING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED']);

const STATUS_ORDER = ['AWAITING_PAYMENT', 'PACKING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED', 'REFUNDED', 'CANCELLED'];
const STATUS_LABELS = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PACKING: 'Packing',
  READY_FOR_PICKUP: 'Ready for pickup',
  PICKED_UP: 'Picked up',
  DELIVERED: 'Delivered',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const DAY_LABEL = { weekday: 'short', month: 'short', day: 'numeric' };
const DAY_TICK = { month: 'short', day: 'numeric' };
const MONTH_LABEL = { month: 'long', year: 'numeric' };
const MONTH_TICK = { month: 'short', year: 'numeric' };

function buildBuckets(days, orders) {
  const today = startOfDay(new Date());
  let from;
  let monthly = false;
  if (days) {
    from = addDays(today, -(days - 1));
  } else {
    const earliest = orders.length ? startOfDay(new Date(Math.min(...orders.map((o) => new Date(o.createdAt))))) : addDays(today, -29);
    const span = Math.round((today - earliest) / 86400000) + 1;
    monthly = span > 90;
    from = monthly ? new Date(earliest.getFullYear(), earliest.getMonth(), 1) : earliest;
  }

  const buckets = [];
  const byKey = new Map();
  let d = from;
  while (d <= today) {
    const bucket = {
      label: d.toLocaleDateString(undefined, monthly ? MONTH_LABEL : DAY_LABEL),
      tick: d.toLocaleDateString(undefined, monthly ? MONTH_TICK : DAY_TICK),
      revenue: 0,
      orders: 0,
    };
    buckets.push(bucket);
    byKey.set(monthly ? monthKey(d) : dayKey(d), bucket);
    d = monthly ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDays(d, 1);
  }

  return { buckets, byKey, monthly };
}

function groupSum(paid, keyOf, earningOf) {
  const groups = new Map();
  for (const o of paid) {
    const key = keyOf(o);
    if (!key) continue;
    const g = groups.get(key) ?? { label: key, value: 0, orders: 0, units: 0 };
    g.value += earningOf(o);
    g.orders += 1;
    g.units += o.quantity ?? 1;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.value - a.value);
}

const pctChange = (current, previous) => (previous > 0 ? { pct: ((current - previous) / previous) * 100 } : null);

/**
 * Revenue analytics for a seller's Overview tab — shared by the warehouse,
 * reseller and shop dashboards. All three already expose their full order
 * history (GET .../orders, the same call the Orders tab makes), so this
 * derives everything client-side; the only per-dashboard difference is what
 * an order "earns" that seller:
 *
 *  - `earningOf(order)` — warehouse: wholesaleTotalJmd; reseller and shop:
 *    resellerMarginJmd (see ledger.service.ts for how each is split).
 *  - `breakdown` (optional) — a second "top X" list, e.g. the warehouse's
 *    best-performing resellers: { title, labelOf(order) }.
 *
 * `earningOf` and `breakdown` must be stable references (module-level
 * constants), since they're memo dependencies.
 *
 * Revenue counts paid, non-refunded orders by the day they were placed.
 */
export default function RevenueAnalytics({ endpoint, earningOf, revenueLabel = 'Revenue', revenueNote, breakdown }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [rangeKey, setRangeKey] = useState('30');
  const range = RANGES.find((r) => r.key === rangeKey);

  useEffect(() => {
    setOrders(null);
    setError(null);
    apiRequest(endpoint).then(setOrders).catch((err) => setError(err.message));
  }, [endpoint]);

  const data = useMemo(() => {
    if (!orders) return null;
    const { days } = range;
    const today = startOfDay(new Date());
    const start = days ? addDays(today, -(days - 1)) : null;
    const prevStart = days ? addDays(start, -days) : null;

    const rangeOrders = start ? orders.filter((o) => new Date(o.createdAt) >= start) : orders;
    const prevOrders = days ? orders.filter((o) => new Date(o.createdAt) >= prevStart && new Date(o.createdAt) < start) : [];

    const summarize = (list) => {
      const paid = list.filter((o) => PAID_STATUSES.has(o.status));
      const revenue = paid.reduce((sum, o) => sum + earningOf(o), 0);
      return { paid, revenue, count: paid.length, aov: paid.length ? revenue / paid.length : 0 };
    };
    const cur = summarize(rangeOrders);
    const prev = summarize(prevOrders);

    const { buckets, byKey, monthly } = buildBuckets(days, rangeOrders);
    for (const o of cur.paid) {
      const d = new Date(o.createdAt);
      const bucket = byKey.get(monthly ? monthKey(d) : dayKey(d));
      if (!bucket) continue;
      bucket.revenue += earningOf(o);
      bucket.orders += 1;
    }

    const awaitingDelivery = cur.paid.filter((o) => o.status !== 'DELIVERED').reduce((sum, o) => sum + earningOf(o), 0);
    const refunded = rangeOrders.filter((o) => o.status === 'REFUNDED');
    const refundedValue = refunded.reduce((sum, o) => sum + earningOf(o), 0);
    const ratings = rangeOrders.map((o) => o.rating?.rating).filter((r) => typeof r === 'number');

    const statusCounts = STATUS_ORDER.map((status) => ({ status, count: rangeOrders.filter((o) => o.status === status).length })).filter((s) => s.count > 0);

    const itemTitleOf = (o) => o.storeListing?.masterProduct?.title ?? o.shopProduct?.title ?? 'Item';

    return {
      cur,
      prev,
      buckets,
      awaitingDelivery,
      refunded: refunded.length,
      refundedValue,
      avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      ratingCount: ratings.length,
      statusCounts,
      topProducts: groupSum(cur.paid, itemTitleOf, earningOf).slice(0, 5),
      topBreakdown: breakdown ? groupSum(cur.paid, breakdown.labelOf, earningOf).slice(0, 5) : [],
    };
  }, [orders, range, earningOf, breakdown]);

  if (error) return <p className="text-sm text-red-500 mt-8">Couldn't load analytics: {error}</p>;
  if (!data) return <p className="text-sm text-slate-500 mt-8">Loading analytics…</p>;
  if (orders.length === 0) {
    return (
      <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center">
        <p className="text-sm font-bold text-navy">No sales yet</p>
        <p className="text-xs text-slate-500 mt-1">Revenue charts appear here once you receive your first order.</p>
      </div>
    );
  }

  const vs = range.days ? `vs previous ${range.days} days` : undefined;
  const { cur, prev } = data;
  const revenuePoints = data.buckets.map((b) => ({ label: b.label, tick: b.tick, value: b.revenue }));
  const orderPoints = data.buckets.map((b) => ({ label: b.label, tick: b.tick, value: b.orders }));

  const productItems = data.topProducts.map((g) => ({
    label: g.label,
    value: g.value,
    display: formatJmd(g.value),
    note: `${g.units} unit${g.units === 1 ? '' : 's'}`,
  }));
  const breakdownItems = data.topBreakdown.map((g) => ({
    label: g.label,
    value: g.value,
    display: formatJmd(g.value),
    note: `${g.orders} order${g.orders === 1 ? '' : 's'}`,
  }));
  const statusItems = data.statusCounts.map((s) => ({ label: STATUS_LABELS[s.status], value: s.count, display: String(s.count) }));

  return (
    <section className="mt-8" aria-label="Revenue analytics">
      {/* One filter row above everything it scopes. */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-navy text-base">Revenue analytics</h3>
          {revenueNote && <p className="text-xs text-slate-500 mt-0.5">{revenueNote}</p>}
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRangeKey(r.key)}
              aria-pressed={rangeKey === r.key}
              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                rangeKey === r.key ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <StatTile label={revenueLabel} value={formatJmd(cur.revenue)} delta={pctChange(cur.revenue, prev.revenue)} note={vs} />
        <StatTile label="Orders" value={cur.count.toLocaleString()} delta={pctChange(cur.count, prev.count)} note={vs} />
        <StatTile label="Average order value" value={formatJmd(Math.round(cur.aov))} delta={pctChange(cur.aov, prev.aov)} note={vs} />
        <StatTile label="Awaiting delivery" value={formatJmd(data.awaitingDelivery)} note="Paid, not yet delivered" />
        <StatTile
          label="Refunded"
          value={data.refunded.toLocaleString()}
          note={data.refunded > 0 ? `${formatJmd(data.refundedValue)} reversed` : 'No refunds'}
        />
        <StatTile
          label="Average rating"
          value={data.avgRating != null ? `${data.avgRating.toFixed(1)} / 5` : '—'}
          note={data.avgRating != null ? `${data.ratingCount} review${data.ratingCount === 1 ? '' : 's'}` : 'No reviews yet'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          className="lg:col-span-2"
          title={`${revenueLabel} over time`}
          subtitle={cur.count === 0 ? 'No paid orders in this period.' : `${formatJmd(cur.revenue)} from ${cur.count} paid order${cur.count === 1 ? '' : 's'}`}
          table={{ columns: ['Period', revenueLabel], rows: revenuePoints.map((p) => [p.label, formatJmd(p.value)]) }}
        >
          <TrendChart points={revenuePoints} variant="line" valueLabel={revenueLabel} formatValue={formatJmd} formatTick={formatJmdCompact} />
        </ChartCard>

        <ChartCard
          title="Orders over time"
          subtitle="Paid orders placed"
          table={{ columns: ['Period', 'Orders'], rows: orderPoints.map((p) => [p.label, p.value]) }}
        >
          <TrendChart points={orderPoints} variant="columns" valueLabel="orders" formatValue={(v) => String(v)} formatTick={(v) => String(v)} />
        </ChartCard>

        <ChartCard
          title="Orders by status"
          subtitle="Everything placed in this period"
          table={{ columns: ['Status', 'Orders'], rows: statusItems.map((s) => [s.label, s.display]) }}
        >
          <BarList items={statusItems} />
        </ChartCard>

        <ChartCard
          title="Top products"
          subtitle={`By ${revenueLabel.toLowerCase()}`}
          table={{ columns: ['Product', revenueLabel, 'Units'], rows: data.topProducts.map((g) => [g.label, formatJmd(g.value), g.units]) }}
        >
          <BarList items={productItems} />
        </ChartCard>

        {breakdown && (
          <ChartCard
            title={breakdown.title}
            subtitle={`By ${revenueLabel.toLowerCase()}`}
            table={{ columns: [breakdown.columnLabel ?? 'Name', revenueLabel, 'Orders'], rows: data.topBreakdown.map((g) => [g.label, formatJmd(g.value), g.orders]) }}
          >
            <BarList items={breakdownItems} />
          </ChartCard>
        )}
      </div>
    </section>
  );
}
