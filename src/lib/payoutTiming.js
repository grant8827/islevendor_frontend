// How long a withdrawal takes to reach someone's bank, as IsleVendor sets it
// in the admin console (GET /ledger/payout-timing), and how to say it.

/** "2–5 business days", or "3 business days" when both ends match. */
export function describePayoutTime({ minBusinessDays, maxBusinessDays }) {
  const days = minBusinessDays === maxBusinessDays ? `${maxBusinessDays}` : `${minBusinessDays}–${maxBusinessDays}`;
  return `${days} business day${maxBusinessDays === 1 ? '' : 's'}`;
}

/** The latest a withdrawal requested today should arrive, skipping weekends — mirrors the server's estimate. */
export function expectedArrival(maxBusinessDays, from = new Date()) {
  const date = new Date(from);
  let remaining = maxBusinessDays;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) remaining -= 1;
  }
  return date;
}

/** "Fri, 23 Oct" for a date-only value from the API (stored as midnight UTC). */
export const formatArrivalDate = (value) =>
  new Date(value).toLocaleDateString('en-JM', { weekday: 'short', day: 'numeric', month: 'short', timeZone: typeof value === 'string' ? 'UTC' : undefined });
