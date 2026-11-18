import { useState } from 'react';
import { AlertTriangle, Crosshair, MapPin } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { currentLocation } from '../../lib/address.js';

const inputClass = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary disabled:bg-slate-50';

/**
 * Coordinates from what a seller pastes: "18.0123, -76.7965" (what Google
 * Maps copies when you press and hold a spot) or a Google Maps link with
 * them in it. Null if there aren't any.
 */
export function parseCoordinates(text) {
  const match = String(text).match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
}

const pinOf = (business) =>
  business.pinLatitude != null && business.pinLongitude != null ? { latitude: Number(business.pinLatitude), longitude: Number(business.pinLongitude) } : null;

const mapLink = (pin) => `https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`;

// Where a shop or warehouse is on the map: IsleDash prices delivery by the
// distance from here to the buyer (backend lib/isleDashPricing.ts), and
// drivers are sent here to collect. Until it's placed, IsleDash charges the
// standard fallback fee. `endpoint` is the business's PUT .../location route.
export default function StoreLocationCard({ business, endpoint, readOnly = false, onSaved }) {
  const { notify } = useToast();
  const saved = pinOf(business);
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function save(pin) {
    setError(null);
    try {
      await apiRequest(endpoint, { method: 'PUT', body: { latitude: pin.latitude, longitude: pin.longitude } });
      notify('Location saved. IsleDash now prices delivery from here.');
      setPasted('');
      onSaved?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function useCurrent() {
    setBusy('locating');
    setError(null);
    try {
      await save(await currentLocation());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function savePasted(e) {
    e.preventDefault();
    const pin = parseCoordinates(pasted);
    if (!pin) {
      setError('Paste coordinates like 18.0123, -76.7965 or a Google Maps link to the spot.');
      return;
    }
    setBusy('saving');
    await save(pin);
    setBusy(null);
  }

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3 text-sm">
      <div>
        <h3 className="font-bold text-navy flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Store location
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          IsleDash charges customers by the distance from here to them, and drivers come here to collect. Put the pin where drivers should pick up.
        </p>
      </div>

      {saved ? (
        <p className="text-xs text-slate-700 bg-surface rounded-md px-3 py-2 flex flex-wrap items-center gap-x-2">
          <span className="font-bold text-primary-dark flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Pinned
          </span>
          <span>
            {saved.latitude.toFixed(5)}, {saved.longitude.toFixed(5)}
          </span>
          <a href={mapLink(saved)} target="_blank" rel="noreferrer" className="text-secondary-dark hover:underline">
            Check it on the map
          </a>
        </p>
      ) : (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>No map pin yet. Until you place one, IsleDash customers pay the standard fee whatever the distance, and drivers only know your parish.</span>
        </p>
      )}

      {readOnly ? (
        <p className="text-xs text-slate-400">Only the owner or a warehouse admin can change the location.</p>
      ) : (
        <>
          <button
            type="button"
            onClick={useCurrent}
            disabled={busy !== null}
            className="flex items-center gap-1.5 text-xs font-bold text-navy border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            <Crosshair className="w-3.5 h-3.5" /> {busy === 'locating' ? 'Finding you…' : saved ? 'Move pin to where I am now' : 'Use my current location'}
          </button>
          <p className="text-[11px] text-slate-400">Only use this while you're at the store or warehouse.</p>

          <form onSubmit={savePasted} className="space-y-1">
            <label className="block text-xs text-slate-600">
              Or paste coordinates
              <div className="flex gap-2 mt-1">
                <input type="text" placeholder="18.0123, -76.7965" className={inputClass} value={pasted} onChange={(e) => setPasted(e.target.value)} />
                <button type="submit" disabled={busy !== null || !pasted.trim()} className="btn-primary text-xs font-bold px-3 rounded-lg disabled:opacity-40 whitespace-nowrap">
                  {busy === 'saving' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </label>
            <p className="text-[11px] text-slate-400">In Google Maps, press and hold your entrance, then copy the numbers it shows (or share the link).</p>
          </form>
        </>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
