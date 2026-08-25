import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Trash2, ImageOff } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function MyStorePanel({ store }) {
  const [listings, setListings] = useState(null);
  const { notify } = useToast();

  function load() {
    apiRequest(`/commerce/stores/${store.slug}`, { auth: false }).then((s) => setListings(s.listings));
  }

  useEffect(load, [store.slug]);

  async function remove(listing) {
    try {
      await apiRequest(`/commerce/stores/${store.id}/listings/${listing.id}`, { method: 'DELETE' });
      notify(`${listing.masterProduct.title} removed from your store.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Store className="w-5 h-5 text-amazon-yellow" />
        <h2 className="font-bold text-white text-lg">My Store</h2>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        <span className="text-slate-500">Name:</span> {store.storeName} ·{' '}
        <Link to={`/store/${store.slug}`} className="text-amazon-yellow hover:underline">
          /store/{store.slug} →
        </Link>
      </p>

      {listings === null && <p className="text-sm text-slate-400">Loading…</p>}
      {listings?.length === 0 && (
        <p className="text-sm text-slate-500">
          Nothing listed yet — add items from the <strong>Products</strong> tab.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings?.map((listing) => (
          <div key={listing.id} className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="h-28 bg-slate-900 flex items-center justify-center">
              {listing.masterProduct.imageUrl ? (
                <img src={listing.masterProduct.imageUrl} alt="" className="max-h-full object-contain" />
              ) : (
                <ImageOff className="w-6 h-6 text-slate-600" />
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-white">{listing.masterProduct.title}</p>
              <p className="text-xs text-emerald-400 font-bold mt-1">J${Number(listing.retailPriceJmd).toLocaleString()}</p>
              <button
                type="button"
                onClick={() => remove(listing)}
                className="mt-3 w-full flex items-center justify-center gap-1 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs font-bold py-1.5 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
