import { useState } from 'react';
import { Crosshair, MapPin, X } from 'lucide-react';
import { currentLocation, mapsLink } from '../lib/address.js';

// The address box at checkout (cart and product page). `delivery` comes from
// hooks/useDeliveryAddress.js.
export default function DeliveryAddressInput({ delivery, id = 'delivery-address' }) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  async function pinMyLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      delivery.setCurrentPin(await currentLocation());
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setLocating(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={id} className="block text-xs text-slate-600">
          Delivery address
        </label>
        {delivery.saved && !delivery.usingSaved && (
          <button type="button" onClick={delivery.applySaved} className="text-[11px] font-bold text-navy hover:underline">
            Use my saved address
          </button>
        )}
      </div>
      <textarea
        id={id}
        rows={3}
        placeholder="Street, town, parish, and a landmark the driver can look for"
        value={delivery.text}
        onChange={(e) => delivery.setText(e.target.value)}
        maxLength={500}
        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
      />
      <div className="text-[11px] text-slate-600 mt-1">
        {delivery.pin ? (
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-primary-dark font-bold">
              <MapPin className="w-3.5 h-3.5" /> Map pin included
            </span>
            <a href={mapsLink(delivery.pin)} target="_blank" rel="noreferrer" className="text-secondary-dark hover:underline">
              View
            </a>
            <button type="button" onClick={delivery.clearPin} className="flex items-center gap-0.5 text-slate-500 hover:text-red-700">
              <X className="w-3 h-3" /> Remove
            </button>
          </span>
        ) : (
          <button type="button" onClick={pinMyLocation} disabled={locating} className="flex items-center gap-1 font-bold text-navy hover:underline disabled:opacity-50">
            <Crosshair className="w-3.5 h-3.5" /> {locating ? 'Finding you…' : 'Add a map pin: use my current location'}
          </button>
        )}
        {locationError && (
          <p className="text-red-600 mt-1" role="alert">
            {locationError}
          </p>
        )}
      </div>
    </div>
  );
}
