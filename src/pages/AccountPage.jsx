import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, Package, ImageOff } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Navbar from '../components/marketplace/Navbar.jsx';
import StarRating from '../components/marketplace/StarRating.jsx';

const STATUS_LABELS = {
  AWAITING_PAYMENT: 'Awaiting payment',
  PACKING: 'Being packed',
  READY_FOR_PICKUP: 'Ready for pickup',
  PICKED_UP: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  AWAITING_PAYMENT: 'bg-slate-100 text-slate-600',
  PACKING: 'bg-amber-100 text-amber-700',
  READY_FOR_PICKUP: 'bg-amber-100 text-amber-700',
  PICKED_UP: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function AccountPanel() {
  const { user } = useAuth();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
      <h2 className="font-bold text-slate-900 text-lg mb-4">Account Details</h2>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Name</dt>
          <dd className="font-semibold text-slate-900">{user.fullName}</dd>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Email</dt>
          <dd className="font-semibold text-slate-900">{user.email}</dd>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Phone</dt>
          <dd className="font-semibold text-slate-900">{user.phoneNumber}</dd>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <dt className="text-slate-500">Account type</dt>
          <dd className="font-semibold text-slate-900">{user.role}</dd>
        </div>
        {user.createdAt && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Member since</dt>
            <dd className="font-semibold text-slate-900">
              {new Date(user.createdAt).toLocaleDateString('en-JM', { year: 'numeric', month: 'long', day: 'numeric' })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// One item in an order, with its own rating once the order is delivered —
// an order can hold several items and each is rated separately.
function OrderItemRow({ order, item, onRated }) {
  const { notify } = useToast();
  const [rating, setRating] = useState(item.myRating);
  const [commentDraft, setCommentDraft] = useState(item.myComment || '');
  const [savingComment, setSavingComment] = useState(false);
  const rateable = order.status === 'DELIVERED' && item.listingId;

  async function save(body, thanks) {
    try {
      await apiRequest('/ratings', { method: 'POST', body: { orderId: order.id, listingId: item.listingId, ...body } });
      notify(thanks);
      onRated?.();
    } catch (err) {
      notify(err.message);
    }
  }

  async function submitRating(stars) {
    setRating(stars);
    await save({ rating: stars }, 'Thanks for rating this item!');
  }

  async function submitComment(e) {
    e.preventDefault();
    setSavingComment(true);
    await save({ rating, comment: commentDraft }, 'Feedback saved — thanks!');
    setSavingComment(false);
  }

  return (
    <div className="flex items-start gap-3">
      <div className="h-14 w-14 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" /> : <ImageOff className="w-5 h-5 text-slate-300" />}
      </div>
      <div className="flex-1 min-w-0">
        {item.listingId ? (
          <Link to={`/product/${item.listingId}`} className="text-sm font-bold text-slate-900 hover:text-secondary transition">
            {item.title}
          </Link>
        ) : (
          <p className="text-sm font-bold text-slate-900">{item.title}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">Qty {item.quantity}</p>

        {rateable && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{rating ? 'Your rating:' : 'Rate this item:'}</span>
              <StarRating value={rating || 0} interactive onChange={submitRating} size="w-4 h-4" />
            </div>
            {rating && (
              <form onSubmit={submitComment} className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Add a comment (optional)…"
                  maxLength={1000}
                  aria-label={`Comment on ${item.title}`}
                  className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-secondary"
                />
                <button type="submit" disabled={savingComment} className="btn-secondary disabled:opacity-60 text-[11px] px-3 py-1.5 shrink-0">
                  {savingComment ? 'Saving…' : 'Save'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const DELIVERY_LABELS = { ISLEDASH: 'IsleDash delivery', SELLER_DELIVERY: 'Delivered by the seller', PICKUP: 'Pick up' };

function OrderRow({ order, onRated }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          {order.sellerName && <p className="text-xs font-bold text-slate-700">From {order.sellerName}</p>}
          <p className="text-xs text-slate-500 mt-0.5">
            #{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString('en-JM', { year: 'numeric', month: 'short', day: 'numeric' })}
            {order.deliveryMethod && <> · {DELIVERY_LABELS[order.deliveryMethod]}</>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
          <p className="text-sm font-black text-slate-900 mt-1.5">J${Number(order.totalPaidJmd).toLocaleString()}</p>
        </div>
      </div>
      <div className="space-y-3">
        {order.items.map((item) => (
          <OrderItemRow key={item.id} order={order} item={item} onRated={onRated} />
        ))}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const [orders, setOrders] = useState(null);

  function load() {
    apiRequest('/orders/mine').then(setOrders);
  }

  useEffect(load, []);

  if (orders === null) return <p className="text-sm text-slate-500">Loading…</p>;

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <Package className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-600 mb-4">You haven't placed any orders yet.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5">
          Browse the marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} onRated={load} />
      ))}
    </div>
  );
}

const TABS = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'orders', label: 'Orders', icon: Package },
];

export default function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'account';

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-slate-900 mb-6">My Account</h1>

        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSearchParams(key === 'account' ? {} : { tab: key })}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
                activeTab === key ? 'border-primary text-navy' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'account' && <AccountPanel />}
        {activeTab === 'orders' && <OrdersPanel />}
      </main>
    </div>
  );
}
