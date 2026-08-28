import { useState } from 'react';
import { Briefcase, Users, Truck } from 'lucide-react';
import DeliveryApplicationsPanel from '../../components/dashboard/DeliveryApplicationsPanel.jsx';
import VacanciesPanel from './VacanciesPanel.jsx';
import ApplicationsPanel from './ApplicationsPanel.jsx';

const SUBTABS = [
  { key: 'vacancies', label: 'Vacancies', icon: Briefcase },
  { key: 'applicants', label: 'Applicants', icon: Users },
  { key: 'drivers', label: 'Delivery Drivers', icon: Truck },
];

// One "Applications" sidebar entry covering everyone who applies to this
// warehouse — resellers (via the Vacancies you post and the Applicants who
// respond) and drivers (Delivery Drivers) — as sub-tabs, rather than three
// separate top-level sidebar items.
export default function ApplicationsPage({ warehouseId, pendingApplicants, pendingDrivers, onDecision }) {
  const [subTab, setSubTab] = useState('vacancies');

  const badgeFor = (key) => (key === 'applicants' ? pendingApplicants : key === 'drivers' ? pendingDrivers : 0);

  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-4">Applications</h2>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {SUBTABS.map(({ key, label, icon: Icon }) => {
          const badge = badgeFor(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
                subTab === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge > 0 && (
                <span className="bg-primary text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {subTab === 'vacancies' && <VacanciesPanel warehouseId={warehouseId} />}
      {subTab === 'applicants' && <ApplicationsPanel warehouseId={warehouseId} onDecision={onDecision} />}
      {subTab === 'drivers' && <DeliveryApplicationsPanel ownerType="warehouse" ownerId={warehouseId} onDecision={onDecision} />}
    </div>
  );
}
