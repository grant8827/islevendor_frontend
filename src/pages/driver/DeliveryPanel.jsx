import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, MessageSquarePlus, Package, Phone, Wifi, WifiOff } from 'lucide-react';
import { getDeliveries } from '../../api/drivers.js';
import { getSocket, disconnectSocket } from '../../lib/socket.js';
import { useToast } from '../../context/ToastContext.jsx';
import JobOfferModal from './JobOfferModal.jsx';
import MarkDeliveredModal from './MarkDeliveredModal.jsx';
import PostTrackingNoteModal from './PostTrackingNoteModal.jsx';

// How often a device's location is re-sent while online — matches the
// interval assumed server-side (see dispatch.gateway.ts's driver:heartbeat
// comment, "device transmits lat/lng every ~10s while online").
const HEARTBEAT_INTERVAL_MS = 10_000;

const SUB_TABS = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

// Sidebar "Delivery" tab: Delivery (in-progress, accepted) / Delivered
// sub-tabs, a live JOB_OFFER popup while online, and the mark-delivered
// photo flow. Owns the socket connection's lifetime — a driver only needs
// live offers while this panel is mounted, not the whole time they're
// anywhere in the dashboard.
export default function DeliveryPanel() {
  const [subTab, setSubTab] = useState('delivery');
  const [deliveries, setDeliveries] = useState({ inProgress: [], delivered: [] });
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [offer, setOffer] = useState(null); // { orderId, expiresInSeconds }
  const [deliveringOrderId, setDeliveringOrderId] = useState(null);
  const [notingOrderId, setNotingOrderId] = useState(null);
  const heartbeatRef = useRef(null);
  const { notify } = useToast();

  const load = useCallback(() => {
    getDeliveries()
      .then(setDeliveries)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onJobOffer = ({ orderId, expiresInSeconds }) => setOffer({ orderId, expiresInSeconds });
    const onJobAssigned = ({ orderId }) => {
      setOffer((current) => (current?.orderId === orderId ? null : current));
      notify('Delivery accepted!');
      load();
    };
    const onJobOfferExpired = ({ orderId }) => {
      setOffer((current) => (current?.orderId === orderId ? null : current));
      notify('That offer is no longer available.');
    };
    const onJobOfferTaken = ({ orderId }) => {
      setOffer((current) => (current?.orderId === orderId ? null : current));
    };

    socket.on('JOB_OFFER', onJobOffer);
    socket.on('JOB_ASSIGNED', onJobAssigned);
    socket.on('JOB_OFFER_EXPIRED', onJobOfferExpired);
    socket.on('JOB_OFFER_TAKEN', onJobOfferTaken);

    return () => {
      socket.off('JOB_OFFER', onJobOffer);
      socket.off('JOB_ASSIGNED', onJobAssigned);
      socket.off('JOB_OFFER_EXPIRED', onJobOfferExpired);
      socket.off('JOB_OFFER_TAKEN', onJobOfferTaken);
    };
  }, [load, notify]);

  // Full teardown only when the driver leaves this tab/dashboard — clears
  // the heartbeat timer and drops the socket so a stale connection doesn't
  // linger (a later visit reconnects fresh via getSocket()).
  useEffect(
    () => () => {
      clearInterval(heartbeatRef.current);
      disconnectSocket();
    },
    [],
  );

  function toggleOnline() {
    const socket = getSocket();
    if (!socket) return;

    if (online) {
      socket.emit('driver:online', false);
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      setOnline(false);
      setOffer(null);
      return;
    }

    if (!navigator.geolocation) {
      notify("Your browser doesn't support location — can't go online without it.");
      return;
    }

    const sendHeartbeat = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => socket.emit('driver:heartbeat', { lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => notify('Location permission is needed to go online.'),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 8_000 },
      );
    };

    socket.emit('driver:online', true);
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    setOnline(true);
  }

  function acceptOffer() {
    const socket = getSocket();
    if (!socket || !offer) return;
    socket.emit('driver:acceptJob', { orderId: offer.orderId });
  }

  const rows = subTab === 'delivery' ? deliveries.inProgress : deliveries.delivered;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-bold text-navy text-lg">Delivery</h2>
            <p className="text-xs text-slate-500">Go online to receive delivery offers near you.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition ${
            online ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
          }`}
        >
          {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {online ? 'Online' : 'Go Online'}
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {SUB_TABS.map((t) => {
          const count = t.key === 'delivery' ? deliveries.inProgress.length : deliveries.delivered.length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                subTab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              {t.label}
              {count > 0 && <span className="ml-1.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-slate-500">
          {subTab === 'delivery' ? 'No deliveries in progress. Go online to start receiving offers.' : 'No completed deliveries yet.'}
        </p>
      )}

      <div className="space-y-3">
        {rows.map((o) => (
          <div key={o.id} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{o.itemTitle}</p>
              <p className="text-xs text-slate-500">{o.sellerName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 shrink-0" /> {o.deliveryAddress}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0" /> {o.buyerName} · {o.buyerPhone}
              </p>
            </div>
            {subTab === 'delivery' ? (
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setNotingOrderId(o.id)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:text-navy hover:border-navy transition"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Post Update
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveringOrderId(o.id)}
                  className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg transition"
                >
                  Mark Delivered
                </button>
              </div>
            ) : (
              o.proofOfDeliveryImageUrl && (
                <a href={o.proofOfDeliveryImageUrl} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={o.proofOfDeliveryImageUrl}
                    alt="Proof of delivery"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                </a>
              )
            )}
          </div>
        ))}
      </div>

      {offer && <JobOfferModal offer={offer} onAccept={acceptOffer} onDismiss={() => setOffer(null)} />}
      {deliveringOrderId && (
        <MarkDeliveredModal
          orderId={deliveringOrderId}
          onClose={() => setDeliveringOrderId(null)}
          onDelivered={() => {
            setDeliveringOrderId(null);
            load();
          }}
        />
      )}
      {notingOrderId && (
        <PostTrackingNoteModal
          orderId={notingOrderId}
          onClose={() => setNotingOrderId(null)}
          onPosted={() => setNotingOrderId(null)}
        />
      )}
    </div>
  );
}
