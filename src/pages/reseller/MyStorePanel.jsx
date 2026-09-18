import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, PackageSearch, Palette, Store, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import ProductCard from '../../components/marketplace/ProductCard.jsx';
import StoreCatalog from '../../components/marketplace/StoreCatalog.jsx';
import { HeroBackground } from '../../components/marketplace/storeHero.jsx';
import { heroTheme } from '../../components/marketplace/heroTheme.js';
import HeroEditor from './HeroEditor.jsx';

// Added to the catalog's standard sorts — only a reseller knows their own cut.
const EXTRA_SORTS = [{ key: 'earnings', label: 'You earn the most', compare: (a, b) => Number(b.earningPerUnitJmd) - Number(a.earningPerUnitJmd) }];

const money = (n) => `J$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// The reseller's own storefront, laid out like the marketplace a customer
// sees: a store banner, search / category / sort, and the same product cards
// (image, discount badge, live price, ships-from) — each with a Remove
// button in place of Add to Cart. `onBrowseProducts` jumps to the Products
// tab, where new items are added from. `onStoreUpdated(patch)` lets the
// dashboard merge a saved banner change into its copy of the store.
export default function MyStorePanel({ store, onBrowseProducts, onStoreUpdated }) {
  const [listings, setListings] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editingHero, setEditingHero] = useState(false);
  const { notify } = useToast();

  function load() {
    return apiRequest(`/commerce/stores/${store.id}/listings`)
      .then(setListings)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    setListings(null);
    setError(null);
    load();
  }, [store.id]);

  async function remove(listing) {
    setBusyId(listing.id);
    try {
      await apiRequest(`/commerce/stores/${store.id}/listings/${listing.id}`, { method: 'DELETE' });
      notify(`${listing.masterProduct.title} removed from your store.`);
      await load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const categoryCount = new Set(listings?.map((l) => l.masterProduct.category)).size;
  const inStockCount = listings?.filter((l) => l.masterProduct.isActive && l.masterProduct.stockQuantity > 0).length ?? 0;
  const storefrontPath = `/store/${store.slug}`;
  const theme = heroTheme(store);

  return (
    <div>
      {/* Store banner — the reseller's own choice (default / color / image). */}
      <div className={`relative overflow-hidden rounded-2xl p-6 mb-6 ${theme.text}`}>
        <HeroBackground hero={store} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${theme.chip.split(' ').slice(0, 2).join(' ')}`}>
              <Store className={`w-6 h-6 ${theme.icon}`} />
            </span>
            <div>
              <h2 className="font-bold text-xl leading-tight">{store.storeName}</h2>
              <p className={`text-xs mt-0.5 ${theme.muted}`}>{storefrontPath}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditingHero((v) => !v)}
              aria-expanded={editingHero}
              className={`flex items-center gap-1.5 border text-xs font-bold px-3 py-2 rounded-lg transition ${theme.chip}`}
            >
              <Palette className="w-3.5 h-3.5" /> Customize banner
            </button>
            <Link
              to={storefrontPath}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 border text-xs font-bold px-3 py-2 rounded-lg transition ${theme.chip}`}
            >
              View live storefront <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <dl className="relative mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {[
            ['Items listed', listings?.length ?? '—'],
            ['In stock', listings ? inStockCount : '—'],
            ['Categories', listings ? categoryCount : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className={`text-[11px] uppercase tracking-wide ${theme.muted}`}>{label}</dt>
              <dd className="text-2xl font-black">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {editingHero && (
        <HeroEditor
          store={store}
          onCancel={() => setEditingHero(false)}
          onSaved={(saved) => {
            onStoreUpdated?.(saved);
            setEditingHero(false);
          }}
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {!listings && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {listings?.length === 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 text-center">
          <PackageSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-navy">Your shelves are empty</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Add items your warehouses have approved for you and they'll appear here, just like they do for shoppers.</p>
          {onBrowseProducts && (
            <button type="button" onClick={onBrowseProducts} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg">
              Browse products to add
            </button>
          )}
        </div>
      )}

      {listings?.length > 0 && (
        <StoreCatalog
          listings={listings}
          extraSorts={EXTRA_SORTS}
          searchPlaceholder="Search your store…"
          renderCard={(listing) => {
            const paused = !listing.masterProduct.isActive;
            return (
              <div key={listing.id} className={`flex flex-col [&>div]:flex-1 ${paused ? 'opacity-70' : ''}`}>
                <ProductCard
                  listing={listing}
                  showMetadata
                  openInNewTab
                  details={
                    <div className="bg-primary/5 p-2 rounded text-[11px] text-slate-600 border border-primary/20 space-y-0.5">
                      {paused && <p className="font-bold text-amber-700">Paused by the warehouse — hidden from shoppers</p>}
                      <p>
                        You earn <strong className="text-primary-dark">{money(listing.earningPerUnitJmd)}</strong> per sale
                      </p>
                      <p>
                        Supplied by <strong className="text-slate-800">{listing.masterProduct.warehouse.name}</strong>
                      </p>
                    </div>
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => remove(listing)}
                      disabled={busyId === listing.id}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg border border-red-300 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove from Store
                    </button>
                  }
                />
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
