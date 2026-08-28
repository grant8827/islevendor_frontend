import { useEffect, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, PauseCircle, PlayCircle, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY_FORM = { title: '', description: '' };

// A warehouse's "we're recruiting" postings — what they're looking for in a
// reseller. Only ACTIVE ones show up on the reseller-side Applications page
// (see reseller/WarehousesPanel.jsx) — a warehouse with none active simply
// isn't listed there, so posting one is how a warehouse gets found at all.
export default function VacanciesPanel({ warehouseId }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/warehouse/${warehouseId}/vacancies`)
      .then(setVacancies)
      .finally(() => setLoading(false));
  }

  useEffect(load, [warehouseId]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(vacancy) {
    setEditingId(vacancy.id);
    setForm({ title: vacancy.title, description: vacancy.description });
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await apiRequest(`/warehouse/vacancies/${editingId}`, { method: 'PATCH', body: form });
        notify('Vacancy updated.');
      } else {
        await apiRequest(`/warehouse/${warehouseId}/vacancies`, { method: 'POST', body: form });
        notify('Vacancy posted — it will show up on the reseller Applications page.');
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(vacancy) {
    try {
      await apiRequest(`/warehouse/vacancies/${vacancy.id}`, { method: 'PATCH', body: { isActive: !vacancy.isActive } });
      notify(vacancy.isActive ? 'Vacancy paused.' : 'Vacancy activated — visible to resellers now.');
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  async function remove(vacancy) {
    if (!window.confirm(`Remove "${vacancy.title}"? This can't be undone.`)) return;
    try {
      await apiRequest(`/warehouse/vacancies/${vacancy.id}`, { method: 'DELETE' });
      notify('Vacancy removed.');
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-navy text-lg">Vacancies</h2>
          <p className="text-xs text-slate-500">
            Post what you're looking for in a reseller — active postings show up on every reseller's Applications page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? closeForm() : openAddForm())}
          className="btn-primary font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Post Vacancy'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input
              value={form.title}
              onChange={update('title')}
              required
              placeholder="E.g. Social media resellers wanted"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">What you're looking for</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              required
              rows={4}
              placeholder="Who you want to hear from, what they'd be selling, any expectations…"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary resize-y"
            />
          </div>
          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60 text-xs font-bold px-4 py-2.5 rounded-lg transition">
              {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Post Vacancy'}
            </button>
            <button type="button" onClick={closeForm} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && vacancies.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Briefcase className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No vacancies posted yet — resellers won't see you on their Applications page until you post one.</p>
        </div>
      )}

      <div className="space-y-3">
        {vacancies.map((v) => (
          <div key={v.id} className={`card p-4 ${v.isActive ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {v.title}
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                    v.isActive ? 'text-primary-dark bg-primary/10 border-primary/30' : 'text-slate-500 bg-slate-100 border-slate-300'
                  }`}>
                    {v.isActive ? 'Active' : 'Paused'}
                  </span>
                </p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{v.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" title="Edit" onClick={() => openEditForm(v)} className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={v.isActive ? 'Pause' : 'Activate'}
                  onClick={() => toggleActive(v)}
                  className={`p-1.5 rounded-lg transition ${v.isActive ? 'text-slate-500 hover:text-amber-600 hover:bg-slate-100' : 'text-primary hover:bg-slate-100'}`}
                >
                  {v.isActive ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                </button>
                <button type="button" title="Remove" onClick={() => remove(v)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
