import { Link } from 'react-router-dom';
import { ShoppingCart, ImageOff } from 'lucide-react';

export default function ProductCard({ listing, onAddToCart }) {
  const { masterProduct, store, retailPriceJmd, originalPriceJmd, discountPercent = 0, shipFromParish } = listing;
  const inStock = masterProduct.stockQuantity > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between">
      <div>
        <Link to={`/product/${listing.id}`} className="relative h-48 bg-slate-100 overflow-hidden p-4 flex items-center justify-center">
          {masterProduct.imageUrl ? (
            <img src={masterProduct.imageUrl} alt={masterProduct.title} className="max-h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <ImageOff className="w-10 h-10" />
              <span className="text-[10px] uppercase tracking-wide">No image yet</span>
            </div>
          )}
          <span className="absolute top-2 left-2 bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded">
            {masterProduct.category}
          </span>
          {discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </Link>

        <div className="p-4 space-y-2">
          <Link to={`/product/${listing.id}`}>
            <h3 className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-secondary transition">{masterProduct.title}</h3>
          </Link>

          <div className="pt-1">
            {discountPercent > 0 && (
              <div className="text-xs text-slate-400 line-through">J${Number(originalPriceJmd).toLocaleString()}</div>
            )}
            <span className="text-xs text-slate-500 align-top">J$</span>
            <span className={`text-2xl font-black ${discountPercent > 0 ? 'text-red-600' : 'text-slate-900'}`}>{Number(retailPriceJmd).toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span className="bg-secondary text-white text-[9px] font-black italic px-1 rounded">IsleDash</span>
            <span className="font-semibold text-slate-800">
              {inStock ? `Ships from ${shipFromParish || 'Jamaica'}` : 'Out of stock'}
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 border border-slate-100">
            Sold by <strong className="text-slate-800">{store.storeName}</strong>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <button
          type="button"
          onClick={() => onAddToCart(listing)}
          disabled={!inStock}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xs py-2.5 shadow flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{inStock ? 'Add to Cart' : 'Out of stock'}</span>
        </button>
      </div>
    </div>
  );
}
