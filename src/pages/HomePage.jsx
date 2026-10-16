import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/marketplace/ProductCard.jsx';
import Navbar from '../components/marketplace/Navbar.jsx';
import HeroCarousel from '../components/marketplace/HeroCarousel.jsx';
import islevendorIcon from '../assets/islevendor-icon.png';

function ProductSection({ id, title, subtitle, listings, onAddToCart }) {
  if (listings.length === 0) return null;
  return (
    <section id={id} className="space-y-5 scroll-mt-4">
      <div className="flex items-end justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-navy">{title}</h2>
          <p className="text-xs text-ink/70 mt-1">{subtitle}</p>
        </div>
        <span className="text-xs text-ink/60 font-mono">{listings.length} items</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {listings.map((listing) => (
          <ProductCard key={listing.id} listing={listing} onAddToCart={onAddToCart} showMetadata={false} />
        ))}
      </div>
    </section>
  );
}

const SORTS = [
  { key: 'newest', label: 'Newest', compare: (a, b) => new Date(b.masterProduct.createdAt || 0) - new Date(a.masterProduct.createdAt || 0) },
  { key: 'price-asc', label: 'Price: low to high', compare: (a, b) => Number(a.retailPriceJmd) - Number(b.retailPriceJmd) },
  { key: 'price-desc', label: 'Price: high to low', compare: (a, b) => Number(b.retailPriceJmd) - Number(a.retailPriceJmd) },
  { key: 'discount', label: 'Biggest discount', compare: (a, b) => b.discountPercent - a.discountPercent },
];

export default function HomePage() {
  const { addItem } = useCart();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/category filters live in the URL (?q=&category=), not local
  // state — the shared Navbar can be rendered on any page and always just
  // navigates here with the right params, rather than needing filter state
  // passed down from whatever page it happens to be mounted on.
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  // Plain `/` is the landing view (hero + curated sections). Any category —
  // including "All Products" (?category=All) — or a search switches to the
  // full browse grid of every matching product instead.
  const isBrowsing = searchParams.has('category') || Boolean(searchQuery);
  const [sortKey, setSortKey] = useState('newest');

  useEffect(() => {
    apiRequest('/commerce/listings', { auth: false })
      .then(setListings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        const matchesCategory = selectedCategory === 'All' || l.masterProduct.category === selectedCategory;
        const matchesSearch = l.masterProduct.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [listings, selectedCategory, searchQuery],
  );

  const sections = useMemo(() => {
    const newest = [...filtered].sort((a, b) => {
      const aDate = new Date(a.masterProduct.createdAt || 0).getTime();
      const bDate = new Date(b.masterProduct.createdAt || 0).getTime();
      return bDate - aDate;
    });
    return {
      sales: filtered.filter((listing) => listing.discountPercent > 0).slice(0, 8),
      newItems: newest.filter((listing) => listing.discountPercent === 0 && !listing.isFeatured).slice(0, 8),
      featured: filtered.filter((listing) => listing.discountPercent === 0 && listing.isFeatured).slice(0, 8),
    };
  }, [filtered]);

  const browseListings = useMemo(() => {
    const compare = SORTS.find((s) => s.key === sortKey).compare;
    return [...filtered].sort(compare);
  }, [filtered, sortKey]);

  const browseTitle = searchQuery
    ? `Results for “${searchQuery}”${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`
    : selectedCategory === 'All'
      ? 'All Products'
      : selectedCategory;

  function handleAddToCart(listing) {
    addItem(listing);
    notify(`Added ${listing.masterProduct.title} to your cart!`);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* HERO — only on the unfiltered landing view; picking a category
          jumps straight to that category's products. */}
      {!isBrowsing && <HeroCarousel />}

      {/* PRODUCT SECTIONS */}
      <main id="marketplace-items" className="max-w-7xl mx-auto px-4 py-8 space-y-12 scroll-mt-4">
        {loading && <p className="text-sm text-ink/70">Loading products…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-ink/70">No products match your search yet.</p>
        )}

        {!loading && !error && isBrowsing && filtered.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-navy">{browseTitle}</h2>
                <p className="text-xs text-ink/70 mt-1">
                  {filtered.length} item{filtered.length === 1 ? '' : 's'}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Sort by
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {browseListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} onAddToCart={handleAddToCart} showMetadata={false} />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && !isBrowsing && (
          <>
            <ProductSection
              id="new-items"
              title="New Items"
              subtitle="The latest products added to IsleVendor"
              listings={sections.newItems}
              onAddToCart={handleAddToCart}
            />
            <ProductSection
              id="sales"
              title="Sales"
              subtitle="Limited-time discounts from local stores"
              listings={sections.sales}
              onAddToCart={handleAddToCart}
            />
            <ProductSection
              id="featured-items"
              title="Featured Marketplace Items"
              subtitle="Popular items available from Jamaican businesses"
              listings={sections.featured}
              onAddToCart={handleAddToCart}
            />
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-navy text-slate-300 text-xs mt-16">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-white/5 py-3 text-center text-slate-300 hover:bg-white/10 hover:text-secondary transition"
        >
          Back to top
        </button>

        <div className="max-w-7xl mx-auto px-4 pt-10">
          <div className="flex items-center gap-2">
            <img src={islevendorIcon} alt="" className="h-7 w-7" />
            <span className="text-lg font-black tracking-tight text-white">
              isle<span className="text-primary">vendor</span>
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-8 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-white/10">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Get to Know Us</h4>
            <p className="text-slate-400">
              IsleVendor is Jamaica's multi-tenant sales and logistics network connecting local warehouses,
              resellers, small stores, and gig drivers.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Partner with IsleVendor</h4>
            <ul className="space-y-1 text-slate-400">
              <li><Link to="/opportunities/reseller" className="hover:text-secondary hover:underline">Reseller Sign Up</Link></li>
              <li><Link to="/opportunities/store" className="hover:text-secondary hover:underline">Add Your Store</Link></li>
              <li><Link to="/opportunities/warehouse" className="hover:text-secondary hover:underline">Register a Warehouse</Link></li>
              <li><Link to="/opportunities/driver" className="hover:text-secondary hover:underline">Deliver with IsleDash</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Deliver with Us</h4>
            <ul className="space-y-1 text-slate-400">
              <li><Link to="/opportunities/driver" className="hover:text-secondary hover:underline">Become a Delivery Driver</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Payment Processing</h4>
            <p className="text-slate-400">
              Powered by WiPay Jamaica with direct payouts to NCB, Scotiabank, Sagicor, and local JMD accounts.
            </p>
          </div>
        </div>

        <div className="py-6 text-center text-slate-500">© 2026 IsleVendor Jamaica.</div>
      </footer>
    </div>
  );
}
