import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api/client.js';

/**
 * The delivery address at checkout, filled in from the customer's saved
 * address (with its map pin). Typing a different address drops the saved
 * pin, so a driver is never sent to the wrong place; a pin from "Use my
 * current location" stays. `payload` is what to send with the order.
 */
export function useDeliveryAddress(user) {
  const [text, setTextState] = useState('');
  const [pin, setPin] = useState(null);
  const [pinFromSaved, setPinFromSaved] = useState(false);
  const [saved, setSaved] = useState(null);
  const textRef = useRef('');
  textRef.current = text;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiRequest('/auth/address')
      .then(({ address }) => {
        if (cancelled || !address) return;
        setSaved(address);
        // Only fill in an empty box: never overwrite what they've typed.
        if (textRef.current) return;
        setTextState(address.formatted);
        setPin(address.location);
        setPinFromSaved(!!address.location);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  function setText(next) {
    setTextState(next);
    if (pinFromSaved && saved && next !== saved.formatted) {
      setPin(null);
      setPinFromSaved(false);
    }
  }

  function applySaved() {
    if (!saved) return;
    setTextState(saved.formatted);
    setPin(saved.location);
    setPinFromSaved(!!saved.location);
  }

  return {
    text,
    setText,
    pin,
    setCurrentPin: (location) => {
      setPin(location);
      setPinFromSaved(false);
    },
    clearPin: () => {
      setPin(null);
      setPinFromSaved(false);
    },
    saved,
    usingSaved: !!saved && text === saved.formatted,
    applySaved,
    payload: (needsAddress) =>
      needsAddress
        ? { deliveryAddress: text.trim(), deliveryLocation: pin ? { latitude: pin.latitude, longitude: pin.longitude } : null }
        : {},
  };
}
