// Customer delivery addresses (backend: lib/customerAddress.ts).

export const EMPTY_ADDRESS = {
  addressLine1: '',
  addressLine2: '',
  town: '',
  parish: '',
  landmark: '',
  deliveryInstructions: '',
  location: null,
};

/** A saved address from the API, as form values. */
export function toAddressForm(saved) {
  if (!saved) return { ...EMPTY_ADDRESS };
  return {
    addressLine1: saved.addressLine1 ?? '',
    addressLine2: saved.addressLine2 ?? '',
    town: saved.town ?? '',
    parish: saved.parish ?? '',
    landmark: saved.landmark ?? '',
    deliveryInstructions: saved.deliveryInstructions ?? '',
    location: saved.location ?? null,
  };
}

/**
 * An order's delivery map pin, whichever shape it came in: the API's
 * deliveryLocation, or the raw deliveryLatitude/deliveryLongitude columns.
 */
export function orderPin(order) {
  if (order?.deliveryLocation) return order.deliveryLocation;
  if (order?.deliveryLatitude != null && order?.deliveryLongitude != null) {
    return { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude };
  }
  return null;
}

/** Google Maps directions to a map pin (works on phones and computers). */
export function mapsLink(location) {
  if (!location) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
}

/**
 * The phone's current position, for a map pin. Asks the browser's
 * permission; rejects with a message to show if refused or unavailable.
 */
export function currentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser can’t share your location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: Math.round(pos.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(pos.coords.longitude * 1e6) / 1e6,
          accuracyMeters: Math.round(pos.coords.accuracy),
        }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was refused. You can allow it in your browser settings, or skip this step.'
              : 'Couldn’t find your location. Try again outside or near a window, or skip this step.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

/** Address form values as the API expects them (no accuracy, blanks dropped). */
export function addressPayload(value) {
  return {
    addressLine1: value.addressLine1.trim(),
    addressLine2: value.addressLine2.trim(),
    town: value.town.trim(),
    parish: value.parish,
    landmark: value.landmark.trim(),
    deliveryInstructions: value.deliveryInstructions.trim(),
    location: value.location ? { latitude: value.location.latitude, longitude: value.location.longitude } : null,
  };
}
