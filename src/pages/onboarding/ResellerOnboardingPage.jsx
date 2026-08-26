import { useState } from 'react';
import { Store } from 'lucide-react';
import OnboardingShell from '../../components/onboarding/OnboardingShell.jsx';
import FormField from '../../components/onboarding/FormField.jsx';
import CheckboxChipGroup from '../../components/onboarding/CheckboxChipGroup.jsx';
import DocUploadField from '../../components/onboarding/DocUploadField.jsx';
import SuccessScreen from '../../components/onboarding/SuccessScreen.jsx';
import StepFooter from '../../components/onboarding/StepFooter.jsx';
import { useOnboardingForm } from '../../components/onboarding/useOnboardingForm.js';
import { submitResellerApplication } from '../../api/onboarding.js';
import { PARISHES, JM_BANKS } from '../../constants/parishes.js';

const STEPS = ['Create account', 'Reseller identity', 'Sales channels', 'Margin rules', 'Payout destination', 'Verification'];

const PRODUCT_CATEGORIES = ['Fashion', 'Beauty', 'Electronics', 'Home & Kitchen', 'Health & Wellness', 'Groceries', 'Kids & Baby', 'Other'];

function MarkupPreview({ markupPercent }) {
  const wholesale = 1000;
  const profit = Math.round(wholesale * (markupPercent / 100));
  const total = wholesale + profit;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-1.5">
      <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Live preview (example on a J$1,000 wholesale item)</p>
      <div className="flex justify-between"><span className="text-slate-500">Supplier cost</span><span className="font-mono">J${wholesale.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="text-slate-500">Your profit ({markupPercent}%)</span><span className="font-mono text-emerald-600">+J${profit.toLocaleString()}</span></div>
      <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold"><span className="text-slate-700">Customer pays</span><span className="font-mono">J${total.toLocaleString()}</span></div>
    </div>
  );
}

export default function ResellerOnboardingPage() {
  const [slugPreview, setSlugPreview] = useState('');
  const { step, form, files, error, submitting, result, update, updateValue, updateFile, next, back, handleSubmit } = useOnboardingForm({
    stepCount: STEPS.length,
    initialForm: {
      email: '', password: '', fullName: '', phoneNumber: '',
      resellerType: 'INDIVIDUAL_CREATOR', storeName: '', legalName: '', trn: '', contactPhone: '', parish: 'Kingston',
      instagramHandle: '', tiktokHandle: '', primarySalesChannel: 'SOCIAL', targetCategories: [],
      defaultMarkupPercent: 25,
      payoutMethod: 'LYNK_WALLET', bankName: JM_BANKS[0], accountHolderName: '', accountNumber: '', branchCode: '', lynkWalletId: '',
      slaAccepted: false,
    },
    validateStep(i, f, fl) {
      if (i === 0 && (!f.email || !f.password || f.password.length < 8 || !f.fullName || !f.phoneNumber)) {
        return 'Fill in your email, a password (min 8 characters), name, and phone number.';
      }
      if (i === 1 && (!f.storeName || !f.legalName || !f.trn || !f.contactPhone)) return 'Fill in all required reseller identity fields.';
      if (i === 2 && f.targetCategories.length < 1) return 'Select at least one target product category.';
      if (i === 3 && (f.defaultMarkupPercent < 1 || f.defaultMarkupPercent > 100)) return 'Markup must be between 1% and 100%.';
      if (i === 4 && f.payoutMethod === 'BANK' && (!f.accountHolderName || !f.accountNumber || !f.branchCode)) {
        return 'Fill in your bank account details.';
      }
      if (i === 4 && f.payoutMethod === 'LYNK_WALLET' && !f.lynkWalletId) return 'Enter your Lynk wallet ID.';
      if (i === 5) {
        if (!fl.idDoc) return 'Upload your photo ID.';
        if (!f.slaAccepted) return 'You must agree to the anti-fraud reseller SLA to continue.';
      }
      return null;
    },
    submit: (f, fl) => submitResellerApplication(f, { idDoc: fl.idDoc }),
  });

  if (result) {
    return (
      <SuccessScreen
        title="Storefront created!"
        referenceId={result.referenceId}
        note={result.storeSlug ? `Your storefront: islevendor.com/store/${result.storeSlug}` : undefined}
      />
    );
  }

  return (
    <OnboardingShell
      icon={Store}
      title="Reseller partner registration"
      subtitle="Curate warehouse-backed products, set your own markup, and earn automated payouts."
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
          <FormField
            label="Reseller type"
            as="select"
            options={[{ value: 'INDIVIDUAL_CREATOR', label: 'Individual creator' }, { value: 'REGISTERED_BUSINESS', label: 'Registered business' }]}
            value={form.resellerType}
            onChange={update('resellerType')}
          />
          <FormField
            label="Storefront / brand name"
            required
            hint="Your public URL will be islevendor.com/store/{name}"
            value={form.storeName}
            onChange={(e) => {
              update('storeName')(e);
              setSlugPreview(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
            }}
          />
          {slugPreview && <p className="text-[11px] text-slate-500 -mt-2">islevendor.com/store/{slugPreview}</p>}
          <FormField label="Legal name" required value={form.legalName} onChange={update('legalName')} />
          <FormField label="TRN" required placeholder="123-456-789" hint="9 digits, with or without dashes" value={form.trn} onChange={update('trn')} />
          <FormField label="Contact phone" required value={form.contactPhone} onChange={update('contactPhone')} />
          <FormField label="Parish" as="select" options={PARISHES} value={form.parish} onChange={update('parish')} />
        </>
      )}

      {step === 2 && (
        <>
          <FormField label="Instagram / TikTok handle" hint="Optional" value={form.instagramHandle} onChange={update('instagramHandle')} />
          <FormField label="TikTok handle" hint="Optional" value={form.tiktokHandle} onChange={update('tiktokHandle')} />
          <FormField
            label="Primary sales channel"
            as="select"
            options={[{ value: 'SOCIAL', label: 'Social media' }, { value: 'WHATSAPP', label: 'WhatsApp' }, { value: 'WEBSITE', label: 'Website' }, { value: 'POP_UP', label: 'Pop-up' }]}
            value={form.primarySalesChannel}
            onChange={update('primarySalesChannel')}
          />
          <CheckboxChipGroup
            label="Target product categories"
            required
            columns={2}
            options={PRODUCT_CATEGORIES}
            value={form.targetCategories}
            onChange={(v) => updateValue('targetCategories', v)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <label className="block">
            <span className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Markup percentage</span>
              <span className="text-navy font-black text-sm">{form.defaultMarkupPercent}%</span>
            </span>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={form.defaultMarkupPercent}
              onChange={(e) => updateValue('defaultMarkupPercent', Number(e.target.value))}
              className="w-full accent-navy"
            />
            <span className="flex justify-between text-[10px] text-slate-500 mt-1"><span>5%</span><span>50%</span></span>
          </label>
          <MarkupPreview markupPercent={form.defaultMarkupPercent} />
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
          <DocUploadField label="Photo ID (driver's license / passport / voter ID)" required value={files.idDoc} onChange={updateFile('idDoc')} />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={form.slaAccepted} onChange={update('slaAccepted')} className="mt-0.5" />
            I agree to IsleVendor's anti-fraud reseller SLA.
          </label>
        </>
      )}
    </OnboardingShell>
  );
}
