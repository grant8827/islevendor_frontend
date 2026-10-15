import { Clock, CircleX } from 'lucide-react';

const COPY = {
  seller: {
    PENDING_REVIEW: {
      title: 'Awaiting IsleVendor approval',
      body: "You can set things up now. Listing items, selling, sending orders out and withdrawing open as soon as we've reviewed your application.",
    },
    REJECTED: {
      title: 'Application not approved',
      body: "IsleVendor didn't approve this application, so it can't list, sell or withdraw. Contact support to find out why or to apply again.",
    },
  },
  driver: {
    PENDING_REVIEW: {
      title: 'Awaiting IsleVendor approval',
      body: "Once we've approved your driver application you can apply to deliver for warehouses and stores.",
    },
    REJECTED: {
      title: 'Application not approved',
      body: "IsleVendor didn't approve your driver application. Contact support to find out why or to apply again.",
    },
  },
};

// Shown across the top of a seller or driver dashboard until IsleVendor's
// admin has approved the account — the server refuses listing, selling,
// dispatching and withdrawing until then (see backend-node's
// lib/eligibility.ts), so this says why up front instead of leaving people
// to discover it one refused action at a time. Renders nothing once approved.
export default function ApprovalBanner({ status, audience = 'seller' }) {
  const copy = COPY[audience][status];
  if (!copy) return null;
  const rejected = status === 'REJECTED';
  const Icon = rejected ? CircleX : Clock;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-6 ${
        rejected ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold">{copy.title}</p>
        <p className="text-xs mt-0.5">{copy.body}</p>
      </div>
    </div>
  );
}
