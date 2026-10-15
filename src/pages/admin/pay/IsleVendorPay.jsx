import { useState } from 'react';
import AdminPayoutsPanel from '../AdminPayoutsPanel.jsx';
import AuditLogPanel from '../AuditLogPanel.jsx';
import PayOverview from './PayOverview.jsx';
import PayGateways from './PayGateways.jsx';
import WiPayConfig from './WiPayConfig.jsx';
import GatewayLinks from './GatewayLinks.jsx';
import PayTransactions from './PayTransactions.jsx';
import PayCommissions from './PayCommissions.jsx';
import VendorEarnings from './VendorEarnings.jsx';
import RefundsPanel from './RefundsPanel.jsx';
import FinancialReports from './FinancialReports.jsx';

const SECTIONS = [
  { key: 'overview', label: 'Payment Overview' },
  { key: 'gateways', label: 'Payment Gateways' },
  { key: 'wipay', label: 'WiPay Configuration' },
  { key: 'links', label: 'Gateway Links' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'commissions', label: 'Marketplace Commissions' },
  { key: 'earnings', label: 'Vendor Earnings' },
  { key: 'withdrawals', label: 'Vendor Withdrawals' },
  { key: 'refunds', label: 'Refunds and Chargebacks' },
  { key: 'reports', label: 'Financial Reports' },
  { key: 'audit', label: 'Audit Logs' },
];

// IsleVendor Pay: the Superadmin's payment section — part of the same admin
// console, with its own menu of money pages (backend: modules/admin/pay.routes.ts).
export default function IsleVendorPay() {
  const [section, setSection] = useState('overview');
  return (
    <div className="flex flex-col lg:flex-row gap-6 min-w-0">
      <nav aria-label="IsleVendor Pay" className="lg:w-56 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-3">IsleVendor Pay</p>
        <ul className="flex lg:flex-col gap-1 overflow-x-auto">
          {SECTIONS.map(({ key, label }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => setSection(key)}
                aria-current={section === key ? 'page' : undefined}
                className={`w-full text-left whitespace-nowrap text-sm px-3 py-2 rounded-lg transition ${
                  section === key ? 'bg-white shadow-sm border border-slate-200 font-bold text-navy' : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 min-w-0">
        {section === 'overview' && <PayOverview onOpen={setSection} />}
        {section === 'gateways' && <PayGateways />}
        {section === 'wipay' && <WiPayConfig />}
        {section === 'links' && <GatewayLinks />}
        {section === 'transactions' && <PayTransactions />}
        {section === 'commissions' && <PayCommissions />}
        {section === 'earnings' && <VendorEarnings />}
        {section === 'withdrawals' && <AdminPayoutsPanel show="queue" />}
        {section === 'refunds' && <RefundsPanel />}
        {section === 'reports' && <FinancialReports />}
        {section === 'audit' && <AuditLogPanel category="finance" />}
      </div>
    </div>
  );
}
