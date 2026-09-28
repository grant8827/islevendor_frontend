import { useEffect, useState } from 'react';
import { Truck, Eye, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import ViewDriverApplicantModal from '../../components/dashboard/ViewDriverApplicantModal.jsx';

// The warehouse's regular couriers — mirrors ApprovedResellersSection.jsx,
// minus item assignment (drivers don't sell stock).
export default function ApprovedDriversSection({ warehouseId }) {
  const [drivers, setDrivers] = useState(null);
  const [viewingDriver, setViewingDriver] = useState(null);
  const { notify } = useToast();

  function load() {
    apiRequest(`/warehouse/${warehouseId}/delivery-applications`).then((all) => {
      setDrivers(all.filter((a) => a.status === 'APPROVED' || a.status === 'SUSPENDED'));
    });
  }

  useEffect(load, [warehouseId]);

  async function toggleSuspend(application) {
    const nextStatus = application.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    try {
      await apiRequest(`/delivery-applications/${application.id}`, { method: 'PATCH', body: { status: nextStatus } });
      notify(`${application.driver.user.fullName} ${nextStatus === 'SUSPENDED' ? 'suspended' : 'unsuspended'}.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  async function remove(application) {
    if (!window.confirm(`Remove ${application.driver.user.fullName}? They'll no longer be one of your couriers.`)) return;
    try {
      await apiRequest(`/delivery-applications/${application.id}`, { method: 'DELETE' });
      notify(`${application.driver.user.fullName} removed.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-navy text-sm">Delivery Drivers</h3>
      </div>

      {drivers === null && <p className="text-sm text-slate-500">Loading…</p>}
      {drivers?.length === 0 && (
        <p className="text-sm text-slate-500">
          No approved drivers yet — decide pending driver applications from the <strong>Applications</strong> tab.
        </p>
      )}

      {drivers?.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Driver</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Approved</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((d) => (
                <tr key={d.id} className={d.status === 'SUSPENDED' ? 'opacity-50' : ''}>
                  <td className="px-5 py-3 font-bold text-slate-900">
                    {d.driver.user.fullName}
                    <span className="block text-[11px] font-normal text-slate-500">
                      {[d.driver.user.phoneNumber, d.driver.vehicleType?.replaceAll('_', ' ')].filter(Boolean).join(' · ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        d.status === 'SUSPENDED'
                          ? 'text-amber-700 bg-amber-100 border-amber-300'
                          : 'text-primary-dark bg-primary/10 border-primary/30'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{d.decidedAt ? new Date(d.decidedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="View driver details"
                        onClick={() => setViewingDriver(d)}
                        className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={d.status === 'APPROVED' ? 'Suspend' : 'Unsuspend'}
                        onClick={() => toggleSuspend(d)}
                        className={`p-1.5 rounded-lg transition ${
                          d.status === 'APPROVED' ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {d.status === 'APPROVED' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => remove(d)}
                        className="p-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingDriver && <ViewDriverApplicantModal application={viewingDriver} onClose={() => setViewingDriver(null)} />}
    </div>
  );
}
