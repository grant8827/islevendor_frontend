import { Phone, Circle, Undo2 } from 'lucide-react';

const STATUS_STYLES = {
  AWAITING_PAYMENT: 'bg-slate-100 text-slate-600 border-slate-200',
  PACKING: 'bg-amber-100 text-amber-700 border-amber-300',
  READY_FOR_PICKUP: 'bg-amber-100 text-amber-700 border-amber-300',
  PICKED_UP: 'bg-secondary/10 text-secondary border-secondary/30',
  DELIVERED: 'bg-primary/10 text-primary-dark border-primary/30',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
  REFUNDED: 'bg-red-100 text-red-700 border-red-300',
};

const orderNumberOf = (o) => o.id.slice(0, 8);
const itemTitleOf = (o) => o.storeListing?.masterProduct?.title ?? o.shopProduct?.title ?? 'Item';

/**
 * Per-order delivery timeline — what a warehouse/shop/reseller reads when a
 * buyer says "I never got this, what happened?" Each card is one order:
 * its assigned driver (if any, with a live online/offline dot), then every
 * OrderTrackingEvent for it in order — automatic ones logged at each status
 * change (see src/lib/tracking.ts and its call sites) interleaved with any
 * free-text update the driver posted manually along the way (see
 * dispatch.routes.ts's POST /orders/:id/note).
 */
export default function OrderTrackingList({ orders }) {
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {itemTitleOf(o)} <span className="font-mono font-normal text-slate-400">#{orderNumberOf(o)}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{o.deliveryAddress}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${STATUS_STYLES[o.status] || STATUS_STYLES.AWAITING_PAYMENT}`}>
              {o.status.replaceAll('_', ' ')}
            </span>
          </div>

          {o.driver && (
            <div className="flex items-center gap-3 text-xs text-slate-600 bg-surface rounded-lg px-3 py-2 mb-4">
              <Circle
                className={`w-2 h-2 shrink-0 ${o.driver.driverProfile?.isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-300 text-slate-300'}`}
              />
              <span className="font-bold text-slate-900">{o.driver.fullName}</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Phone className="w-3 h-3" /> {o.driver.phoneNumber}
              </span>
              <span className="text-slate-400">{o.driver.driverProfile?.isOnline ? 'Online now' : 'Offline'}</span>
            </div>
          )}

          {o.trackingEvents?.length > 0 ? (
            <ol className="space-y-3 border-l-2 border-slate-100 pl-4">
              {o.trackingEvents.map((e) => (
                <li key={e.id} className="relative text-xs">
                  <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-primary" />
                  <p className="font-bold text-slate-900">{e.status.replaceAll('_', ' ')}</p>
                  {e.note && <p className="text-slate-600 mt-0.5">{e.note}</p>}
                  <p className="text-slate-400 mt-0.5">{new Date(e.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-slate-400">No tracking events yet.</p>
          )}

          {o.refund && (
            <p className="flex items-center gap-1 text-xs text-red-600 mt-3">
              <Undo2 className="w-3 h-3" /> Refunded: {o.refund.reason}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
