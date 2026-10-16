import { Navigation } from 'lucide-react';
import { mapsLink, orderPin } from '../lib/address.js';

// "Open in Maps" for an order the customer pinned on a map; nothing if they didn't.
export default function OpenInMaps({ order, className = '' }) {
  const pin = orderPin(order);
  if (!pin || order.deliveryMethod === 'PICKUP') return null;
  return (
    <a
      href={mapsLink(pin)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 font-bold text-secondary-dark hover:underline ${className}`}
    >
      <Navigation className="w-3.5 h-3.5" /> Open in Maps
    </a>
  );
}
