import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const BASE_SORTS = [
  { key: 'newest', label: 'Newest', compare: null }, // the API already returns newest first
  { key: 'price-asc', label: 'Price: low to high', compare: (a, b) => Number(a.retailPriceJmd) - Number(b.retailPriceJmd) },
  { key: 'price-desc', label: 'Price: high to low', compare: (a, b) => Number(b.retailPriceJmd) - Number(a.retailPriceJmd) },
  { key: 'discount', label: 'Biggest discount', compare: (a, b) => b.discountPercent - a.discountPercent },
];

/**
 * The browse experience for one seller's listings — search, category chips,
 * sort and a product grid — shared by the public storefront page and the
 * reseller dashboard's My Store tab so the two always behave the same.
 *
 *  - `listings`: marketplace-shaped listings (see normalizeAffiliateListing).
 *  - `renderCard(listing)`: how each one is drawn (Add to Cart vs Remove).
 *  - `extraSorts`: [{ key, label, compare }] to add to the standard sorts.
 */
export default function StoreCatalog({
  listings,
  renderCard,
  extraSorts = [],
  searchPlaceholder = 'Search this store…',
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5',
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortKey, setSortKey] = useState('newest');
  const sorts = useMemo(() => [...BASE_SORTS, ...extraSorts], [extraSorts]);

  const categories = useMemo(() => {
    const counts = new Map();
    for (const l of listings) counts.set(l.masterProduct.category, (counts.get(l.masterProduct.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [listings]);

  // If the selected category empties out (its last item was removed), fall back to All.
  useEffect(() => {
    if (category !== 'All' && !categories.some(([name]) => name === category)) setCategory('All');
  }, [categories, category]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = listings.filter(
      (l) =>
        (category === 'All' || l.masterProduct.category === category) &&
        (!q || [l.masterProduct.title, l.masterProduct.category].some((f) => f?.toLowerCase().includes(q))),
    );
    const compare = sorts.find((s) => s.key === sortKey)?.compare;
    return compare ? [...filtered].sort(compare) : filtered;
  }, [listings, search, category, sortKey, sorts]);

  return (
    <div>
      {/* Search, category and sort — one row above the products they scope. */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[14rem] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Category">
        {[['All', listings.length], ...categories].map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            aria-pressed={category === name}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              category === name ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-300 hover:border-navy hover:text-navy'
            }`}
          >
            {name} <span className={category === name ? 'text-slate-300' : 'text-slate-400'}>{count}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Showing {visible.length} of {listings.length} item{listings.length === 1 ? '' : 's'}
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-500">No items match “{search}”.</p>
      ) : (
        <div className={gridClassName}>{visible.map(renderCard)}</div>
      )}
    </div>
  );
}
