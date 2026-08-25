import { useEffect, useState } from 'react';
import { X, Package, Check } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AssignItemsModal({ warehouseId, store, onClose }) {
  const [products, setProducts] = useState(null);
  const [grantedIds, setGrantedIds] = useState(new Set());
  const [pendingId, setPendingId] = useState(null);
  const { notify } = useToast();

  function load() {
    Promise.all([
      apiRequest(`/warehouse/products?warehouseId=${warehouseId}`, { auth: false }),
      apiRequest(`/warehouse/${warehouseId}/resellers/${store.id}/grants`),
    ]).then(([allProducts, granted]) => {
      setProducts(allProducts);
      setGrantedIds(new Set(granted));
    });
  }

  useEffect(load, [warehouseId, store.id]);

  async function toggle(product) {
    const granted = !grantedIds.has(product.id);
    setPendingId(product.id);
    try {
      await apiRequest(`/warehouse/${warehouseId}/resellers/${store.id}/grants`, {
        method: 'PUT',
        body: { masterProductId: product.id, granted },
      });
      setGrantedIds((prev) => {
        const next = new Set(prev);
        granted ? next.add(product.id) : next.delete(product.id);
        return next;
      });
      notify(granted ? `${product.title} added to ${store.storeName}'s account.` : `${product.title} removed from ${store.storeName}'s account.`);
    } catch (err) {
      notify(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amazon-yellow" />
              Items for {store.storeName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Only checked items can be sold on their storefront.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {products === null && <p className="text-sm text-slate-400">Loading…</p>}
          {products?.length === 0 && <p className="text-sm text-slate-500">This warehouse has no products yet.</p>}
          {products?.map((product) => {
            const granted = grantedIds.has(product.id);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => toggle(product)}
                disabled={pendingId === product.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition disabled:opacity-50 ${
                  granted ? 'bg-brand-600/10 border-brand-600/40' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                    granted ? 'bg-brand-600 border-brand-600' : 'border-slate-600'
                  }`}
                >
                  {granted && <Check className="w-3.5 h-3.5 text-white" />}
                </span>
                <span className="flex-1">
                  <span className="text-sm font-bold text-white block">{product.title}</span>
                  <span className="text-xs text-slate-500">{product.sku} · J${Number(product.wholesalePriceJmd).toLocaleString()} wholesale</span>
                </span>
                {!product.isActive && (
                  <span className="text-[10px] font-bold uppercase text-amazon-orange bg-amazon-orange/10 border border-amazon-orange/30 px-1.5 py-0.5 rounded">
                    Suspended
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
