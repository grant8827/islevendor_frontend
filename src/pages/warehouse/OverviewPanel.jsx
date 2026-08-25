export default function OverviewPanel({ warehouse, stats }) {
  return (
    <div>
      <h2 className="font-bold text-white text-lg mb-1">{warehouse.name}</h2>
      <p className="text-xs text-slate-400 mb-6">
        {warehouse.addressLine}, {warehouse.parish}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Master SKUs</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.productCount}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Pending Affiliate Applications</span>
          <p className="text-2xl font-bold text-amazon-orange mt-1">{stats.pendingApplications}</p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
          <span className="text-xs text-slate-400">Orders to Pack</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.packingCount}</p>
        </div>
      </div>
    </div>
  );
}
