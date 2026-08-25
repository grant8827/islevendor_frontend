import { useState } from 'react';
import { Warehouse } from 'lucide-react';
import { apiRequest } from '../../api/client.js';

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester', 'St. Elizabeth',
  'Westmoreland', 'Hanover', 'St. James', 'Trelawny', 'St. Ann', 'St. Mary', 'Portland', 'St. Thomas',
];

// Rough parish centroids — good enough to seed a warehouse's map point until
// the operator can drop a real pin (Phase 2+).
const PARISH_COORDS = {
  Kingston: { lat: 17.9712, lng: -76.7936 },
  'St. Andrew': { lat: 18.0333, lng: -76.7833 },
  'St. Catherine': { lat: 17.9909, lng: -77.0 },
  Clarendon: { lat: 17.9667, lng: -77.2333 },
  Manchester: { lat: 18.0456, lng: -77.5028 },
  'St. Elizabeth': { lat: 18.0333, lng: -77.75 },
  Westmoreland: { lat: 18.3, lng: -78.1333 },
  Hanover: { lat: 18.4, lng: -78.1333 },
  'St. James': { lat: 18.4762, lng: -77.8939 },
  Trelawny: { lat: 18.35, lng: -77.6167 },
  'St. Ann': { lat: 18.4333, lng: -77.2 },
  'St. Mary': { lat: 18.3667, lng: -76.9 },
  Portland: { lat: 18.1833, lng: -76.45 },
  'St. Thomas': { lat: 17.9, lng: -76.35 },
};

export default function WarehouseSetupForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', addressLine: '', parish: 'Kingston' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const coords = PARISH_COORDS[form.parish];
      const { id } = await apiRequest('/warehouse', {
        method: 'POST',
        body: { ...form, lat: coords.lat, lng: coords.lng },
      });
      onCreated(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="w-5 h-5 text-amazon-yellow" />
        <h2 className="font-bold text-white text-lg">Set up your warehouse</h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Register your depot before you can add stock or approve affiliates. This creates the
        spatial point drivers get dispatched against.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Warehouse name</label>
          <input
            value={form.name}
            onChange={update('name')}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Address</label>
          <input
            value={form.addressLine}
            onChange={update('addressLine')}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Parish</label>
          <select
            value={form.parish}
            onChange={update('parish')}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
          >
            {PARISHES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-amazon-yellow hover:bg-amazon-orange disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-lg transition"
        >
          {submitting ? 'Creating…' : 'Create Warehouse'}
        </button>
      </form>
    </div>
  );
}
