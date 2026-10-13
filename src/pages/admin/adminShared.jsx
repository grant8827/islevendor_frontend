// Small components shared by the admin console's panels.

export function Badge({ className = 'bg-slate-100 text-slate-600 border-slate-300', children }) {
  return <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${className}`}>{children}</span>;
}

/** Loading / error / empty states for a list panel, in that order of precedence. Renders nothing once there are rows. */
export function ListState({ rows, error, onRetry, emptyMessage }) {
  if (error) {
    return (
      <div className="text-sm" role="alert">
        <p className="text-red-600 mb-2">{error}</p>
        <button type="button" onClick={onRetry} className="btn-primary text-xs font-bold px-3 py-2 rounded-lg">
          Try again
        </button>
      </div>
    );
  }
  if (rows === null) return <p className="text-sm text-slate-500">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  return null;
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const buttonClass = 'px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-surface disabled:opacity-40';
  return (
    <div className="flex items-center justify-end gap-3 mt-4 text-xs text-slate-500">
      <span>
        Page {page} of {pages} · {total.toLocaleString()} total
      </span>
      <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <button type="button" className={buttonClass} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
