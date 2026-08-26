export default function OverviewPanel({ warehouse, stats }) {
  return (
    <div>
      <h2 className="font-bold text-navy text-lg mb-1">{warehouse.name}</h2>
      <p className="text-xs text-slate-500 mb-6">
        {warehouse.addressLine}, {warehouse.parish}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <span className="text-xs text-slate-500">Master SKUs</span>
          <p className="text-2xl font-bold text-navy mt-1">{stats.productCount}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <span className="text-xs text-slate-500">Pending Reseller Applications</span>
          <p className="text-2xl font-bold text-secondary mt-1">{stats.pendingApplications}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl">
          <span className="text-xs text-slate-500">Orders to Pack</span>
          <p className="text-2xl font-bold text-primary mt-1">{stats.packingCount}</p>
        </div>
      </div>
    </div>
  );
}
