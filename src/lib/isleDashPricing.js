// IsleDash delivery pricing, as the admin sets it (Admin → Settings →
// Shipping). Mirrors backend-node/src/lib/isleDashPricing.ts, for previews
// only — checkout is always priced by the server.

export const money = (n) => `J$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

/** The first item's fee for `roadMiles` (already road-adjusted). */
export function distanceFee(p, roadMiles) {
  const charged = Math.max(roadMiles - (num(p.includedMiles) ?? 0), 0);
  let fee = (num(p.baseFeeJmd) ?? 0) + charged * (num(p.perMileJmd) ?? 0);
  fee = Math.max(fee, num(p.minFeeJmd) ?? 0);
  if (num(p.maxFeeJmd) !== null) fee = Math.min(fee, num(p.maxFeeJmd));
  return Math.round(fee);
}

/** Straight-line miles turned into the road miles a delivery is priced for. */
export function roadMiles(p, straightMiles) {
  return Math.round((straightMiles * (100 + (num(p.roadAdjustPercent) ?? 0))) / 10) / 10;
}

/** Whether `roadMiles` is further than IsleDash goes. */
export function beyondLimit(p, miles) {
  return num(p.maxMiles) !== null && miles > num(p.maxMiles);
}

/** What each further item from the same seller costs, for a first-item `fee`. */
export function extraItemFee(p, fee) {
  return Math.round(fee * (num(p.extraItemPercent) ?? 0)) / 100;
}

/** A one-line summary for sellers: "J$300 covers the first 3 mi, then J$60 a mile (J$300–J$2,500)". */
export function describePricing(p) {
  if (!p) return null;
  const perMile = num(p.perMileJmd) ?? 0;
  if (perMile === 0) return `${money(p.baseFeeJmd)} per delivery`;
  const included = num(p.includedMiles) ?? 0;
  const parts = [included > 0 ? `${money(p.baseFeeJmd)} covers the first ${included} mi, then ${money(perMile)} a mile` : `${money(p.baseFeeJmd)} plus ${money(perMile)} a mile`];
  const min = num(p.minFeeJmd) ?? 0;
  const max = num(p.maxFeeJmd);
  if (min > 0 && max !== null) parts.push(`(${money(min)}–${money(max)})`);
  else if (max !== null) parts.push(`(up to ${money(max)})`);
  else if (min > 0) parts.push(`(at least ${money(min)})`);
  return parts.join(' ');
}
