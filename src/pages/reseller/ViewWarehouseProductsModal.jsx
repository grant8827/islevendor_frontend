import { useEffect, useState } from 'react';
import { X, Package, ImageOff } from 'lucide-react';
import { apiRequest } from '../../api/client.js';

export default function ViewWarehouseProductsModal({ warehouse, onClose }) {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    apiRequest(`/warehouse/products?warehouseId=${warehouse.id}`, { auth: false }).then(setProducts);
  }, [warehouse.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 shadow-xl rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-navy flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {warehouse.name}'s Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">What this warehouse sells — apply to request access.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {products === null && <p className="text-sm text-slate-500">Loading…</p>}
          {products?.length === 0 && <p className="text-sm text-slate-500">This warehouse hasn't added any products yet.</p>}
          {products?.map((product) => (
            <div key={product.id} className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm rounded-lg p-3">
              <div className="h-10 w-10 shrink-0 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageOff className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{product.title}</p>
                <p className="text-xs text-slate-500">{product.category} · {product.stockQuantity} in stock</p>
              </div>
              <p className="text-xs text-primary font-bold">J${Number(product.wholesalePriceJmd).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
