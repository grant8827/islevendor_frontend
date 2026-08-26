import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ImageOff, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../api/client.js';
import Navbar from '../components/marketplace/Navbar.jsx';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clear, subtotalJmd } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheckout() {
    setError(null);

    if (!user) {
      navigate('/login');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Enter a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      // Our order model is one product per order (no line-items table yet),
      // so a multi-item cart places one real order per line.
      for (const item of items) {
        await apiRequest('/orders', {
          method: 'POST',
          body: {
            kind: item.kind,
            storeId: item.storeId,
            masterProductId: item.masterProductId,
            quantity: item.quantity,
            deliveryAddress,
          },
        });
      }
      clear();
      notify(`Order${items.length > 1 ? 's' : ''} placed — awaiting payment confirmation.`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Continue shopping</span>
        </Link>

        <h1 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Your Cart
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-600 mb-4">Your cart is empty.</p>
            <Link
              to="/"
              className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5"
            >
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ITEMS */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.listingId} className="flex items-start gap-4 p-5">
                  <div className="h-20 w-20 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImageOff className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.listingId}`} className="text-sm font-bold text-slate-900 hover:text-secondary transition line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">Sold by {item.storeName}</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      J${item.retailPriceJmd.toLocaleString()}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600">
                        Qty
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.listingId, Number(e.target.value))}
                          className="w-16 text-xs border border-slate-300 rounded px-2 py-1"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(item.listingId)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-black text-slate-900 shrink-0">
                    J${(item.retailPriceJmd * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* CHECKOUT SUMMARY */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 lg:sticky lg:top-24">
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} items)</span>
                <span>J${subtotalJmd.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500">Delivery fee and platform commission are added at checkout.</p>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Delivery address</label>
                <input
                  type="text"
                  placeholder="Where should we deliver this?"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
              {!user && <p className="text-xs text-slate-500">You'll need to log in to check out.</p>}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={placing}
                className="btn-primary w-full disabled:opacity-60 text-sm py-3"
              >
                {placing ? 'Placing order…' : user ? 'Proceed to Checkout' : 'Log in to Checkout'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
