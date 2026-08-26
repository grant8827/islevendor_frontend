import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../api/client.js';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import ApplyToDeliverPanel from './ApplyToDeliverPanel.jsx';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);

  const loadApplications = useCallback(() => {
    if (!user.driverProfile) return;
    apiRequest('/delivery-applications/mine').then(setApplications);
  }, [user.driverProfile]);

  useEffect(loadApplications, [loadApplications]);

  // Registered as DRIVER but hasn't gone through the courier onboarding
  // wizard yet (see DriverProfile — only /join/driver creates one) — same
  // "create your X first" gate as the warehouse/shop dashboards.
  if (!user.driverProfile) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardTopBar title="Driver Portal" />
        <div className="p-8 max-w-md">
          <Truck className="w-8 h-8 text-amazon-yellow mb-3" />
          <h2 className="font-bold text-white text-lg mb-2">Finish your driver application</h2>
          <p className="text-sm text-slate-400 mb-5">
            Complete the courier onboarding form before you can apply to deliver for a warehouse or store.
          </p>
          <Link
            to="/join/driver"
            className="inline-block bg-amazon-yellow hover:bg-amazon-orange text-slate-950 font-bold text-sm px-5 py-2.5 rounded-lg transition"
          >
            Complete Driver Application
          </Link>
        </div>
      </div>
    );
  }

  const items = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'apply', label: 'Apply to Deliver', icon: Truck, badge: applications.filter((a) => a.status === 'PENDING').length },
  ];

  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <DashboardTopBar title="Driver Portal" />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-slate-100">
          {activeTab === 'overview' && (
            <div>
              <h2 className="font-bold text-white text-lg mb-4">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                  <p className="text-xs text-slate-400">Application status</p>
                  <p className="text-white font-bold mt-1">{user.driverProfile.applicantStatus.replaceAll('_', ' ')}</p>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                  <p className="text-xs text-slate-400">Delivering for</p>
                  <p className="text-white font-bold mt-1">{approvedCount} {approvedCount === 1 ? 'place' : 'places'}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'apply' && <ApplyToDeliverPanel onDecision={loadApplications} />}
        </main>
      </div>
    </div>
  );
}
