import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleX, PlugZap } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDateTime, inputClass } from '../adminFormat.js';
import { PasswordConfirm, SectionTitle } from './payShared.jsx';

const FEE_LABELS = {
  merchant_absorb: 'IsleVendor pays the card fee',
  customer_pay: 'The customer pays the card fee',
  split: 'Shared between IsleVendor and the customer',
};

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 font-semibold text-right break-all">{children ?? <span className="text-amber-700">Not set</span>}</span>
    </div>
  );
}

const Secret = ({ set }) => (set ? <span className="text-primary-dark">Set</span> : <span className="text-amber-700">Not set</span>);

// WiPay's settings as the payment code uses them. Keys and secrets live only
// in the deployment's environment — this page shows whether each is set,
// never its value, and can't change them.
export default function WiPayConfig() {
  const { notify } = useToast();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [fee, setFee] = useState(null);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState(null);

  const load = useCallback(() => {
    apiRequest('/admin/pay/wipay')
      .then(setConfig)
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  async function runTest() {
    setTesting(true);
    try {
      setTest(await apiRequest('/admin/pay/wipay/test', { method: 'POST' }));
    } catch (err) {
      notify(err.message);
    } finally {
      setTesting(false);
    }
  }

  if (error) return <p className="text-sm text-red-600" role="alert">{error}</p>;
  if (!config) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <SectionTitle
        title="WiPay configuration"
        description="Addresses, merchant account and keys come from the deployment's environment (Railway), so a dashboard can never redirect payments. Secrets are never shown here — only whether each is set."
      />

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
        <h3 className="font-bold text-navy text-sm mb-2">Card payments</h3>
        <Row label="Environment">{config.environment}</Row>
        <Row label="Merchant account">{config.merchantAccount}</Row>
        <Row label="Hosted checkout">{config.paymentUrl}</Row>
        <Row label="Customer return">{config.responseUrl}</Row>
        <Row label="Country · currency">{`${config.countryCode} · ${config.currency}`}</Row>
        <Row label="Origin">{config.origin}</Row>
        <Row label="API key (verifies payments)"><Secret set={config.secrets.apiKey} /></Row>
        <Row label="Payments webhook secret"><Secret set={config.secrets.paymentsWebhookSecret} /></Row>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
        <h3 className="font-bold text-navy text-sm mb-1">Who pays the card fee</h3>
        <p className="text-xs text-slate-500 mb-3">
          Applies to payments started from now on. The deployment's default is "{FEE_LABELS[config.feeStructure.fromEnvironment]}".
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Card fee" className={inputClass} value={config.feeStructure.adminOverride ?? ''} onChange={(e) => setFee(e.target.value || null)}>
            <option value="">Use the deployment's default</option>
            {Object.entries(FEE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-600">Now: {FEE_LABELS[config.feeStructure.effective]}</span>
        </div>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
        <h3 className="font-bold text-navy text-sm mb-2">Automatic payouts</h3>
        <Row label="Withdrawal API">{config.payoutApiUrl}</Row>
        <Row label="WAPI key"><Secret set={config.secrets.payoutApiKey} /></Row>
        <Row label="Payout webhook secret"><Secret set={config.secrets.payoutWebhookSecret} /></Row>
        <Row label="Payout details encryption key"><Secret set={config.secrets.payoutDataKey} /></Row>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-navy text-sm">Connection test</h3>
            <p className="text-xs text-slate-500">Checks WiPay can be reached with these settings. Nothing is charged and no checkout is created.</p>
          </div>
          <button type="button" onClick={runTest} disabled={testing} className="flex items-center gap-1.5 btn-primary text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-40">
            <PlugZap className="w-4 h-4" /> {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>
        {test && (
          <ul className="mt-4 space-y-2 text-sm">
            {test.results.map((r) => (
              <li key={r.name} className="flex items-start gap-2">
                {r.ok ? <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> : <CircleX className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                <span>
                  <span className="font-bold">{r.name}</span> — <span className="text-slate-600">{r.detail}</span>
                </span>
              </li>
            ))}
            <li className="text-[11px] text-slate-400">Tested {formatDateTime(test.testedAt)}</li>
          </ul>
        )}
      </section>

      {fee !== null && fee !== (config.feeStructure.adminOverride ?? '') && (
        <PasswordConfirm
          title="Change who pays the card fee"
          summary={fee ? FEE_LABELS[fee] : `Use the deployment's default (${FEE_LABELS[config.feeStructure.fromEnvironment]})`}
          onClose={() => setFee(null)}
          onConfirm={async (currentPassword) => {
            await apiRequest('/admin/pay/wipay', { method: 'PATCH', body: { feeStructure: fee || null, currentPassword } });
            notify('Card fee setting saved.');
            setFee(null);
            load();
          }}
        />
      )}
    </div>
  );
}
