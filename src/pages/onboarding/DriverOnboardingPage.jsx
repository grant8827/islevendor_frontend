import { Truck } from 'lucide-react';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import FormField from '../../components/onboarding/FormField.jsx';
import CheckboxChipGroup from '../../components/onboarding/CheckboxChipGroup.jsx';
import DocUploadField from '../../components/onboarding/DocUploadField.jsx';
import SuccessScreen from '../../components/onboarding/SuccessScreen.jsx';
import StepFooter from '../../components/onboarding/StepFooter.jsx';
import { useOnboardingForm } from '../../components/onboarding/useOnboardingForm.js';
import { submitDriverApplication } from '../../api/onboarding.js';
import { PARISHES, JM_BANKS } from '../../constants/parishes.js';

const STEPS = ['Create account', 'Driver profile', 'Vehicle & routes', 'Availability & payout', 'Verification documents'];

const VEHICLE_TYPES = [
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'CARGO_VAN', label: 'Cargo van' },
  { value: 'BOX_TRUCK', label: 'Box truck' },
];

export default function DriverOnboardingPage() {
  const { step, form, files, error, submitting, result, update, updateValue, updateFile, next, back, handleSubmit } = useOnboardingForm({
    stepCount: STEPS.length,
    initialForm: {
      email: '', password: '', fullName: '', phoneNumber: '',
      trn: '', whatsappNumber: '', homeParish: 'Kingston', homeTown: '',
      vehicleType: 'MOTORCYCLE', vehicleMake: '', vehicleModel: '', vehicleYear: '', licensePlate: '', hasColdBox: false,
      zoneParishes: ['Kingston'],
      availability: 'FULL_TIME',
      payoutMethod: 'LYNK_WALLET', bankName: JM_BANKS[0], accountHolderName: '', accountNumber: '', branchCode: '', lynkWalletId: '',
    },
    validateStep(i, f, fl) {
      if (i === 0 && (!f.email || !f.password || f.password.length < 8 || !f.fullName || !f.phoneNumber)) {
        return 'Fill in your email, a password (min 8 characters), name, and phone number.';
      }
      if (i === 1 && (!f.trn || !f.whatsappNumber || !f.homeTown)) return 'Fill in all required driver profile fields.';
      if (i === 2) {
        if (!f.vehicleMake || !f.vehicleModel || !f.vehicleYear || !f.licensePlate) return 'Fill in all required vehicle fields.';
        if (f.zoneParishes.length < 1) return 'Select at least one operating zone parish.';
      }
      if (i === 3 && f.payoutMethod === 'BANK' && (!f.accountHolderName || !f.accountNumber || !f.branchCode)) {
        return 'Fill in your bank account details.';
      }
      if (i === 3 && f.payoutMethod === 'LYNK_WALLET' && !f.lynkWalletId) return 'Enter your Lynk wallet ID.';
      if (i === 4 && (!fl.licensePhoto || !fl.insuranceCert)) return "Upload your driver's license and vehicle insurance/fitness certificate.";
      return null;
    },
    submit: (f, fl) => submitDriverApplication(f, { licensePhoto: fl.licensePhoto, insuranceCert: fl.insuranceCert, fitnessCert: fl.fitnessCert }),
  });

  if (result) {
    return (
      <SuccessScreen
        title="Application submitted!"
        referenceId={result.referenceId}
        note="Download the IsleVendor Driver app to track your application and start accepting routes once approved."
        dashboardCta="Go to your dashboard"
      />
    );
  }

  return (
    <OnboardingShell
      icon={Truck}
      title="Delivery courier & fleet driver onboarding"
      subtitle="Accept proximity-based delivery routes and earn automated payouts per dispatch."
      steps={STEPS}
      currentStep={step}
      error={error}
      footer={<StepFooter step={step} lastStep={STEPS.length - 1} submitting={submitting} onBack={back} onNext={next} onSubmit={handleSubmit} />}
    >
      {step === 0 && (
        <>
          <FormField label="Legal name" required value={form.fullName} onChange={update('fullName')} />
          <FormField label="Email" type="email" required value={form.email} onChange={update('email')} />
          <FormField label="Phone number" required value={form.phoneNumber} onChange={update('phoneNumber')} />
          <FormField label="Password" type="password" minLength={8} hint="Min 8 characters" required value={form.password} onChange={update('password')} />
        </>
      )}

      {step === 1 && (
        <>
          <FormField label="TRN" required placeholder="123-456-789" hint="9 digits, with or without dashes" value={form.trn} onChange={update('trn')} />
          <FormField label="WhatsApp number" required value={form.whatsappNumber} onChange={update('whatsappNumber')} />
          <FormField label="Home parish" as="select" options={PARISHES} value={form.homeParish} onChange={update('homeParish')} />
          <FormField label="Home town" required value={form.homeTown} onChange={update('homeTown')} />
        </>
      )}

      {step === 2 && (
        <>
          <FormField label="Vehicle type" as="select" options={VEHICLE_TYPES} value={form.vehicleType} onChange={update('vehicleType')} />
          <FormField label="Make" required value={form.vehicleMake} onChange={update('vehicleMake')} />
          <FormField label="Model" required value={form.vehicleModel} onChange={update('vehicleModel')} />
          <FormField label="Year" type="number" min={1980} required value={form.vehicleYear} onChange={update('vehicleYear')} />
          <FormField label="License plate #" required value={form.licensePlate} onChange={update('licensePlate')} />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={form.hasColdBox} onChange={update('hasColdBox')} />
            My vehicle has a thermal insulated cold box (for perishable/temperature-sensitive dispatches)
          </label>
          <CheckboxChipGroup
            label="Operating zone parishes"
            required
            columns={3}
            options={PARISHES}
            value={form.zoneParishes}
            onChange={(v) => updateValue('zoneParishes', v)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <FormField
            label="Availability"
            as="select"
            options={[{ value: 'FULL_TIME', label: 'Full-time' }, { value: 'PART_TIME', label: 'Part-time' }, { value: 'WEEKEND', label: 'Weekend' }]}
            value={form.availability}
            onChange={update('availability')}
          />
          <FormField label="Payout method" as="select" options={[{ value: 'LYNK_WALLET', label: 'Lynk wallet' }, { value: 'BANK', label: 'Jamaican commercial bank' }]} value={form.payoutMethod} onChange={update('payoutMethod')} />
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
          <DocUploadField label="Valid Jamaican driver's license photo" required value={files.licensePhoto} onChange={updateFile('licensePhoto')} />
          <DocUploadField label="Vehicle certificate of fitness / insurance" required value={files.insuranceCert} onChange={updateFile('insuranceCert')} />
          <DocUploadField label="Certificate of fitness (if separate from insurance)" hint="Optional" value={files.fitnessCert} onChange={updateFile('fitnessCert')} />
        </>
      )}
    </OnboardingShell>
  );
}
