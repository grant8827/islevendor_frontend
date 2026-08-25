import { Warehouse } from 'lucide-react';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import FormField from '../../components/onboarding/FormField.jsx';
import CheckboxChipGroup from '../../components/onboarding/CheckboxChipGroup.jsx';
import DocUploadField from '../../components/onboarding/DocUploadField.jsx';
import SuccessScreen from '../../components/onboarding/SuccessScreen.jsx';
import StepFooter from '../../components/onboarding/StepFooter.jsx';
import { useOnboardingForm } from '../../components/onboarding/useOnboardingForm.js';
import { submitWarehouseApplication } from '../../api/onboarding.js';
import { PARISHES, JM_BANKS } from '../../constants/parishes.js';

const STEPS = ['Create account', 'Facility & entity', 'Location & coverage', 'Specs & capabilities', 'Payout banking', 'Verification & SLA'];

const STORAGE_TYPES = ['Ambient', 'Refrigerated', 'Deep Freeze', 'Vault', 'Hazmat'];
const SECURITY_CONTROLS = ['CCTV', 'Guards', 'Racking'];

export default function WarehouseOnboardingPage() {
  const { step, form, files, error, submitting, result, update, updateValue, updateFile, next, back, handleSubmit } = useOnboardingForm({
    stepCount: STEPS.length,
    initialForm: {
      email: '', password: '', fullName: '', phoneNumber: '',
      hubName: '', legalBusinessName: '', trn: '', gctNumber: '', contactName: '', contactPhone: '', contactEmail: '',
      addressLine: '', town: '', parish: 'Kingston', coverageParishes: ['Kingston'],
      storageSqFt: '', loadingBayCount: '', operatingHours: '', storageTypes: [], securityControls: [],
      payoutMethod: 'BANK', bankName: JM_BANKS[0], accountHolderName: '', accountNumber: '', branchCode: '', lynkWalletId: '',
      slaAccepted: false,
    },
    validateStep(i, f, fl) {
      if (i === 0 && (!f.email || !f.password || f.password.length < 8 || !f.fullName || !f.phoneNumber)) {
        return 'Fill in your email, a password (min 8 characters), name, and phone number.';
      }
      if (i === 1 && (!f.hubName || !f.legalBusinessName || !f.trn || !f.contactName || !f.contactPhone)) {
        return 'Fill in all required facility & entity fields.';
      }
      if (i === 2) {
        if (!f.addressLine || !f.town) return 'Fill in your address and town.';
        if (f.coverageParishes.length < 1) return 'Select at least one coverage parish.';
      }
      if (i === 3 && (!f.storageSqFt || f.loadingBayCount === '' || !f.operatingHours)) {
        return 'Fill in your storage capacity, loading bays, and operating hours.';
      }
      if (i === 4 && f.payoutMethod === 'BANK' && (!f.accountHolderName || !f.accountNumber || !f.branchCode)) {
        return 'Fill in your bank account details.';
      }
      if (i === 4 && f.payoutMethod === 'LYNK_WALLET' && !f.lynkWalletId) return 'Enter your Lynk wallet ID.';
      if (i === 5) {
        if (!fl.cocjDoc || !fl.trnCard || !fl.proofOfAddress) return 'Upload all three verification documents.';
        if (!f.slaAccepted) return 'You must accept the inventory liability agreement to continue.';
      }
      return null;
    },
    submit: (f, fl) => submitWarehouseApplication(f, { cocjDoc: fl.cocjDoc, trnCard: fl.trnCard, proofOfAddress: fl.proofOfAddress }),
  });

  if (result) {
    return (
      <SuccessScreen
        title="Application received!"
        referenceId={result.referenceId}
        note="An admin will verify your documents before your hub goes live for stock intake."
      />
    );
  }

  return (
    <OnboardingShell
      icon={Warehouse}
      title="Warehouse hub registration"
      subtitle="Register your facility to store vendor inventory and handle local fulfillment."
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
          <FormField label="Hub name" required value={form.hubName} onChange={update('hubName')} />
          <FormField label="Legal business name" required value={form.legalBusinessName} onChange={update('legalBusinessName')} />
          <FormField label="TRN" required placeholder="123-456-789" hint="9 digits, with or without dashes" value={form.trn} onChange={update('trn')} />
          <FormField label="GCT number" hint="Optional" value={form.gctNumber} onChange={update('gctNumber')} />
          <FormField label="Primary operational contact name" required value={form.contactName} onChange={update('contactName')} />
          <FormField label="Contact phone" required value={form.contactPhone} onChange={update('contactPhone')} />
          <FormField label="Contact email" type="email" hint="Optional" value={form.contactEmail} onChange={update('contactEmail')} />
        </>
      )}

      {step === 2 && (
        <>
          <FormField label="Street address" required value={form.addressLine} onChange={update('addressLine')} />
          <FormField label="Town / city" required value={form.town} onChange={update('town')} />
          <FormField label="Primary parish" as="select" options={PARISHES} value={form.parish} onChange={update('parish')} />
          <CheckboxChipGroup
            label="Delivery parish coverage"
            required
            columns={3}
            options={PARISHES}
            value={form.coverageParishes}
            onChange={(v) => updateValue('coverageParishes', v)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <FormField label="Storage area (sq ft)" type="number" min={1} required value={form.storageSqFt} onChange={update('storageSqFt')} />
          <FormField label="Loading bay count" type="number" min={0} required value={form.loadingBayCount} onChange={update('loadingBayCount')} />
          <FormField label="Operating hours" required placeholder="Mon–Sat 7am–6pm" value={form.operatingHours} onChange={update('operatingHours')} />
          <CheckboxChipGroup label="Storage types" columns={3} options={STORAGE_TYPES} value={form.storageTypes} onChange={(v) => updateValue('storageTypes', v)} />
          <CheckboxChipGroup label="Security controls" columns={3} options={SECURITY_CONTROLS} value={form.securityControls} onChange={(v) => updateValue('securityControls', v)} />
        </>
      )}

      {step === 4 && (
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

      {step === 5 && (
        <>
          <DocUploadField label="COCJ business registration document" required value={files.cocjDoc} onChange={updateFile('cocjDoc')} />
          <DocUploadField label="TRN card" required value={files.trnCard} onChange={updateFile('trnCard')} />
          <DocUploadField label="Proof of address (JPS / NWC bill)" required value={files.proofOfAddress} onChange={updateFile('proofOfAddress')} />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={form.slaAccepted} onChange={update('slaAccepted')} className="mt-0.5" />
            I agree to IsleVendor's inventory liability agreement and warehouse SLA.
          </label>
        </>
      )}
    </OnboardingShell>
  );
}
