import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, ExternalLink, Plus, Trash2, ImageOff } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const inputClass = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary';
const money = (n) => `J$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

function Thumb({ product }) {
  return (
    <div className="h-10 w-10 shrink-0 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
      {product.imageUrl ? <img src={product.imageUrl} alt="" className="max-h-full max-w-full object-contain" /> : <ImageOff className="w-4 h-4 text-slate-300" />}
    </div>
  );
}

// The warehouse's own storefront (My Store tab): it sells the warehouse's
// stock directly, at the same price a reseller would, through the same
// public store page and checkout — and the warehouse keeps the margin too.
export default function HouseStorePanel({ warehouse }) {
  const [store, setStore] = useState(undefined); // undefined = loading, null = not opened yet
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ storeName: `${warehouse.name} Direct`, slug: slugify(`${warehouse.name} direct`) });
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  const load = useCallback(() => {
    Promise.all([apiRequest(`/warehouse/${warehouse.id}/store`), apiRequest(`/warehouse/products?warehouseId=${warehouse.id}`, { auth: false })])
      .then(([s, p]) => {
        setStore(s);
        setProducts(p);
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, [warehouse.id]);

  useEffect(load, [load]);

  async function run(request, success) {
    setBusy(true);
    try {
      await request();
      if (success) notify(success);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  const openStore = (e) => {
    e.preventDefault();
    run(() => apiRequest(`/warehouse/${warehouse.id}/store`, { method: 'POST', body: form }), 'Your store is open.');
  };
  const list = (product) =>
    run(() => apiRequest(`/warehouse/${warehouse.id}/store/listings`, { method: 'POST', body: { masterProductId: product.id } }), `${product.title} is now for sale on your store.`);
  const unlist = (listing) =>
    run(() => apiRequest(`/warehouse/${warehouse.id}/store/listings/${listing.id}`, { method: 'DELETE' }), `${listing.masterProduct.title} taken off your store.`);

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }
  if (store === undefined) return <p className="text-sm text-slate-500">Loading…</p>;

  if (store === null) {
    return (
      <div className="max-w-lg">
        <h2 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" /> Open your own store
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Sell {warehouse.name}'s stock directly to customers, alongside your resellers. It works like a reseller's store — same prices, same checkout and delivery — but you run it and keep the margin.
        </p>
        <form onSubmit={openStore} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3 text-sm">
          <label className="block text-xs text-slate-600">
            Store name
            <input
              required
              maxLength={100}
              className={`${inputClass} mt-1`}
              value={form.storeName}
              onChange={(e) => setForm({ storeName: e.target.value, slug: slugify(e.target.value) })}
            />
          </label>
          <label className="block text-xs text-slate-600">
            Web address
            <span className="flex items-center mt-1">
              <span className="text-slate-400 text-sm pr-1">/store/</span>
              <input
                required
                minLength={3}
                maxLength={60}
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers and hyphens"
                className={inputClass}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
              />
            </span>
          </label>
          <button type="submit" disabled={busy} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
            {busy ? 'Opening…' : 'Open store'}
          </button>
        </form>
      </div>
    );
  }

  const active = store.listings.filter((l) => l.isActive);
  const listedIds = new Set(active.map((l) => l.masterProduct.id));
  const available = products.filter((p) => p.isActive && !listedIds.has(p.id));

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-navy text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> {store.storeName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Your own store — customers buy {warehouse.name}'s stock here directly.</p>
        </div>
        <Link to={`/store/${store.slug}`} target="_blank" className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline">
          View store <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <section>
        <h3 className="font-bold text-navy text-sm mb-3">For sale ({active.length})</h3>
        {active.length === 0 && <p className="text-sm text-slate-500">Nothing listed yet — add products below.</p>}
        {active.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="table-header-row uppercase">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Customer price</th>
                  <th className="px-5 py-3">In stock</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {active.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Thumb product={listing.masterProduct} />
                        <span className="font-bold text-slate-900">{listing.masterProduct.title}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">{money(listing.retailPriceJmd)}</td>
                    <td className="px-5 py-3">{listing.masterProduct.stockQuantity}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" disabled={busy} onClick={() => unlist(listing)} className="flex items-center gap-1 ml-auto text-red-700 hover:underline font-bold disabled:opacity-40">
                        <Trash2 className="w-3.5 h-3.5" /> Take off store
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-bold text-navy text-sm mb-1">Add from {warehouse.name}</h3>
        <p className="text-xs text-slate-500 mb-3">Customer price is your wholesale price plus your reseller commission and IsleVendor's commission — the same as on a reseller's store.</p>
        {available.length === 0 && <p className="text-sm text-slate-500">Every active product is already on your store.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {available.map((product) => (
            <div key={product.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
              <Thumb product={product} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{product.title}</p>
                <p className="text-xs text-slate-500">
                  {product.stockQuantity} in stock · {money(product.wholesalePriceJmd)} wholesale
                </p>
              </div>
              <button type="button" disabled={busy} onClick={() => list(product)} className="flex items-center gap-1 btn-primary text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-40">
                <Plus className="w-3.5 h-3.5" /> Sell
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
