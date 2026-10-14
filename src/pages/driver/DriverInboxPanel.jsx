import { useState } from 'react';
import { MessageSquare, CalendarClock, MapPin } from 'lucide-react';
import ApplicationConversation from '../../components/dashboard/ApplicationConversation.jsx';
import { formatInterview } from '../../lib/interviewFormat.js';

const STATUS_COPY = {
  PENDING: 'Application pending',
  APPROVED: 'Delivering for them',
  SUSPENDED: 'Paused',
  REJECTED: 'Not accepted',
};

// The driver's messages from every business they applied to — interview
// invitations, requests for more information, decisions — newest first.
// `applications` is GET /delivery-applications/mine; `onChange` reloads it
// after a conversation is read or answered.
export default function DriverInboxPanel({ applications, onChange }) {
  const [openId, setOpenId] = useState(null);
  const withMessages = applications
    .filter((a) => a.lastMessage)
    .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Messages</h2>
          <p className="text-xs text-slate-500">Interview invitations, questions and decisions from businesses you applied to.</p>
        </div>
      </div>

      {withMessages.length === 0 && <p className="text-sm text-slate-500">No messages yet. When a business invites you to an interview or asks you something, it shows up here.</p>}

      <div className="space-y-3">
        {withMessages.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setOpenId(a.id)}
            className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm hover:border-slate-300 transition ${a.unreadMessages > 0 ? 'border-primary' : 'border-slate-200'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{a.warehouse?.name ?? a.shop?.shopName}</p>
                <p className="text-xs text-slate-500">{STATUS_COPY[a.status]}</p>
              </div>
              {a.unreadMessages > 0 && (
                <span className="shrink-0 bg-primary text-white text-[10px] font-black rounded-full px-2 py-0.5">{a.unreadMessages} new</span>
              )}
            </div>
            {a.status === 'PENDING' && a.interviewAt && (
              <p className="text-xs text-sky-700 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> Interview {formatInterview(a.interviewAt)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {a.interviewLocation}
                </span>
              </p>
            )}
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">{a.lastMessage.body}</p>
          </button>
        ))}
      </div>

      {openId && (
        <ApplicationConversation
          applicationId={openId}
          onClose={() => {
            setOpenId(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}
