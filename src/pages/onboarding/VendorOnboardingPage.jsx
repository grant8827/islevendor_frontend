import { Sprout } from 'lucide-react';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import FormField from '../../components/onboarding/FormField.jsx';
import DocUploadField from '../../components/onboarding/DocUploadField.jsx';
import SuccessScreen from '../../components/onboarding/SuccessScreen.jsx';
import StepFooter from '../../components/onboarding/StepFooter.jsx';
import { useOnboardingForm } from '../../components/onboarding/useOnboardingForm.js';
import { submitVendorApplication } from '../../api/onboarding.js';
import { PARISHES, JM_BANKS } from '../../constants/parishes.js';

const STEPS = ['Create account', 'Brand profile', 'Catalog & fulfillment', 'Payout account', 'Verification'];

const VENDOR_CATEGORIES = [
  { value: 'ARTISAN', label: 'Artisan' },
  { value: 'COTTAGE_FOOD', label: 'Cottage food' },
  { value: 'RETAIL_BOUTIQUE', label: 'Retail boutique' },
  { value: 'AGRI_PROCESSOR', label: 'Agri-processor' },
];

const FULFILLMENT_OPTIONS = [
  { value: 'SELF_DISPATCH', label: 'Self-dispatch — driver pick-up at my doorstep' },
  { value: 'HUB_CONSIGNMENT', label: 'Hub consignment — I deliver stock to an IsleVendor warehouse' },
  { value: 'HYBRID', label: 'Hybrid — Knutsford Express / Zip Mail drop-off' },
];

