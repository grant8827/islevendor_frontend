import { Link } from 'react-router-dom';

export default function OverviewPanel({ shop, stats }) {
  return (
    <div>
      <h2 className="font-bold text-white text-lg mb-1">{shop.shopName}</h2>
      <p className="text-xs text-slate-400 mb-6">
        {shop.addressLine}, {shop.parish} ·{' '}
        <Link to={`/store/${shop.slug}`} className="text-amazon-yellow hover:underline">
          View public page →
        </Link>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Items Listed</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.productCount}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Orders to Pack</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.packingCount}</p>
        </div>
      </div>
    </div>
  );
}
