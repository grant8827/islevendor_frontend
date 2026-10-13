import { useCallback, useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { Badge, ListState } from './adminShared.jsx';
import { APPLICANT_TYPE_LABELS, STATUS_STYLES, humanize, inputClass } from './adminFormat.js';
import ApplicantDetailModal from './ApplicantDetailModal.jsx';

const STATUS_TABS = [
  { key: 'PENDING_REVIEW', label: 'Awaiting review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

// One review queue for all four kinds of applicant (warehouse, reseller,
// store, driver). Opening a row shows the whole application, its documents
// and the approve/reject controls — see ApplicantDetailModal.jsx.
export default function ApplicantsPanel({ onDecision }) {
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [type, setType] = useState('');
  const [applicants, setApplicants] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null); // { type, id } of the application being viewed

  const load = useCallback(() => {
    setApplicants(null);
    setError(null);
    const params = new URLSearchParams({ status });
    if (type) params.set('type', type);
    apiRequest(`/admin/applicants?${params}`)
      .then(setApplicants)
      .catch((err) => setError(err.message));
  }, [status, type]);

  useEffect(load, [load]);

  function handleDecided() {
    setOpen(null);
    load();
    onDecision?.();
  }

  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-4">Applicants</h2>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
                status === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 pb-2">
          Type
          <select className={`${inputClass} py-1.5`} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            {Object.entries(APPLICANT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ListState rows={applicants} error={error} onRetry={load} emptyMessage="No applications here." />

      {applicants?.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Applicant</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Parish</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Document checks</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applicants.map((a) => (
                <tr key={`${a.type}-${a.id}`} className="hover:bg-surface transition">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-900">{a.name}</p>
                    <p className="text-slate-500">
                      {a.user.email}
                      {a.referenceId && <> · {a.referenceId}</>}
                    </p>
                  </td>
                  <td className="px-5 py-3">{APPLICANT_TYPE_LABELS[a.type]}</td>
                  <td className="px-5 py-3">{a.parish ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <Badge className={STATUS_STYLES[a.applicantStatus]}>{humanize(a.applicantStatus)}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {a.flags.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {a.flags.map((flag) => (
                          <li key={flag} className="flex items-center gap-1 text-amber-700">
                            <TriangleAlert className="w-3.5 h-3.5 shrink-0" /> {flag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => setOpen({ type: a.type, id: a.id })} className="text-secondary hover:underline font-bold">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <ApplicantDetailModal type={open.type} id={open.id} onClose={() => setOpen(null)} onDecided={handleDecided} />}
    </div>
  );
}
