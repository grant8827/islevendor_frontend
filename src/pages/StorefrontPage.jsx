import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, PackageSearch, Store, Truck } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Navbar from '../components/marketplace/Navbar.jsx';
import ProductCard from '../components/marketplace/ProductCard.jsx';
import StoreCatalog from '../components/marketplace/StoreCatalog.jsx';
import { HeroBackground } from '../components/marketplace/storeHero.jsx';
import { heroTheme } from '../components/marketplace/heroTheme.js';

// A seller's public storefront (/store/:slug) — a reseller's store or a
// shop's own page (the API returns both in one shape). Same product cards,
// search, categories and sorting as the marketplace, scoped to this seller.
export default function StorefrontPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { notify } = useToast();
  const [store, setStore] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStore(null);
    setError(null);
    apiRequest(`/commerce/stores/${slug}`, { auth: false })
      .then(setStore)
      .catch((err) => setError(err.message));
  }, [slug]);

  function handleAddToCart(listing) {
    addItem(listing);
    notify(`Added ${listing.masterProduct.title} to your cart!`);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {error && (
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Store className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h1 className="font-bold text-navy text-lg">{error === 'Store not found' ? "We couldn't find that store" : 'Something went wrong'}</h1>
          <p className="text-sm text-slate-500 mt-1 mb-5" role="alert">{error === 'Store not found' ? 'The link may be mistyped, or the store may have closed.' : error}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg">
            <ArrowLeft className="w-4 h-4" /> Back to the marketplace
          </Link>
        </div>
      )}

      {!error && !store && <p className="max-w-7xl mx-auto px-4 py-10 text-sm text-slate-500">Loading store…</p>}

      {store && (
        <>
          {/* The reseller's own banner — default gradient, a color, or an image. */}
          <section className={`relative overflow-hidden ${heroTheme(store).text}`}>
            <HeroBackground hero={store} />
            <div className="relative max-w-7xl mx-auto px-4 py-10">
              <Link to="/" className={`inline-flex items-center gap-1 text-xs hover:opacity-80 mb-4 ${heroTheme(store).muted}`}>
                <ArrowLeft className="w-3.5 h-3.5" /> Marketplace
              </Link>
              <div className="flex items-center gap-4">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${heroTheme(store).chip.split(' ').slice(0, 2).join(' ')}`}>
                  <Store className={`w-7 h-7 ${heroTheme(store).icon}`} />
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black leading-tight">{store.storeName}</h1>
                  <p className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${heroTheme(store).muted}`}>
                    {store.parish && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {store.parish}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Delivered by IsleDash
                    </span>
                    <span>
                      {store.listings.length} item{store.listings.length === 1 ? '' : 's'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <main className="max-w-7xl mx-auto px-4 py-8">
            {store.listings.length === 0 ? (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">
                <PackageSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-navy">Nothing on the shelves yet</p>
                <p className="text-xs text-slate-500 mt-1">{store.storeName} hasn't listed any products. Check back soon.</p>
              </div>
            ) : (
              <StoreCatalog
                listings={store.listings}
                searchPlaceholder={`Search ${store.storeName}…`}
                gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                renderCard={(listing) => (
                  <ProductCard key={listing.id} listing={listing} onAddToCart={handleAddToCart} showMetadata={false} />
                )}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
