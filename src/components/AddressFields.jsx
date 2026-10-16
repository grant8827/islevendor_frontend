import { useState } from 'react';
import { Crosshair, MapPin, X } from 'lucide-react';
import { PARISHES } from '../constants/parishes.js';
import { currentLocation, mapsLink } from '../lib/address.js';

// A customer's delivery address: street, town, parish, a landmark (most
// Jamaican addresses need one) and an optional map pin from their phone,
// so the driver can navigate straight there. Controlled: `value` is the
// form object (lib/address.js's EMPTY_ADDRESS), `onChange` receives the
// next one. `inputClassName` styles the inputs where the page doesn't.
export default function AddressFields({ value, onChange, inputClassName = '' }) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  async function pinMyLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const { latitude, longitude, accuracyMeters } = await currentLocation();
      onChange({ ...value, location: { latitude, longitude, accuracyMeters } });
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        className={inputClassName}
        placeholder="Street address (e.g. 12 Hope Road)"
        autoComplete="address-line1"
        value={value.addressLine1}
        onChange={set('addressLine1')}
        required
        maxLength={120}
      />
      <input
        className={inputClassName}
        placeholder="Apartment, house, lot or unit (optional)"
        autoComplete="address-line2"
        value={value.addressLine2}
        onChange={set('addressLine2')}
        maxLength={120}
      />
      <input
        className={inputClassName}
        placeholder="Town or district (e.g. Liguanea)"
        autoComplete="address-level2"
        value={value.town}
        onChange={set('town')}
        required
        maxLength={80}
      />
      <select className={inputClassName} value={value.parish} onChange={set('parish')} required aria-label="Parish">
        <option value="" disabled>
          Parish
        </option>
        {PARISHES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        className={inputClassName}
        placeholder="Nearest landmark (e.g. opposite the Texaco)"
        value={value.landmark}
        onChange={set('landmark')}
        maxLength={200}
      />
      <textarea
        className={inputClassName}
        placeholder="Delivery instructions (optional, e.g. green gate, call on arrival)"
        rows={2}
        value={value.deliveryInstructions}
        onChange={set('deliveryInstructions')}
        maxLength={300}
      />

      <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-600">
        {value.location ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-primary-dark font-bold">
              <MapPin className="w-4 h-4" /> Location pinned
              {value.location.accuracyMeters ? ` (within about ${value.location.accuracyMeters} m)` : ''}
            </span>
            <span className="flex items-center gap-3">
              <a href={mapsLink(value.location)} target="_blank" rel="noreferrer">
                View on map
              </a>
              <button type="button" onClick={() => onChange({ ...value, location: null })} className="flex items-center gap-0.5 text-slate-500 hover:text-red-700" aria-label="Remove pin">
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </span>
          </div>
        ) : (
          <>
            <p className="mb-2">Are you at this address now? Pin it so your driver can find you exactly.</p>
            <button type="button" onClick={pinMyLocation} disabled={locating} className="flex items-center gap-1.5 font-bold text-navy hover:underline disabled:opacity-50">
              <Crosshair className="w-4 h-4" /> {locating ? 'Finding you…' : 'Use my current location'}
            </button>
          </>
        )}
        {locationError && (
          <p className="text-red-600 mt-2" role="alert">
            {locationError}
          </p>
        )}
      </div>
    </div>
  );
}
