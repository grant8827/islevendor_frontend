import { useCallback, useEffect, useState } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Badge } from './adminShared.jsx';
import { APPLICANT_TYPE_LABELS, STATUS_STYLES, formatDateTime, humanize } from './adminFormat.js';

const DOCUMENT_LABELS = {
  cocj: 'Companies Office registration',
  'trn-card': 'TRN card',
  'proof-of-address': 'Proof of address',
  'photo-id': 'Photo ID',
  license: "Driver's licence",
  selfie: 'Selfie',
  insurance: 'Insurance certificate',
  registration: 'Vehicle registration',
};

// Internal bookkeeping columns that mean nothing to a reviewer.
const HIDDEN_FIELDS = new Set(['id', 'userId', 'applicantStatus', 'currentLocation', 'isOnline', 'heroMode', 'heroColor', 'heroImageUrl', 'slug']);

// "licenseHolderName" -> "License holder name"
const labelOf = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).replace(/ ([A-Z])/g, (_, c) => ` ${c.toLowerCase()}`);

function formatValue(key, value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    // Expiry and issue dates are calendar dates; everything else is a moment in time.
    return /Expiry$|IssuedOn$/.test(key) ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : formatDateTime(value);
  }
  if (typeof value === 'string' && /^[A-Z_]+$/.test(value)) return humanize(value);
  return String(value);
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 font-semibold text-right break-words min-w-0">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function describeEvent(event) {
  if (event.action === 'applicant.decision') {
    return `${humanize(event.metadata.decision)}${event.metadata.reason ? ` — ${event.metadata.reason}` : ''}`;
  }
  if (event.action === 'kyc_document.access_granted') return `Viewed ${DOCUMENT_LABELS[event.metadata.kind] ?? event.metadata.kind}`;
  if (event.action === 'kyc_document.deleted') return `Deleted ${DOCUMENT_LABELS[event.metadata.kind] ?? event.metadata.kind}`;
  return event.action;
}

// The whole application for one applicant: what they submitted, their
// documents, everything admins have done with it so far, and the decision.
export default function ApplicantDetailModal({ type, id, onClose, onDecided }) {
  const { notify } = useToast();
  const [applicant, setApplicant] = useState(null);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [deciding, setDeciding] = useState(null); // 'APPROVED' | 'REJECTED' while a request is in flight
  const [decisionError, setDecisionError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    apiRequest(`/admin/applicants/${type}/${id}`)
      .then(setApplicant)
      .catch((err) => setError(err.message));
  }, [type, id]);

  useEffect(load, [load]);

  // Asks the API for a short-lived link and opens it. The tab is opened
  // *before* the request so the browser treats it as part of this click —
  // opened afterwards, popup blockers swallow it.
  async function viewDocument(kind) {
    const tab = window.open('', '_blank');
    try {
      const { url } = await apiRequest(`/v1/onboarding/${type}/${id}/documents/${kind}/access`, { method: 'POST' });
      if (tab) tab.location.href = url;
      else window.location.href = url;
      load(); // the view itself is now part of the history below
    } catch (err) {
      tab?.close();
      notify(err.message);
    }
  }

  async function decide(decision) {
    if (decision === 'REJECTED' && !reason.trim()) {
      setDecisionError('Give a reason for rejecting — the applicant will ask.');
      return;
    }
    setDecisionError(null);
    setDeciding(decision);
    try {
      await apiRequest(`/v1/onboarding/${type}/${id}/decision`, {
        method: 'POST',
        body: { decision, ...(reason.trim() ? { reason: reason.trim() } : {}) },
      });
      notify(decision === 'APPROVED' ? 'Application approved.' : 'Application rejected.');
      onDecided();
    } catch (err) {
      setDecisionError(err.message);
    } finally {
      setDeciding(null);
    }
  }

  const status = applicant?.profile.applicantStatus;
  const fields = applicant
    ? Object.entries(applicant.profile).filter(([key, value]) => !HIDDEN_FIELDS.has(key) && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-navy flex items-center gap-2">
              {applicant?.user.fullName ?? 'Application'}
              {status && <Badge className={STATUS_STYLES[status]}>{humanize(status)}</Badge>}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {APPLICANT_TYPE_LABELS[type]} application
              {applicant?.profile.referenceId && <> · {applicant.profile.referenceId}</>}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!applicant && !error && <p className="text-sm text-slate-500">Loading…</p>}

          {applicant && (
            <>
              <Section title="Account">
                <Row label="Full name" value={applicant.user.fullName} />
                <Row label="Email" value={applicant.user.email} />
                <Row label="Phone" value={applicant.user.phoneNumber} />
                <Row label="Account created" value={formatDateTime(applicant.user.createdAt)} />
              </Section>

              <Section title="Documents">
                {applicant.documents.map((doc) => (
                  <div key={doc.kind} className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-100 text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <FileText className="w-4 h-4 shrink-0 text-slate-400" /> {DOCUMENT_LABELS[doc.kind] ?? doc.kind}
                    </span>
                    {doc.onFile ? (
                      <button type="button" onClick={() => viewDocument(doc.kind)} className="flex items-center gap-1 text-secondary hover:underline font-bold text-xs">
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Not provided</span>
                    )}
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 mt-2">Each view opens a link that expires after two minutes and is recorded below.</p>
              </Section>

              <Section title="Application">
                {fields.map(([key, value]) => (
                  <Row key={key} label={labelOf(key)} value={formatValue(key, value)} />
                ))}
              </Section>

              <Section title="History">
                {applicant.history.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
                {applicant.history.map((event) => (
                  <div key={event.id} className="py-1.5 border-b border-slate-100 text-sm">
                    <p className="text-slate-900 first-letter:uppercase">{describeEvent(event)}</p>
                    <p className="text-xs text-slate-500">
                      {event.actor?.fullName ?? 'System'} · {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                ))}
              </Section>
            </>
          )}
        </div>

        {applicant && (
          <div className="px-6 py-4 border-t border-slate-200 bg-surface rounded-b-2xl">
            <label className="block text-xs text-slate-500 mb-1" htmlFor="decision-reason">
              Reason <span className="text-slate-400">(required to reject)</span>
            </label>
            <textarea
              id="decision-reason"
              rows={2}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
            />
            {decisionError && (
              <p className="text-xs text-red-600 mt-1" role="alert">
                {decisionError}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => decide('REJECTED')}
                disabled={deciding !== null || status === 'REJECTED'}
                className="text-xs font-bold px-4 py-2.5 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 transition disabled:opacity-40"
              >
                {deciding === 'REJECTED' ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => decide('APPROVED')}
                disabled={deciding !== null || status === 'APPROVED'}
                className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-40"
              >
                {deciding === 'APPROVED' ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
