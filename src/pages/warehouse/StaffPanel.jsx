import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const ROLE_OPTIONS = [
  {
    value: 'STAFF',
    label: 'Staff',
    help: 'Can use Products, Orders, Feedback, Applications and the Packing Queue. No overview, payouts, profile or staff management, and no refunds.',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    help: 'Everything the owner can do except payouts — including adding and removing staff, refunds and the reseller commission.',
  },
];

const EMPTY_FORM = { fullName: '', email: '', phoneNumber: '', password: '', role: 'STAFF', extraWarehouseIds: [] };

const inputClass = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary';

// The "Staff" tab — where a warehouse admin (the owner, or an ADMIN member)
// adds logins for people who work there. Staff sign in through the normal
// login page; what they can reach is decided by the role set here (see
// warehouse.staff.ts / lib/warehouseAccess.ts on the backend, which is what
// actually enforces it — the dashboard just hides what they can't use).
//
// `ownedWarehouses` — the owner's other warehouses, so one login can be
// added to several at once. Empty for an ADMIN member (they only manage the
// warehouse they're in).
export default function StaffPanel({ warehouse, ownedWarehouses = [] }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [data, setData] = useState(null); // { owner, members }
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [added, setAdded] = useState(null); // { name, email, password, passwordApplied } — shown once, right after adding
  const [editing, setEditing] = useState(null); // { id, fullName, phoneNumber, email, password } for the row being edited
  const [editError, setEditError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const otherWarehouses = ownedWarehouses.filter((w) => w.id !== warehouse.id);

  const load = useCallback(() => {
    setLoadError(null);
    return apiRequest(`/warehouse/${warehouse.id}/staff`)
      .then(setData)
      .catch((err) => setLoadError(err.message));
  }, [warehouse.id]);

  useEffect(() => {
    setData(null);
    setShowForm(false);
    setAdded(null);
    setEditing(null);
    load();
  }, [load]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function toggleExtra(id) {
    setForm((f) => ({
      ...f,
      extraWarehouseIds: f.extraWarehouseIds.includes(id) ? f.extraWarehouseIds.filter((x) => x !== id) : [...f.extraWarehouseIds, id],
    }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const { passwordApplied } = await apiRequest(`/warehouse/${warehouse.id}/staff`, {
        method: 'POST',
        body: {
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          password: form.password,
          role: form.role,
          additionalWarehouseIds: form.extraWarehouseIds,
        },
      });
      setAdded({ name: form.fullName, email: form.email, password: form.password, passwordApplied });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function changeRole(member, role) {
    setBusyId(member.id);
    try {
      await apiRequest(`/warehouse/${warehouse.id}/staff/${member.id}`, { method: 'PATCH', body: { role } });
      notify(`${member.user.fullName} is now ${role === 'ADMIN' ? 'an admin' : 'staff'}.`);
      await load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(member) {
    setEditError(null);
    setEditing(
      editing?.id === member.id
        ? null
        : { id: member.id, fullName: member.user.fullName, phoneNumber: member.user.phoneNumber, email: member.user.email, password: '' },
    );
  }

  const updateEdit = (field) => (e) => setEditing((ed) => ({ ...ed, [field]: e.target.value }));

  async function saveEdit(e, member) {
    e.preventDefault();
    setEditError(null);
    // Only send what actually changed — a blank password means "keep it".
    const body = {};
    if (editing.fullName !== member.user.fullName) body.fullName = editing.fullName;
    if (editing.phoneNumber !== member.user.phoneNumber) body.phoneNumber = editing.phoneNumber;
    if (editing.email !== member.user.email) body.email = editing.email;
    if (editing.password) body.password = editing.password;
    if (Object.keys(body).length === 0) {
      setEditing(null);
      return;
    }

    setBusyId(member.id);
    try {
      await apiRequest(`/warehouse/${warehouse.id}/staff/${member.id}`, { method: 'PATCH', body });
      notify(
        body.password || body.email
          ? `${editing.fullName} updated. Let them know their ${body.email ? 'email' : ''}${body.email && body.password ? ' and ' : ''}${body.password ? 'password' : ''} changed.`
          : `${editing.fullName} updated.`,
      );
      setEditing(null);
      await load();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(member) {
    if (!window.confirm(`Remove ${member.user.fullName} from ${warehouse.name}? They'll lose access immediately.`)) return;
    setBusyId(member.id);
    try {
      await apiRequest(`/warehouse/${warehouse.id}/staff/${member.id}`, { method: 'DELETE' });
      notify(`${member.user.fullName} removed.`);
      await load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === form.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-navy text-lg">Staff</h2>
          <p className="text-xs text-slate-500">People who can sign in to {warehouse.name}'s dashboard.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className="btn-primary font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition shrink-0"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {added && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-sm text-slate-800" role="status">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold text-navy">{added.name} was added.</p>
            <button type="button" onClick={() => setAdded(null)} aria-label="Dismiss" className="text-slate-500 hover:text-navy">
              <X className="w-4 h-4" />
            </button>
          </div>
          {added.passwordApplied ? (
            <p className="text-xs mt-1">
              Share these sign-in details with them — they log in from the normal login page. This is the only time the password is shown.
              <span className="block mt-2 font-mono text-[12px] bg-white/70 border border-primary/20 rounded-lg px-3 py-2">
                {added.email}
                <br />
                {added.password}
              </span>
            </p>
          ) : (
            <p className="text-xs mt-1">
              They already have an account, so they sign in with their existing email ({added.email}) and password.
            </p>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Full name</label>
            <input value={form.fullName} onChange={update('fullName')} required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Phone number</label>
            <input type="tel" value={form.phoneNumber} onChange={update('phoneNumber')} required minLength={7} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email (their login)</label>
            <input type="email" value={form.email} onChange={update('email')} required autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Password</label>
            <input
              type="text"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
              autoComplete="off"
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="staff-role" className="block text-xs text-slate-500 mb-1">Access level</label>
            <select id="staff-role" value={form.role} onChange={update('role')} className={inputClass}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1.5">{selectedRole.help}</p>
          </div>
          {otherWarehouses.length > 0 && (
            <fieldset className="md:col-span-2">
              <legend className="block text-xs text-slate-500 mb-1">Warehouses</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked disabled className="accent-primary" />
                  {warehouse.name}
                </label>
                {otherWarehouses.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.extraWarehouseIds.includes(w.id)}
                      onChange={() => toggleExtra(w.id)}
                      className="accent-primary"
                    />
                    {w.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {formError && <p className="md:col-span-2 text-xs text-red-500" role="alert">{formError}</p>}
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60 text-xs font-bold px-4 py-2.5 rounded-lg transition">
              {submitting ? 'Adding…' : 'Add Staff Member'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}
      {!data && !loadError && <p className="text-sm text-slate-500">Loading…</p>}

      {data && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Access</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-5 py-3 font-bold text-slate-900">{data.owner.fullName}</td>
                <td className="px-5 py-3">{data.owner.email}</td>
                <td className="px-5 py-3">{data.owner.phoneNumber}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-navy bg-navy/10 border border-navy/20 px-1.5 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" /> Owner
                  </span>
                </td>
                <td className="px-5 py-3" />
              </tr>

              {data.members.map((m) => {
                const isYou = m.user.id === user?.id;
                return (
                  <Fragment key={m.id}>
                    <tr className={busyId === m.id ? 'opacity-60' : ''}>
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {m.user.fullName}
                        {isYou && <span className="ml-2 text-[10px] font-bold uppercase text-slate-500">You</span>}
                      </td>
                      <td className="px-5 py-3">{m.user.email}</td>
                      <td className="px-5 py-3">{m.user.phoneNumber}</td>
                      <td className="px-5 py-3">
                        {isYou ? (
                          <span className="font-bold">{m.role === 'ADMIN' ? 'Admin' : 'Staff'}</span>
                        ) : (
                          <select
                            aria-label={`Access level for ${m.user.fullName}`}
                            value={m.role}
                            disabled={busyId === m.id}
                            onChange={(e) => changeRole(m, e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-secondary"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {!isYou && (
                          <div className="flex items-center justify-end gap-1.5">
                            {m.canManage && (
                              <button
                                type="button"
                                title="Edit details"
                                aria-label={`Edit ${m.user.fullName}`}
                                onClick={() => startEdit(m)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Remove"
                              onClick={() => remove(m)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {editing?.id === m.id && (
                      <tr className="bg-surface">
                        <td colSpan={5} className="px-5 py-4">
                          <form onSubmit={(e) => saveEdit(e, m)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor={`edit-name-${m.id}`} className="block text-xs text-slate-500 mb-1">Full name</label>
                              <input id={`edit-name-${m.id}`} value={editing.fullName} onChange={updateEdit('fullName')} required className={inputClass} />
                            </div>
                            <div>
                              <label htmlFor={`edit-phone-${m.id}`} className="block text-xs text-slate-500 mb-1">Phone number</label>
                              <input id={`edit-phone-${m.id}`} type="tel" value={editing.phoneNumber} onChange={updateEdit('phoneNumber')} required minLength={7} className={inputClass} />
                            </div>
                            <div>
                              <label htmlFor={`edit-email-${m.id}`} className="block text-xs text-slate-500 mb-1">Email (their login)</label>
                              <input id={`edit-email-${m.id}`} type="email" value={editing.email} onChange={updateEdit('email')} required autoComplete="off" className={inputClass} />
                            </div>
                            <div>
                              <label htmlFor={`edit-password-${m.id}`} className="block text-xs text-slate-500 mb-1">New password (leave blank to keep the current one)</label>
                              <input
                                id={`edit-password-${m.id}`}
                                type="text"
                                value={editing.password}
                                onChange={updateEdit('password')}
                                minLength={8}
                                autoComplete="off"
                                placeholder="At least 8 characters"
                                className={inputClass}
                              />
                            </div>
                            {editError && <p className="md:col-span-2 text-xs text-red-500" role="alert">{editError}</p>}
                            <div className="md:col-span-2 flex gap-2">
                              <button type="submit" disabled={busyId === m.id} className="btn-primary disabled:opacity-60 text-xs font-bold px-4 py-2 rounded-lg transition">
                                {busyId === m.id ? 'Saving…' : 'Save Changes'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {data.members.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-10">No staff yet. Add someone to give them access.</p>
          )}
        </div>
      )}
    </div>
  );
}
