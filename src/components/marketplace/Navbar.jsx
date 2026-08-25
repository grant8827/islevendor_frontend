import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Search, ShoppingCart, Menu, Headset, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * The one shared shopping navbar — used on every customer-facing page
 * (home, product detail, storefronts, cart, login/register, opportunity
 * pages) so navigation is consistent site-wide. Deliberately excludes the
 * seller-recruitment CTAs ("Become a Delivery Driver", "Register as
 * Affiliate", "Register Warehouse", "Add Your Store") — those stay unique
 * to the home page's hero and footer rather than being repeated everywhere.
 *
 * Search and category selection are driven entirely by the URL
 * (`?q=`/`?category=` on `/`), not local state, so this component works
 * identically no matter which page it's rendered on: submitting a search
 * or picking a category always takes you to the (filtered) home marketplace.
 */
export default function Navbar() {
  const { user } = useAuth();
  const { items } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  useEffect(() => {
    apiRequest('/commerce/listings', { auth: false })
      .then((listings) => {
        setCategories([...new Set(listings.map((l) => l.masterProduct.category))]);
      })
      .catch(() => {});
  }, []);

  const selectedCategory = searchParams.get('category') || 'All';

  function goToHomeWith(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== 'All') params.set(key, value);
      else params.delete(key);
    });
    navigate(`/${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    goToHomeWith({ q: searchInput });
  }

  return (
    <header className="bg-amazon-navy text-white sticky top-0 z-40">
      {/* Utility bar: customer service (left), account access (right) */}
      <div className="bg-slate-950 text-[11px] px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => notify('Customer support: support@islevendor.jm')}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
          >
            <Headset className="w-3.5 h-3.5" />
            <span>Customer Service</span>
          </button>

          {user ? (
            <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition">
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in</span>
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign up</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <span className="text-2xl font-black tracking-tight text-white">
            isle<span className="text-amazon-yellow">vendor</span>
          </span>
          {/*<span className="text-[10px] text-slate-400 font-mono italic">.jm</span>*/}
        </Link>

        <div className="hidden lg:flex items-center gap-1 text-xs hover:border hover:border-white p-1.5 rounded cursor-pointer">
          <MapPin className="w-4 h-4 text-amazon-yellow" />
          <div>
            <span className="text-slate-400 block text-[10px]">Deliver to</span>
            <span className="font-bold text-white">Island-wide, Jamaica</span>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl flex items-center">
          <div className="relative flex-1 flex rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amazon-yellow">
            <select
              value={selectedCategory}
              onChange={(e) => goToHomeWith({ category: e.target.value })}
              className="bg-slate-200 text-slate-800 text-xs px-3 py-2 font-medium border-r border-slate-300 focus:outline-none cursor-pointer hidden sm:block"
            >
              <option value="All">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products from local resellers..."
              className="flex-1 min-w-0 bg-white text-slate-900 px-4 py-2 text-sm focus:outline-none"
            />
            <button type="submit" className="bg-amazon-yellow hover:bg-amazon-orange text-slate-950 px-5 flex items-center justify-center transition">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 shrink-0">
          <Link to={user ? '/account' : '/login'} className="hidden md:flex flex-col text-left text-xs hover:border hover:border-white p-1 rounded">
            <span className="text-slate-400 text-[10px]">{user ? `Hello, ${user.fullName.split(' ')[0]}` : 'Hello, sign in'}</span>
            <span className="font-bold">{user ? 'Account & Orders' : 'Log in'}</span>
          </Link>

          <Link to="/cart" className="flex items-center gap-1 hover:border hover:border-white p-1.5 rounded relative">
            <div className="relative">
              <ShoppingCart className="w-7 h-7 text-white" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amazon-orange text-slate-950 font-black rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {items.length}
                </span>
              )}
            </div>
            <span className="font-bold text-xs hidden sm:inline">Cart</span>
          </Link>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="bg-amazon-lightNavy text-xs px-4 py-2 text-slate-200 border-t border-slate-700/50">
          <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto whitespace-nowrap">
            <button
              type="button"
              onClick={() => goToHomeWith({ category: 'All' })}
              className={`flex items-center gap-1 ${selectedCategory === 'All' ? 'text-amazon-yellow font-bold' : 'hover:text-white'}`}
            >
              <Menu className="w-4 h-4" />
              <span>All Products</span>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => goToHomeWith({ category: c })}
                className={selectedCategory === c ? 'text-amazon-yellow font-bold' : 'hover:text-white'}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
