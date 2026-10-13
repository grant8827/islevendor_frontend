import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Users, ListOrdered, ScrollText, UserRound } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar.jsx';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar.jsx';
import ProfilePanel from '../../components/dashboard/ProfilePanel.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import ApplicantsPanel from './ApplicantsPanel.jsx';
import UsersPanel from './UsersPanel.jsx';
import AdminOrdersPanel from './AdminOrdersPanel.jsx';
import AuditLogPanel from './AuditLogPanel.jsx';

// Mounted at the protected /admin route (see App.jsx). This check only
// decides what to *show* — every /api/admin route independently confirms the
// caller is a current administrator, so a tampered client gets empty panels
// and 403s, not data.
export default function AdminApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const isAdmin = user.role === 'ADMIN';

  const loadOverview = useCallback(() => {
    if (!isAdmin) return;
    apiRequest('/admin/overview')
      .then((data) => {
        setOverview(data);
        setOverviewError(null);
      })
      .catch((err) => setOverviewError(err.message));
  }, [isAdmin]);

  useEffect(loadOverview, [loadOverview]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-bold text-navy text-lg mb-2">Administrators only</h1>
          <p className="text-sm text-slate-500 mb-4">This account ({user.role.toLowerCase()}) doesn't have access to the admin console.</p>
          <Link to="/dashboard" className="text-primary hover:underline text-sm font-bold">
            Go to your dashboard instead
          </Link>
        </div>
      </div>
    );
  }

  const pendingTotal = overview ? Object.values(overview.pendingApplicants).reduce((sum, n) => sum + n, 0) : 0;
  const items = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'applicants', label: 'Applicants', icon: ClipboardCheck, badge: pendingTotal },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'orders', label: 'Orders', icon: ListOrdered },
    { key: 'audit', label: 'Audit Log', icon: ScrollText },
    { key: 'profile', label: 'Profile', icon: UserRound, bottom: true },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <DashboardTopBar title="Admin Console" />
      <div className="flex flex-1">
        <DashboardSidebar items={items} active={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 p-8 text-ink min-w-0">
          {activeTab === 'overview' && <OverviewPanel overview={overview} error={overviewError} onRetry={loadOverview} onOpenApplicants={() => setActiveTab('applicants')} />}
          {activeTab === 'applicants' && <ApplicantsPanel onDecision={loadOverview} />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'orders' && <AdminOrdersPanel />}
          {activeTab === 'audit' && <AuditLogPanel />}
          {activeTab === 'profile' && <ProfilePanel />}
        </main>
      </div>
    </div>
  );
}
