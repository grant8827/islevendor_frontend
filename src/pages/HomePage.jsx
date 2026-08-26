import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Store, Warehouse } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/marketplace/ProductCard.jsx';
import Navbar from '../components/marketplace/Navbar.jsx';
import islevendorIcon from '../assets/islevendor-icon.png';

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

  function handleAddToCart(listing) {
    addItem(listing);
    notify(`Added ${listing.masterProduct.title} to your cart!`);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* HERO */}
      <div className="relative bg-linear-to-r from-navy via-navy to-slate-900 text-white overflow-hidden py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-xl">
            <span className="bg-primary/20 text-primary border border-primary/40 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Jamaica Wholesale Ecosystem
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Warehouse Direct. Sold by Local Marketers.
            </h1>
            <p className="text-slate-300 text-sm">
              Browse items imported directly from Kingston warehouses by independent Jamaican resellers.
              Delivered fast by local drivers.
            </p>

            {/*<div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/opportunities/reseller"
                className="btn-primary text-xs px-5 py-3 shadow-lg flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>Register as Reseller (Sell Without Stock)</span>
              </Link>
              <Link
                to="/opportunities/warehouse"
                className="btn-secondary text-xs px-5 py-3 flex items-center gap-2"
              >
                <Warehouse className="w-4 h-4" />
                <span>Register Warehouse</span>
              </Link>
            </div>*/}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur border border-white/15 p-4 rounded-xl text-center">
              <span className="text-2xl font-black text-primary">100%</span>
              <p className="text-[11px] text-slate-300">Local Bank Payouts (NCB/Scotia)</p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/15 p-4 rounded-xl text-center">
              <span className="text-2xl font-black text-secondary">Same-Day</span>
              <p className="text-[11px] text-slate-300">IsleDash Courier Dispatch</p>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-navy">Featured Marketplace Items</h2>
            <p className="text-xs text-ink/70">Showing items available for delivery across Kingston &amp; St. Andrew</p>
          </div>
          <span className="text-xs text-ink/60 font-mono">{filtered.length} Results</span>
        </div>

        {loading && <p className="text-sm text-ink/70">Loading products…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-ink/70">No products match your search yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((listing) => (
            <ProductCard key={listing.id} listing={listing} onAddToCart={handleAddToCart} />
          ))}
        </div>
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
            <h4 className="font-bold text-white text-sm">Sell with Us</h4>
            <ul className="space-y-1 text-slate-400">
              <li><Link to="/opportunities/reseller" className="hover:text-secondary hover:underline">Reseller Sign Up</Link></li>
              <li><Link to="/opportunities/store" className="hover:text-secondary hover:underline">Add Your Store</Link></li>
              <li><Link to="/opportunities/warehouse" className="hover:text-secondary hover:underline">Register a Warehouse</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">Deliver with Us</h4>
            <ul className="space-y-1 text-slate-400">
              <li><Link to="/opportunities/driver" className="hover:text-secondary hover:underline">Become a Deliver Driver</Link></li>
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