export default function VendorOnboardingPage() {
  const { step, form, files, error, submitting, result, update, updateFile, next, back, handleSubmit } = useOnboardingForm({
    stepCount: STEPS.length,
    initialForm: {
      email: '', password: '', fullName: '', phoneNumber: '',
      brandName: '', vendorCategory: 'ARTISAN', ownerName: '', trn: '', whatsappNumber: '', parish: 'Kingston', addressLine: '',
      primaryProductCategory: '', estimatedItemCount: '', fulfillmentStrategy: 'SELF_DISPATCH', pickupAddress: '',
      payoutMethod: 'BANK', bankName: JM_BANKS[0], accountHolderName: '', accountNumber: '', branchCode: '', lynkWalletId: '',
      slaAccepted: false,
    },
    validateStep(i, f, fl) {
      if (i === 0 && (!f.email || !f.password || f.password.length < 8 || !f.fullName || !f.phoneNumber)) {
        return 'Fill in your email, a password (min 8 characters), name, and phone number.';
      }
      if (i === 1 && (!f.brandName || !f.ownerName || !f.trn || !f.whatsappNumber || !f.addressLine)) {
        return 'Fill in all required brand profile fields.';
      }
      if (i === 2) {
        if (!f.primaryProductCategory || !f.estimatedItemCount) return 'Fill in your product category and estimated item count.';
        if (f.fulfillmentStrategy === 'SELF_DISPATCH' && !f.pickupAddress) return 'Pickup address is required for self-dispatch.';
      }
      if (i === 3 && f.payoutMethod === 'BANK' && (!f.accountHolderName || !f.accountNumber || !f.branchCode)) {
        return 'Fill in your bank account details.';
      }
      if (i === 3 && f.payoutMethod === 'LYNK_WALLET' && !f.lynkWalletId) return 'Enter your Lynk wallet ID.';
      if (i === 4) {
        if (!fl.govId) return 'Upload your government ID photo.';
        if (!f.slaAccepted) return 'You must agree to the Vendor SLA to continue.';
      }
      return null;
    },
    submit: (f, fl) => submitVendorApplication(f, { govId: fl.govId }),
  });

  if (result) {
    return (
      <SuccessScreen
        title="You're on your way!"
        referenceId={result.referenceId}
        reviewEta={result.reviewEta || '12-24 hrs'}
        note="Fast-track review — most micro/small vendors hear back within a day."
      />
    );
  }

  return (
    <OnboardingShell
      icon={Sprout}
      title="Micro & small vendor fast-track signup"
      subtitle="List your goods on IsleVendor with minimal friction."
      steps={STEPS}
      currentStep={step}
      error={error}
      footer={<StepFooter step={step} lastStep={STEPS.length - 1} submitting={submitting} onBack={back} onNext={next} onSubmit={handleSubmit} />}
    >
      {step === 0 && (
        <>
          <FormField label="Full name" required value={form.fullName} onChange={update('fullName')} />
          <FormField label="Email" type="email" required value={form.email} onChange={update('email')} />
          <FormField label="Phone number" required value={form.phoneNumber} onChange={update('phoneNumber')} />
          <FormField label="Password" type="password" minLength={8} hint="Min 8 characters" required value={form.password} onChange={update('password')} />
        </>
      )}

      {step === 1 && (
        <>
          <FormField label="Creator / brand name" required value={form.brandName} onChange={update('brandName')} />
          <FormField label="Vendor category" as="select" options={VENDOR_CATEGORIES} value={form.vendorCategory} onChange={update('vendorCategory')} />
          <FormField label="Owner name" required value={form.ownerName} onChange={update('ownerName')} />
          <FormField label="TRN" required placeholder="123-456-789" hint="9 digits, with or without dashes" value={form.trn} onChange={update('trn')} />
          <FormField label="WhatsApp phone" required value={form.whatsappNumber} onChange={update('whatsappNumber')} />
          <FormField label="Parish" as="select" options={PARISHES} value={form.parish} onChange={update('parish')} />
          <FormField label="Address" required value={form.addressLine} onChange={update('addressLine')} />
        </>
      )}

      {step === 2 && (
        <>
          <FormField label="Primary product category" required placeholder="e.g. Handicrafts, Sauces, Jewellery" value={form.primaryProductCategory} onChange={update('primaryProductCategory')} />
          <FormField label="Estimated item count" type="number" min={1} required value={form.estimatedItemCount} onChange={update('estimatedItemCount')} />
          <FormField label="Fulfillment strategy" as="select" options={FULFILLMENT_OPTIONS} value={form.fulfillmentStrategy} onChange={update('fulfillmentStrategy')} />
          {form.fulfillmentStrategy === 'SELF_DISPATCH' && (
            <FormField label="Pickup address" required hint="Where a driver should collect items" value={form.pickupAddress} onChange={update('pickupAddress')} />
          )}
        </>
      )}

      {step === 3 && (
        <>
          <FormField label="Payout method" as="select" options={[{ value: 'BANK', label: 'Jamaican commercial bank' }, { value: 'LYNK_WALLET', label: 'Lynk wallet' }]} value={form.payoutMethod} onChange={update('payoutMethod')} />
          {form.payoutMethod === 'BANK' ? (
            <>
              <FormField label="Bank" as="select" options={JM_BANKS} value={form.bankName} onChange={update('bankName')} />
              <FormField label="Account holder name" required value={form.accountHolderName} onChange={update('accountHolderName')} />
              <FormField label="Account number" required value={form.accountNumber} onChange={update('accountNumber')} />
              <FormField label="Branch / transit code" required value={form.branchCode} onChange={update('branchCode')} />
            </>
          ) : (
            <FormField label="Lynk wallet ID / mobile number" required value={form.lynkWalletId} onChange={update('lynkWalletId')} />
          )}
        </>
      )}

      {step === 4 && (
        <>
          <DocUploadField label="Government ID photo" required value={files.govId} onChange={updateFile('govId')} />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={form.slaAccepted} onChange={update('slaAccepted')} className="mt-0.5" />
            I confirm the information provided is accurate and I agree to IsleVendor's Vendor SLA.
          </label>
        </>
      )}
    </OnboardingShell>
  );
}
