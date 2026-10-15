import { useCallback, useEffect, useState } from 'react';
import { Truck, Check, X, Eye, CalendarClock, HelpCircle, MessageSquare } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { getSocket } from '../../lib/socket.js';
import { useToast } from '../../context/ToastContext.jsx';
import ViewDriverApplicantModal from './ViewDriverApplicantModal.jsx';
import ApplicationConversation from './ApplicationConversation.jsx';
import { formatInterview } from '../../lib/interviewFormat.js';
import ApplicantActionModal from './ApplicantActionModal.jsx';

const DONE_MESSAGES = {
  interview: 'Interview invitation sent.',
  info: 'Request sent to the driver.',
  APPROVED: 'Driver approved to deliver for you.',
  REJECTED: 'Application turned down.',
};

const buttonClass = 'flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-primary/10 text-primary-dark border-primary/30',
  SUSPENDED: 'bg-amber-100 text-amber-700 border-amber-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

// Owner-side review of driver applications — mirrors warehouse/ApplicationsPanel.jsx
// (the reseller-affiliate equivalent), shared between the warehouse and shop
// dashboards since a delivery application can target either. Before
// deciding, a business can invite the driver to an in-person interview or
// ask for more information; every step reaches the driver as a message, and
// the two can talk in the application's conversation.
// `defaultLocation` pre-fills where an interview is held.
export default function DeliveryApplicationsPanel({ ownerType, ownerId, onDecision, defaultLocation = '' }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingApp, setViewingApp] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [action, setAction] = useState(null); // { application, action }
  const { notify } = useToast();

  const load = useCallback(() => {
    apiRequest(`/${ownerType}/${ownerId}/delivery-applications`)
      .then(setApplications)
      .finally(() => setLoading(false));
  }, [ownerType, ownerId]);

  useEffect(load, [load]);

  // A driver's reply bumps the unread count without a refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    socket.on('APPLICATION_MESSAGE', load);
    return () => socket.off('APPLICATION_MESSAGE', load);
  }, [load]);

  function handleDone(done) {
    notify(DONE_MESSAGES[done]);
    setAction(null);
    load();
    if (done === 'APPROVED' || done === 'REJECTED') onDecision?.();
  }

  function closeConversation() {
    setConversationId(null);
    load();
  }

  const messagesButton = (app) => (
    <button type="button" onClick={() => setConversationId(app.id)} className={`${buttonClass} bg-slate-100 hover:bg-slate-200 text-slate-700`}>
      <MessageSquare className="w-3.5 h-3.5" /> Messages
      {app.unreadMessages > 0 && <span className="ml-1 bg-primary text-white text-[10px] font-black rounded-full px-1.5">{app.unreadMessages}</span>}
    </button>
  );

  const pending = applications.filter((a) => a.status === 'PENDING');
  const decided = applications.filter((a) => a.status !== 'PENDING');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Delivery Applications</h2>
          <p className="text-xs text-slate-500">Interview drivers, ask them questions, and approve the ones you want as your couriers.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && pending.length === 0 && decided.length === 0 && (
        <p className="text-sm text-slate-500">No applications yet.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Pending ({pending.length})</h3>
          {pending.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{app.driver.user.fullName}</p>
                  <p className="text-xs text-slate-500">{app.driver.user.phoneNumber} · requested {new Date(app.requestedAt).toLocaleDateString()}</p>
                </div>
                {app.interviewAt ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                    <CalendarClock className="w-3.5 h-3.5" /> Interview {formatInterview(app.interviewAt)}
                  </span>
                ) : app.infoRequestedAt ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">More info requested</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setViewingApp(app)} className={`${buttonClass} bg-slate-100 hover:bg-slate-200 text-slate-700`}>
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
                {messagesButton(app)}
                <button type="button" onClick={() => setAction({ application: app, action: 'interview' })} className={`${buttonClass} bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200`}>
                  <CalendarClock className="w-3.5 h-3.5" /> {app.interviewAt ? 'Reschedule' : 'Interview'}
                </button>
                <button type="button" onClick={() => setAction({ application: app, action: 'info' })} className={`${buttonClass} bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200`}>
                  <HelpCircle className="w-3.5 h-3.5" /> Ask for info
                </button>
                <button type="button" onClick={() => setAction({ application: app, action: 'APPROVED' })} className={`${buttonClass} btn-primary`}>
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button type="button" onClick={() => setAction({ application: app, action: 'REJECTED' })} className={`${buttonClass} bg-red-50 hover:bg-red-100 text-red-700 border border-red-200`}>
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">History</h3>
          {decided.map((app) => (
            <div key={app.id} className="flex items-center justify-between gap-2 text-xs py-2 border-b border-slate-100">
              <button type="button" onClick={() => setViewingApp(app)} className="text-slate-700 hover:underline text-left">
                {app.driver.user.fullName}
              </button>
              <span className="flex items-center gap-2">
                {messagesButton(app)}
                <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLES[app.status]}`}>{app.status}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {viewingApp && <ViewDriverApplicantModal application={viewingApp} onClose={() => setViewingApp(null)} />}
      {conversationId && <ApplicationConversation applicationId={conversationId} onClose={closeConversation} />}
      {action && (
        <ApplicantActionModal
          application={action.application}
          action={action.action}
          defaultLocation={defaultLocation}
          onClose={() => setAction(null)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
