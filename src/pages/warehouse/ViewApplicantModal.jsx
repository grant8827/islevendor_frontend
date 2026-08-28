import { X, UserRound, FileText } from 'lucide-react';

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-semibold text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

// Everything captured about a reseller at registration (ISLE-102 onboarding,
// or the quick-setup StoreSetupForm for older accounts, which leaves most of
// this blank) — what a warehouse actually needs to decide on an application,
// not just the store's name and slug.
export default function ViewApplicantModal({ application, onClose }) {
  const { store } = application;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-navy flex items-center gap-2">
              <UserRound className="w-4 h-4 text-primary" />
              {store.storeName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Applied {new Date(application.requestedAt).toLocaleDateString()}
              {store.referenceId && <> · {store.referenceId}</>}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Section title="Contact">
            <Row label="Full name" value={store.user?.fullName} />
            <Row label="Email" value={store.user?.email} />
            <Row label="Phone" value={store.contactPhone || store.user?.phoneNumber} />
            <Row label="Storefront" value={`/store/${store.slug}`} />
            <Row label="Parish" value={store.parish} />
          </Section>

          <Section title="Business">
            <Row label="Reseller type" value={store.resellerType?.replaceAll('_', ' ')} />
            <Row label="Legal name" value={store.legalName} />
            <Row label="TRN" value={store.trn} />
            <Row label="Instagram" value={store.instagramHandle} />
            <Row label="TikTok" value={store.tiktokHandle} />
            <Row label="Primary sales channel" value={store.primarySalesChannel?.replaceAll('_', ' ')} />
            <Row label="Target categories" value={store.targetCategories?.length ? store.targetCategories.join(', ') : null} />
            <Row label="Default markup" value={store.defaultMarkupPercent ? `${store.defaultMarkupPercent}%` : null} />
          </Section>

          <Section title="Payout">
            <Row label="Method" value={store.payoutMethod?.replaceAll('_', ' ')} />
            <Row label="Bank" value={store.bankName} />
            <Row label="Account holder" value={store.accountHolderName} />
            <Row label="Account number" value={store.accountNumber} />
            <Row label="Branch code" value={store.branchCode} />
            <Row label="Lynk Wallet ID" value={store.lynkWalletId} />
          </Section>

          {store.idDocUrl && (
            <Section title="Documents">
              <a
                href={store.idDocUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-secondary hover:underline"
              >
                <FileText className="w-4 h-4" /> View ID document
              </a>
            </Section>
          )}

          {!store.resellerType && (
            <p className="text-xs text-slate-500 italic mt-2">
              This store was set up via quick-setup and has no full registration details on file.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
