import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgePercent, MapPin, PackageCheck, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/marketplace/ProductCard.jsx';
import Navbar from '../components/marketplace/Navbar.jsx';
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
          <ProductCard key={listing.id} listing={listing} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  );
}

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

  function handleAddToCart(listing) {
    addItem(listing);
    notify(`Added ${listing.masterProduct.title} to your cart!`);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.12fr_0.88fr] lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-200">
              <MapPin className="h-3.5 w-3.5" />
              Made for shoppers across Jamaica
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Everything you need,
              <span className="block text-primary">closer to home.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              Browse great products, compare local offers, and order from Jamaican businesses.
              IsleVendor makes shopping across the island simple.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#marketplace-items"
                className="btn-primary inline-flex items-center gap-2 px-5 py-3 shadow-lg shadow-black/20"
              >
                Shop marketplace
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#sales"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
              >
                <BadgePercent className="h-4 w-4" />
                Browse deals
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-primary" /> New items every day</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Shop with confidence</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Convenient delivery</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/25 backdrop-blur-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">Your local marketplace</p>
                  <h2 className="mt-1 text-xl font-black text-white">More ways to shop</h2>
                </div>
                <img src={islevendorIcon} alt="" className="h-12 w-12 rounded-xl bg-white p-1" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-ink shadow-lg">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-dark"><ShoppingBag className="h-5 w-5" /></span>
                  <div><p className="font-bold text-navy">Find something new</p><p className="text-xs text-slate-500">Fresh products from businesses across Jamaica</p></div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-ink shadow-lg">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary-dark"><BadgePercent className="h-5 w-5" /></span>
                  <div><p className="font-bold text-navy">Save on local deals</p><p className="text-xs text-slate-500">See discounted prices clearly while you browse</p></div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-ink shadow-lg">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy/10 text-navy"><Truck className="h-5 w-5" /></span>
                  <div><p className="font-bold text-navy">Get it where you need it</p><p className="text-xs text-slate-500">Convenient fulfillment based on seller location</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SECTIONS */}
      <main id="marketplace-items" className="max-w-7xl mx-auto px-4 py-8 space-y-12 scroll-mt-4">
        {loading && <p className="text-sm text-ink/70">Loading products…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-ink/70">No products match your search yet.</p>
        )}

        {!loading && !error && (
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
