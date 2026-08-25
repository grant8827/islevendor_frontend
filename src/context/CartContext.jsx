import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'islevendor_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(listing) {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id);
      if (existing) {
        return prev.map((i) => (i.listingId === listing.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          listingId: listing.id,
          // AFFILIATE (default) or STORE — a plain reseller/storefront fetch
          // (e.g. viewing one store's page) has no `kind` field, so default
          // to AFFILIATE rather than letting checkout receive `undefined`.
          kind: listing.kind || 'AFFILIATE',
          storeId: listing.storeId,
          masterProductId: listing.masterProductId,
          title: listing.masterProduct.title,
          imageUrl: listing.masterProduct.imageUrl || null,
          retailPriceJmd: Number(listing.retailPriceJmd),
          storeName: listing.store.storeName,
          storeSlug: listing.store.slug,
          quantity: 1,
        },
      ];
    });
  }

  function removeItem(listingId) {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }

  function updateQuantity(listingId, quantity) {
    if (quantity < 1) return removeItem(listingId);
    setItems((prev) => prev.map((i) => (i.listingId === listingId ? { ...i, quantity } : i)));
  }

  function clear() {
    setItems([]);
  }

  const subtotalJmd = items.reduce((sum, i) => sum + i.retailPriceJmd * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, subtotalJmd }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
