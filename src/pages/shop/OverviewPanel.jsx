import { Link } from 'react-router-dom';

export default function OverviewPanel({ shop, stats }) {
  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-1">{shop.shopName}</h2>
      <p className="text-xs text-slate-500 mb-6">
        {shop.addressLine}, {shop.parish} ·{' '}
        <Link to={`/store/${shop.slug}`} className="text-primary hover:underline">
          View public page →
        </Link>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <span className="text-xs text-slate-500">Items Listed</span>
          <p className="text-2xl font-bold text-navy mt-1">{stats.productCount}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <span className="text-xs text-slate-500">Orders to Pack</span>
          <p className="text-2xl font-bold text-primary mt-1">{stats.packingCount}</p>
        </div>
      </div>
    </div>
  );
}
