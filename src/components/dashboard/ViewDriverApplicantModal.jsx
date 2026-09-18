import { X, Truck, FileText } from 'lucide-react';

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

function DocLink({ label, url, holderName, expiry, status }) {
  if (!url) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100 text-sm">
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-secondary hover:underline">
        <FileText className="w-4 h-4 shrink-0" /> {label}
      </a>
      <span className="text-right text-xs text-slate-500">
        {holderName && <span className="block">{holderName}</span>}
        {expiry && <span className="block">Expires {new Date(expiry).toLocaleDateString()}</span>}
        {status && <span className="block font-semibold text-slate-700">{status.replaceAll('_', ' ')}</span>}
      </span>
    </div>
  );
}

// Everything captured about a driver at courier onboarding (ISLE-104) — what
// a warehouse/shop actually needs to decide on a delivery application, not
// just their name and phone. Mirrors ViewApplicantModal.jsx (the reseller
// equivalent) — same Row/Section layout, driver-specific fields.
export default function ViewDriverApplicantModal({ application, onClose }) {
  const { driver } = application;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-navy flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              {driver.user.fullName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Applied {new Date(application.requestedAt).toLocaleDateString()}
              {driver.referenceId && <> · {driver.referenceId}</>}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Section title="Contact">
            <Row label="Full name" value={driver.user.fullName} />
            <Row label="Email" value={driver.user.email} />
            <Row label="Phone" value={driver.user.phoneNumber} />
            <Row label="WhatsApp" value={driver.whatsappNumber} />
            <Row label="Home parish" value={driver.homeParish} />
            <Row label="Home town" value={driver.homeTown} />
          </Section>

          <Section title="Vehicle">
            <Row label="Type" value={driver.vehicleType?.replaceAll('_', ' ')} />
            <Row label="Make / Model" value={[driver.vehicleMake, driver.vehicleModel].filter(Boolean).join(' ')} />
            <Row label="Year" value={driver.vehicleYear} />
            <Row label="License plate" value={driver.licensePlate} />
            <Row label="Cold box" value={driver.hasColdBox ? 'Yes' : 'No'} />
            <Row label="Zone parishes" value={driver.zoneParishes?.length ? driver.zoneParishes.join(', ') : null} />
            <Row label="Availability" value={driver.availability?.replaceAll('_', ' ')} />
          </Section>

          <Section title="Payout">
            <Row label="Method" value={driver.payoutMethod?.replaceAll('_', ' ')} />
            <Row label="Bank" value={driver.bankName} />
            <Row label="Account holder" value={driver.accountHolderName} />
            <Row label="Account number" value={driver.accountNumber} />
            <Row label="Branch code" value={driver.branchCode} />
            <Row label="Lynk Wallet ID" value={driver.lynkWalletId} />
          </Section>

          {(driver.licenseImageUrl || driver.insuranceCertUrl || driver.registrationCertUrl) && (
            <Section title="Documents">
              <DocLink
                label="Driver's license"
                url={driver.licenseImageUrl}
                holderName={driver.licenseHolderName}
                expiry={driver.licenseExpiry}
                status={driver.licenseVerificationStatus}
              />
              <DocLink
                label="Certificate of insurance"
                url={driver.insuranceCertUrl}
                holderName={driver.insuranceHolderName}
                expiry={driver.insuranceCertExpiry}
                status={driver.insuranceVerificationStatus}
              />
              <DocLink
                label="Certificate of registration"
                url={driver.registrationCertUrl}
                holderName={driver.registrationHolderName}
                expiry={driver.registrationCertExpiry}
                status={driver.registrationVerificationStatus}
              />
            </Section>
          )}

          {!driver.vehicleType && (
            <p className="text-xs text-slate-500 italic mt-2">
              This driver has no full courier registration details on file.
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
