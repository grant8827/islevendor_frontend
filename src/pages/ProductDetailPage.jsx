import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImageOff, Zap, ShoppingBag } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/marketplace/ProductCard.jsx';
import Navbar from '../components/marketplace/Navbar.jsx';
import StarRating from '../components/marketplace/StarRating.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { notify } = useToast();

  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [buyNowError, setBuyNowError] = useState(null);
  // Rating eligibility: only set once we know — undefined means "haven't
  // checked yet / not logged in", so the "rate this" widget stays hidden
  // rather than flashing in incorrectly.
  const [myRating, setMyRating] = useState(null);
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Guards against a stale response (e.g. from a previous :id) landing after
  // a newer one when navigating from one product's detail page to another's.
  const requestId = useRef(0);
  useEffect(() => {
    const reqId = ++requestId.current;
    setListing(null);
    setError(null);
    setActiveImage(0);
    setBuyNowOpen(false);
    setMyRating(null);
    setRatingOrderId(null);
    setCommentDraft('');
    apiRequest(`/commerce/listings/${id}`, { auth: false })
      .then((data) => {
        if (reqId !== requestId.current) return;
        setListing(data);
      })
      .catch((err) => {
        if (reqId !== requestId.current) return;
        setError(err.message);
      });

    // Only a customer with a DELIVERED order for this exact item can rate
    // it — ask the server rather than guessing client-side.
    if (user) {
      apiRequest(`/ratings/mine?listingId=${id}`)
        .then((data) => {
          if (reqId !== requestId.current) return;
          if (data.eligible) {
            setRatingOrderId(data.orderId);
            setMyRating(data.myRating);
            setCommentDraft(data.myComment || '');
          }
        })
        .catch(() => {});
    }
  }, [id, user]);

  async function submitRating(stars) {
    setMyRating(stars); // optimistic — it's just a star click, not a form
    try {
      await apiRequest('/ratings', { method: 'POST', body: { orderId: ratingOrderId, rating: stars } });
      notify('Thanks for rating this item!');
      // Refresh the average shown next to the stars.
      apiRequest(`/commerce/listings/${id}`, { auth: false }).then(setListing).catch(() => {});
    } catch (err) {
      notify(err.message);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    setSavingComment(true);
    try {
      await apiRequest('/ratings', { method: 'POST', body: { orderId: ratingOrderId, rating: myRating, comment: commentDraft } });
      notify('Feedback saved — thanks!');
    } catch (err) {
      notify(err.message);
    } finally {
      setSavingComment(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-3" role="alert">{error}</p>
            <Link to="/" className="text-sm text-secondary hover:underline">Back to marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  const { masterProduct, store, retailPriceJmd, originalPriceJmd, discountPercent = 0, shipFromParish, rating, moreFromSeller, recommended } = listing;
  const images = masterProduct.images?.length ? masterProduct.images : masterProduct.imageUrl ? [masterProduct.imageUrl] : [];
  const inStock = masterProduct.stockQuantity > 0;

  function handleAddToCart(l) {
    addItem(l);
    notify(`Added ${l.masterProduct.title} to your cart!`);
  }

  function openBuyNow() {
    if (!user) {
      navigate('/login');
      return;
    }
    setBuyNowError(null);
    setBuyNowOpen(true);
  }

  async function handleBuyNow(e) {
    e.preventDefault();
    if (!deliveryAddress.trim()) {
      setBuyNowError('Enter a delivery address.');
      return;
    }
    setBuyNowError(null);
    setPlacing(true);
    try {
      // Buy Now is deliberately independent of the cart — it places this one
      // item straight away without touching whatever's already sitting in
      // the customer's cart.
      await apiRequest('/orders', {
        method: 'POST',
        body: {
          kind: listing.kind,
          storeId: listing.storeId,
          masterProductId: listing.masterProductId,
          quantity: 1,
          deliveryAddress,
        },
      });
      notify('Order placed — awaiting payment confirmation.');
      navigate('/dashboard');
    } catch (err) {
      setBuyNowError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to marketplace</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* GALLERY */}
          <div>
            <div className="h-96 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden mb-3">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={masterProduct.title} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <ImageOff className="w-14 h-14" />
                  <span className="text-xs uppercase tracking-wide">No image yet</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex items-center justify-center bg-slate-100 shrink-0 transition ${
                      i === activeImage ? 'border-primary' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div className="space-y-4">
            <span className="inline-block bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {masterProduct.category}
            </span>
            <h1 className="text-2xl font-black text-slate-900">{masterProduct.title}</h1>

            <div>
              {discountPercent > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base text-slate-400 line-through">J${Number(originalPriceJmd).toLocaleString()}</span>
                  <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded-full">-{discountPercent}%</span>
                </div>
              )}
              <span className="text-sm text-slate-500 align-top">J$</span>
              <span className={`text-4xl font-black ${discountPercent > 0 ? 'text-red-600' : 'text-slate-900'}`}>{Number(retailPriceJmd).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="bg-secondary text-white text-[9px] font-black italic px-1 rounded">IsleDash</span>
              <span className={`font-semibold ${inStock ? 'text-slate-700' : 'text-red-600'}`}>
                {inStock
                  ? `Ships from ${shipFromParish || 'Jamaica'} — ${masterProduct.stockQuantity} available`
                  : 'Out of stock'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-100">
              Sold by <strong className="text-slate-800">{store.storeName}</strong>
            </div>

            {/* RATINGS — average up top, and a "rate this" widget for
                anyone who's actually received this item (see the /ratings/mine
                check above; the widget only appears once that confirms they can). */}
            <div className="space-y-1.5">
              <StarRating value={rating.average || 0} count={rating.count} />
              {ratingOrderId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {myRating ? 'Your rating:' : 'Rate this purchase:'}
                  </span>
                  <StarRating value={myRating || 0} interactive onChange={submitRating} size="w-5 h-5" />
                </div>
              )}
              {ratingOrderId && myRating && (
                <form onSubmit={submitComment} className="pt-1 space-y-2">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add a comment about this item (optional)…"
                    rows={2}
                    maxLength={1000}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-secondary resize-y"
                  />
                  <button type="submit" disabled={savingComment} className="btn-secondary disabled:opacity-60 text-xs px-4 py-2">
                    {savingComment ? 'Saving…' : 'Save Feedback'}
                  </button>
                </form>
              )}
            </div>

            {masterProduct.description && (
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-1">Description</h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{masterProduct.description}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={openBuyNow}
                disabled={!inStock}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm py-3 shadow flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {inStock ? 'Buy Now' : 'Out of stock'}
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(listing)}
                disabled={!inStock}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm py-3 shadow flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>
            </div>

            {buyNowOpen && (
              <form onSubmit={handleBuyNow} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">Deliver this one item now</p>
                <input
                  type="text"
                  placeholder="Delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
                />
                {buyNowError && <p className="text-xs text-red-600" role="alert">{buyNowError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={placing}
                    className="btn-secondary flex-1 disabled:opacity-60 text-xs py-2.5"
                  >
                    {placing ? 'Placing order…' : 'Place Order'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyNowOpen(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* MORE FROM THIS SELLER */}
        {moreFromSeller?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-navy mb-4 border-b border-slate-200 pb-3">
              More from {store.storeName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {moreFromSeller.map((l) => (
                <ProductCard key={l.id} listing={l} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>
        )}

        {/* SIMILAR ITEMS */}
        {recommended?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-navy mb-4 border-b border-slate-200 pb-3">Similar Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.map((l) => (
                <ProductCard key={l.id} listing={l} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
