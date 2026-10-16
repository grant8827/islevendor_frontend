import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ImageOff, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../api/client.js';
import DeliveryAddressInput from '../components/DeliveryAddressInput.jsx';
import { useDeliveryAddress } from '../hooks/useDeliveryAddress.js';
import Navbar from '../components/marketplace/Navbar.jsx';

const formatJmd = (value) => `J$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const quoteKey = (item) => `${item.kind}:${item.storeId}:${item.masterProductId}`;

export default function CartPage() {
  const { items, removeItem, updateQuantity, clear, subtotalJmd } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const delivery = useDeliveryAddress(user);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  // The server's view of the cart (POST /orders/quote): live prices, stock,
  // and each seller's delivery options. Null while loading.
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  // Delivery method chosen per seller, keyed by the quote's sellerKey.
  const [choices, setChoices] = useState({});
  const requestId = useRef(0);

  const loadQuote = useCallback(() => {
    if (items.length === 0) return;
    const id = ++requestId.current;
    setQuoteError(null);
    apiRequest('/orders/quote', {
      method: 'POST',
      auth: false,
      body: { items: items.map(({ kind, storeId, masterProductId, quantity }) => ({ kind, storeId, masterProductId, quantity })) },
    })
      .then((data) => {
        if (id !== requestId.current) return;
        setQuote(data);
        // Keep a choice the seller still offers; otherwise default to their first option.
        setChoices((current) =>
          Object.fromEntries(
            data.sellers.map((seller) => [
              seller.key,
              seller.options.some((o) => o.method === current[seller.key]) ? current[seller.key] : seller.options[0]?.method,
            ]),
          ),
        );
      })
      .catch((err) => {
        if (id === requestId.current) setQuoteError(err.message);
      });
  }, [items]);

  useEffect(loadQuote, [loadQuote]);

  const quoted = new Map((quote?.items ?? []).map((line) => [quoteKey(line), line]));
  const lineFor = (item) => quoted.get(quoteKey(item));

  // Items grouped by the business that ships them, each with the option the
  // customer picked. The quote prices each option for all of that seller's
  // items together (first item full fee, extras at the seller's rate).
  const groups = (quote?.sellers ?? []).map((seller) => {
    const groupItems = items.filter((item) => lineFor(item)?.sellerKey === seller.key);
    const option = seller.options.find((o) => o.method === choices[seller.key]) ?? null;
    return { seller, items: groupItems, option, deliveryTotal: option ? Number(option.feeJmd) : 0 };
  });
  const ungrouped = items.filter((item) => !lineFor(item)?.sellerKey);
  const unavailable = items.filter((item) => lineFor(item) && !lineFor(item).available);
  const goodsTotal = (quote?.items ?? []).filter((l) => l.available).reduce((sum, l) => sum + Number(l.goodsTotalJmd), 0);
  const deliveryTotal = groups.reduce((sum, g) => sum + g.deliveryTotal, 0);
  const needsAddress = groups.some((g) => g.option?.needsAddress);
  const sellerWithoutOptions = groups.find((g) => g.seller.options.length === 0);
  const canCheckout = quote && unavailable.length === 0 && ungrouped.length === 0 && !sellerWithoutOptions;

  async function handleCheckout() {
    setError(null);

    if (!user) {
      navigate('/login');
      return;
    }
    if (needsAddress && !delivery.text.trim()) {
      setError('Enter a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      // The whole cart in one request: the server places every item or none,
      // then starts one WiPay card payment for the total.
      const { payment } = await apiRequest('/orders/checkout', {
        method: 'POST',
        body: {
          items: items.map(({ kind, storeId, masterProductId, quantity }) => ({ kind, storeId, masterProductId, quantity })),
          deliveryMethods: Object.fromEntries(groups.map((g) => [g.seller.key, g.option.method])),
          ...delivery.payload(needsAddress),
        },
      });
      clear();
      if (payment?.checkoutUrl) {
        // Off to WiPay's card page; WiPay brings the customer back to their
        // payment status page.
        window.location.assign(payment.checkoutUrl);
        return;
      }
      // The orders are saved even if paying couldn't start — they can pay
      // from their status page or account.
      notify(payment?.message ? `Order placed. ${payment.message}` : 'Order placed.');
      navigate(payment?.id ? `/payment/${payment.id}` : '/account?tab=orders');
    } catch (err) {
      setError(err.message);
      loadQuote();
    } finally {
      setPlacing(false);
    }
  }

  const renderItem = (item) => {
    const line = lineFor(item);
    return (
      <div key={item.listingId} className="flex items-start gap-4 p-5">
        <div className="h-20 w-20 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
          {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" /> : <ImageOff className="w-6 h-6 text-slate-300" />}
        </div>

        <div className="flex-1 min-w-0">
          <Link to={`/product/${item.listingId}`} className="text-sm font-bold text-slate-900 hover:text-secondary transition line-clamp-2">
            {item.title}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">Sold by {item.storeName}</p>
          {line && !line.available && (
            <p className="text-xs font-bold text-red-600 mt-1" role="alert">
              {line.reason} — remove it or lower the quantity to check out.
            </p>
          )}

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
            <button type="button" onClick={() => removeItem(item.listingId)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition">
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>

        <p className="text-sm font-black text-slate-900 shrink-0">
          {line?.available ? formatJmd(line.goodsTotalJmd) : formatJmd(item.retailPriceJmd * item.quantity)}
        </p>
      </div>
    );
  };

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
            {/* ITEMS, grouped by who ships them */}
            <div className="lg:col-span-2 space-y-4">
              {quoteError && (
                <div className="bg-white rounded-2xl border border-red-200 p-4 text-sm text-red-600" role="alert">
                  Couldn't check prices and delivery options: {quoteError}{' '}
                  <button type="button" onClick={loadQuote} className="underline font-bold">
                    Try again
                  </button>
                </div>
              )}
              {!quote && !quoteError && <p className="text-sm text-slate-500">Checking prices and delivery options…</p>}

              {groups.map((group) => (
                <section key={group.seller.key} className="bg-white rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="px-5 pt-4 text-xs uppercase tracking-wide text-slate-500">Shipped by {group.seller.name}</h2>
                  <div className="divide-y divide-slate-100">{group.items.map(renderItem)}</div>

                  <fieldset className="border-t border-slate-100 px-5 py-4">
                    <legend className="sr-only">Delivery for items shipped by {group.seller.name}</legend>
                    <p className="text-xs font-bold text-slate-700 mb-2">How do you want to get {group.items.length > 1 ? 'these' : 'it'}?</p>
                    {group.seller.options.length === 0 && (
                      <p className="text-xs text-red-600" role="alert">
                        This seller hasn't set up any delivery options yet, so these items can't be ordered right now.
                      </p>
                    )}
                    <div className="space-y-2">
                      {group.seller.options.map((option) => (
                        <label
                          key={option.method}
                          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                            choices[group.seller.key] === option.method ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`delivery-${group.seller.key}`}
                            className="mt-1 accent-[var(--primary)]"
                            checked={choices[group.seller.key] === option.method}
                            onChange={() => setChoices((c) => ({ ...c, [group.seller.key]: option.method }))}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="flex justify-between gap-3 text-sm font-bold text-slate-900">
                              {option.label}
                              <span>{Number(option.feeJmd) === 0 ? 'Free' : formatJmd(option.feeJmd)}</span>
                            </span>
                            {option.detail && <span className="block text-xs text-slate-500 mt-0.5">{option.detail}</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                    {group.seller.units > 1 && group.option && Number(group.option.feeJmd) > 0 && (
                      <p className="text-[11px] text-slate-500 mt-2">
                        {formatJmd(group.option.firstItemFeeJmd)} for the first item, {formatJmd(group.option.extraItemFeeJmd)} for each of the other {group.seller.units - 1}.
                      </p>
                    )}
                  </fieldset>
                </section>
              ))}

              {/* Items the quote couldn't place under a seller (no longer sold, or still loading). */}
              {ungrouped.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">{ungrouped.map(renderItem)}</div>
              )}
            </div>

            {/* CHECKOUT SUMMARY */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 lg:sticky lg:top-24">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-700">
                  <dt>Items ({items.reduce((n, i) => n + i.quantity, 0)})</dt>
                  <dd>{quote ? formatJmd(goodsTotal) : formatJmd(subtotalJmd)}</dd>
                </div>
                <div className="flex justify-between text-slate-700">
                  <dt>Delivery</dt>
                  <dd>{quote ? (deliveryTotal === 0 ? 'Free' : formatJmd(deliveryTotal)) : '—'}</dd>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <dt>{quote?.cardFeePaidBy === 'customer' ? 'Total before card fee' : 'Total'}</dt>
                  <dd>{quote ? formatJmd(goodsTotal + deliveryTotal) : '—'}</dd>
                </div>
              </dl>

              {needsAddress && <DeliveryAddressInput delivery={delivery} />}

              {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
              {!user && <p className="text-xs text-slate-500">You'll need to log in to check out.</p>}

              <p className="text-[11px] text-slate-500">
                You'll pay securely by card on WiPay's page, then come back here.
                {quote?.cardFeePaidBy === 'customer' && " WiPay adds a card processing fee there, so the amount charged will be a little higher than this total."}
                {quote?.cardFeePaidBy === 'split' && ' WiPay adds part of the card processing fee there, so the amount charged may be a little higher than this total.'}
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={placing || !canCheckout}
                className="btn-primary w-full disabled:opacity-60 text-sm py-3"
              >
                {placing ? 'Placing order…' : user ? 'Pay with card' : 'Log in to Checkout'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
