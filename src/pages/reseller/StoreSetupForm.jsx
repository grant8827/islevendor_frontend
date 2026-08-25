import { useState } from 'react';
import { Store } from 'lucide-react';
import { apiRequest } from '../../api/client.js';

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function StoreSetupForm({ onCreated }) {
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleNameChange(e) {
    const value = e.target.value;
    setStoreName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const store = await apiRequest('/commerce/stores', { method: 'POST', body: { storeName, slug } });
      onCreated(store);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-5 h-5 text-amazon-yellow" />
        <h2 className="font-bold text-white text-lg">Set up your storefront</h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Create your public store before you can apply to sell a warehouse's stock or list products.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Store name</label>
          <input
            value={storeName}
            onChange={handleNameChange}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Store URL slug</label>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-slate-500">/store/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              pattern="[a-z0-9\-]+"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amazon-yellow"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-amazon-yellow hover:bg-amazon-orange disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-lg transition"
        >
          {submitting ? 'Creating…' : 'Create Store'}
        </button>
      </form>
    </div>
  );
}
