import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { apiRequest } from '../../api/client.js';

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester', 'St. Elizabeth',
  'Westmoreland', 'Hanover', 'St. James', 'Trelawny', 'St. Ann', 'St. Mary', 'Portland', 'St. Thomas',
];

// Rough parish centroids — good enough to seed a shop's dispatch point until
// the owner can drop a real pin (Phase 2+). Same table as the warehouse form.
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

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ShopSetupForm({ onCreated }) {
  const [form, setForm] = useState({ shopName: '', slug: '', addressLine: '', parish: 'Kingston' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleNameChange(e) {
    const value = e.target.value;
    setForm((f) => ({ ...f, shopName: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const coords = PARISH_COORDS[form.parish];
      const { id } = await apiRequest('/shop', {
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
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-navy text-lg">Set up your store</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Register your business before you can add items — no approval needed, you're selling your own stock.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Store name</label>
          <input
            value={form.shopName}
            onChange={handleNameChange}
            required
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Store URL slug</label>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-slate-500">/store/</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update('slug')(e);
              }}
              required
              pattern="[a-z0-9\-]+"
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Address</label>
          <input
            value={form.addressLine}
            onChange={update('addressLine')}
            required
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Parish</label>
          <select
            value={form.parish}
            onChange={update('parish')}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
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
          className="btn-primary disabled:opacity-60 text-sm px-5 py-2.5"
        >
          {submitting ? 'Creating…' : 'Create Store'}
        </button>
      </form>
    </div>
  );
}
