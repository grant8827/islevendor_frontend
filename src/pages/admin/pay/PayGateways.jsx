import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Banknote, Hand } from 'lucide-react';
import { apiRequest } from '../../../api/client.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { Badge, ListState } from '../adminShared.jsx';
import { PasswordConfirm, SectionTitle } from './payShared.jsx';

const ICONS = { 'wipay-payments': CreditCard, 'wipay-payouts': Banknote, 'manual-payouts': Hand };
const SWITCH = { 'wipay-payments': 'paymentsEnabled', 'wipay-payouts': 'automatedPayoutsEnabled' };

// Each gateway has two switches: the deployment's (environment, changed by a
// redeploy) and the admin's here, which can pause it instantly but never
// turn on what the deployment has off.
export default function PayGateways() {
  const { notify } = useToast();
  const [gateways, setGateways] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null); // { gateway, on }

  const load = useCallback(() => {
    apiRequest('/admin/pay/gateways')
      .then(setGateways)
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="max-w-4xl">
      <SectionTitle
        title="Payment gateways"
        description="What IsleVendor can take and send money through. A gateway runs only when the deployment allows it and it isn't paused here — pausing takes effect at once."
      />
      <ListState rows={gateways} error={error} onRetry={load} emptyMessage="No gateways." />
      <div className="space-y-3">
        {gateways?.map((g) => {
          const Icon = ICONS[g.id] ?? CreditCard;
          const field = SWITCH[g.id];
          return (
            <div key={g.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <Icon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-2">
                    {g.name}
                    <Badge className={g.active ? 'bg-primary/10 text-primary-dark border-primary/30' : 'bg-slate-100 text-slate-600 border-slate-300'}>{g.active ? 'Active' : 'Off'}</Badge>
                    {g.environment && <Badge>{g.environment}</Badge>}
                  </p>
                  {field && (
                    <p className="text-xs text-slate-500 mt-1">
                      Deployment: {g.deployEnabled ? 'allowed' : 'switched off'} · Here: {g.adminEnabled ? 'on' : 'paused'}
                      {g.id === 'wipay-payouts' && ` · Live use ${g.liveAuthorized ? 'authorised' : 'not yet authorised by WiPay'}`}
                    </p>
                  )}
                  {g.missing.length > 0 && <p className="text-xs text-amber-700 mt-1">Not configured: {g.missing.join(', ')}</p>}
                </div>
              </div>
              {field && (
                <button
                  type="button"
                  onClick={() => setPending({ gateway: g, on: !g.adminEnabled })}
                  className={`text-xs font-bold px-4 py-2 rounded-lg border ${g.adminEnabled ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-primary text-primary-dark hover:bg-primary/5'}`}
                >
                  {g.adminEnabled ? 'Pause' : 'Resume'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {pending && (
        <PasswordConfirm
          title={`${pending.on ? 'Resume' : 'Pause'} ${pending.gateway.name.toLowerCase()}`}
          summary={
            pending.on
              ? pending.gateway.deployEnabled
                ? 'It will start working again straight away.'
                : 'It stays off until the deployment allows it as well.'
              : pending.gateway.id === 'wipay-payments'
                ? 'Customers can still place orders but won’t be able to pay until you resume. Payments already under way are still confirmed.'
                : 'Admins will pay withdrawals by hand until you resume.'
          }
          confirmLabel={pending.on ? 'Resume' : 'Pause'}
          onClose={() => setPending(null)}
          onConfirm={async (currentPassword) => {
            await apiRequest('/admin/pay/gateways', { method: 'PATCH', body: { [SWITCH[pending.gateway.id]]: pending.on, currentPassword } });
            notify(`${pending.gateway.name} ${pending.on ? 'resumed' : 'paused'}.`);
            setPending(null);
            load();
          }}
        />
      )}
    </div>
  );
}
