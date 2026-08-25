import { Building2, Plus } from 'lucide-react';

const ADD_NEW = '__add_new__';

export default function ShopSelector({ shops, selectedId, onSelect, onAddNew }) {
  return (
    <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex items-center gap-2">
      <Building2 className="w-4 h-4 text-amazon-yellow shrink-0" />
      <label htmlFor="shop-select" className="text-xs text-slate-400 shrink-0">
        Store:
      </label>
      <select
        id="shop-select"
        value={selectedId}
        onChange={(e) => (e.target.value === ADD_NEW ? onAddNew() : onSelect(e.target.value))}
        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amazon-yellow max-w-xs"
      >
        {shops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.shopName} — {s.parish}
          </option>
        ))}
        <option value={ADD_NEW}>+ Add another store…</option>
      </select>
      <button
        type="button"
        onClick={onAddNew}
        className="ml-auto flex items-center gap-1 text-xs text-amazon-yellow hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Add store
      </button>
    </div>
  );
}
