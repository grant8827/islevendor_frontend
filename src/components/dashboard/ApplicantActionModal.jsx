import { useState } from 'react';
import { X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';

const inputClass = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary';

// "YYYY-MM-DDTHH:mm" for a <input type="datetime-local"> min, in local time.
const localInputValue = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const ACTIONS = {
  interview: { title: 'Schedule an in-person interview', submit: 'Send invitation' },
  info: { title: 'Ask for more information', submit: 'Send request' },
  APPROVED: { title: 'Approve this driver', submit: 'Approve' },
  REJECTED: { title: 'Turn down this application', submit: 'Turn down' },
};

// The business's actions on a driver's application, each of which sends the
// driver a message: invite them to an interview, ask for more information,
// or decide (with an optional note). `action` is one of the ACTIONS keys.
export default function ApplicantActionModal({ application, action, defaultLocation = '', onClose, onDone }) {
  const [interviewAt, setInterviewAt] = useState(application.interviewAt ? localInputValue(new Date(application.interviewAt)) : '');
  const [location, setLocation] = useState(application.interviewLocation ?? defaultLocation);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { title, submit } = ACTIONS[action];
  const driverName = application.driver.user.fullName;

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const id = application.id;
      if (action === 'interview') {
        await apiRequest(`/delivery-applications/${id}/interview`, {
          method: 'POST',
          body: { interviewAt: new Date(interviewAt).toISOString(), location, ...(text.trim() ? { note: text.trim() } : {}) },
        });
      } else if (action === 'info') {
        await apiRequest(`/delivery-applications/${id}/request-info`, { method: 'POST', body: { message: text.trim() } });
      } else {
        await apiRequest(`/delivery-applications/${id}`, { method: 'PATCH', body: { status: action, ...(text.trim() ? { message: text.trim() } : {}) } });
      }
      onDone(action);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form onSubmit={save} role="dialog" aria-modal="true" aria-label={title} className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-navy">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{driverName} will get this as a message.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        {action === 'interview' && (
          <>
            <label className="block text-xs text-slate-600">
              Date and time
              <input type="datetime-local" required min={localInputValue(new Date())} className={`${inputClass} mt-1`} value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
            </label>
            <label className="block text-xs text-slate-600">
              Where
              <input type="text" required maxLength={300} className={`${inputClass} mt-1`} value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
          </>
        )}

        <label className="block text-xs text-slate-600">
          {action === 'info' ? 'What do you need from them?' : action === 'interview' ? 'Anything to bring or know (optional)' : 'Note to the driver (optional)'}
          <textarea
            rows={3}
            required={action === 'info'}
            maxLength={2000}
            className={`${inputClass} mt-1`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              action === 'info'
                ? 'e.g. Please send a photo of your vehicle and your insurance certificate.'
                : action === 'interview'
                  ? 'e.g. Bring your licence and come to the side gate.'
                  : action === 'APPROVED'
                    ? 'e.g. Welcome aboard — your first shift is Monday at 8.'
                    : ''
            }
          />
        </label>

        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-surface">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40 ${action === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
          >
            {saving ? 'Sending…' : submit}
          </button>
        </div>
      </form>
    </div>
  );
}
