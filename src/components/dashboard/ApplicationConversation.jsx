import { useCallback, useEffect, useRef, useState } from 'react';
import { X, CalendarClock, MapPin, Send } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { getSocket } from '../../lib/socket.js';
import { formatInterview } from '../../lib/interviewFormat.js';

const KIND_LABELS = {
  INTERVIEW_SCHEDULED: 'Interview',
  INFO_REQUESTED: 'More information requested',
  DECISION: 'Decision',
};

// The conversation between a business and a driver who applied to deliver
// for it — opened from the business's Delivery Applications tab or the
// driver's Messages tab. Which side "you" are comes back from the API.
export default function ApplicationConversation({ applicationId, onClose }) {
  const [thread, setThread] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);

  const load = useCallback(() => {
    apiRequest(`/delivery-applications/${applicationId}/messages`)
      .then((data) => {
        setThread(data);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [applicationId]);

  useEffect(load, [load]);

  // New messages arrive live while the conversation is open.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onMessage = ({ applicationId: id }) => id === applicationId && load();
    socket.on('APPLICATION_MESSAGE', onMessage);
    return () => socket.off('APPLICATION_MESSAGE', onMessage);
  }, [applicationId, load]);

  useEffect(() => bottom.current?.scrollIntoView({ block: 'end' }), [thread?.messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await apiRequest(`/delivery-applications/${applicationId}/messages`, { method: 'POST', body: { body: draft.trim() } });
      setDraft('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  const app = thread?.application;
  const otherName = thread ? (thread.side === 'DRIVER' ? app.businessName : app.driverName) : '';
  const closed = app?.status === 'REJECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Conversation with ${otherName}`} className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-lg h-[80vh] flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-navy">{otherName || 'Conversation'}</h2>
            {app?.interviewAt && app.status === 'PENDING' && (
              <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5 text-primary" /> Interview {formatInterview(app.interviewAt)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {app.interviewLocation}
                </span>
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!thread && !error && <p className="text-sm text-slate-500">Loading…</p>}
          {thread?.messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
          {thread?.messages.map((m) => {
            const mine = m.senderSide === thread.side;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${mine ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-900'}`}>
                  {KIND_LABELS[m.kind] && <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${mine ? 'text-white/80' : 'text-primary-dark'}`}>{KIND_LABELS[m.kind]}</p>}
                  {m.body}
                  <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                    {m.sender?.fullName && !mine ? `${m.sender.fullName} · ` : ''}
                    {new Date(m.createdAt).toLocaleString('en-JM', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>

        {closed ? (
          <p className="px-5 py-3 border-t border-slate-200 text-xs text-slate-500">This application was turned down, so the conversation is closed.</p>
        ) : (
          <form onSubmit={send} className="flex gap-2 px-5 py-3 border-t border-slate-200">
            <label htmlFor="conversation-draft" className="sr-only">
              Message
            </label>
            <input
              id="conversation-draft"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              placeholder={`Message ${otherName}`}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary"
            />
            <button type="submit" disabled={sending || !draft.trim()} className="flex items-center gap-1.5 btn-primary text-xs font-bold px-4 rounded-lg disabled:opacity-40">
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
