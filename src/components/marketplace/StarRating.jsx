import { Star } from 'lucide-react';

/**
 * Read-only mode (default): pass `value` (0-5, can be fractional — rounded
 * to the nearest whole star for display) and `count` to show an average.
 * Interactive mode: pass `interactive` + `onChange` — clicking a star calls
 * onChange(1-5) immediately, no separate submit step.
 */
export default function StarRating({ value = 0, count, interactive = false, onChange, size = 'w-4 h-4' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= (interactive ? value : Math.round(value));
          return (
            <button
              key={n}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(n)}
              className={interactive ? 'cursor-pointer' : 'cursor-default'}
              aria-label={interactive ? `Rate ${n} star${n === 1 ? '' : 's'}` : undefined}
            >
              {/* Stars stay a conventional gold, not the brand green — a green
                  star reads as "selected/active", not "highly rated". */}
              <Star className={`${size} ${filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300'}`} />
            </button>
          );
        })}
      </div>
      {typeof count === 'number' && (
        <span className="text-xs text-slate-500">
          {count > 0 ? `${value.toFixed(1)} (${count} rating${count === 1 ? '' : 's'})` : 'No ratings yet'}
        </span>
      )}
    </div>
  );
}
