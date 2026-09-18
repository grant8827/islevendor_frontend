import DashboardTopBar from './DashboardTopBar.jsx';

// Shown when a seller dashboard's very first request fails — without it the
// page would sit on "Loading…" forever with no hint that anything's wrong.
export default function DashboardLoadError({ title, message, onRetry }) {
  return (
    <div className="min-h-screen bg-surface">
      <DashboardTopBar title={title} />
      <div className="p-8 max-w-md">
        <h2 className="font-bold text-navy text-lg mb-2">We couldn't load your dashboard</h2>
        <p className="text-sm text-slate-500 mb-1">Something went wrong reaching the server. Try again in a moment.</p>
        {message && (
          <p className="text-xs text-slate-400 mb-4" role="alert">
            {message}
          </p>
        )}
        <button type="button" onClick={onRetry} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg">
          Try again
        </button>
      </div>
    </div>
  );
}
