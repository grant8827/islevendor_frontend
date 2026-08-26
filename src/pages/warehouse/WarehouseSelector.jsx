import { Warehouse as WarehouseIcon, Plus } from 'lucide-react';

const ADD_NEW = '__add_new__';

export default function WarehouseSelector({ warehouses, selectedId, onSelect, onAddNew }) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2">
      <WarehouseIcon className="w-4 h-4 text-primary shrink-0" />
      <label htmlFor="warehouse-select" className="text-xs text-slate-500 shrink-0">
        Warehouse:
      </label>
      <select
        id="warehouse-select"
        value={selectedId}
        onChange={(e) => (e.target.value === ADD_NEW ? onAddNew() : onSelect(e.target.value))}
        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-secondary max-w-xs"
      >
        {warehouses.map((wh) => (
          <option key={wh.id} value={wh.id}>
            {wh.name} — {wh.parish}
          </option>
        ))}
        <option value={ADD_NEW}>+ Add another warehouse…</option>
      </select>
      <button
        type="button"
        onClick={onAddNew}
        className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        Add warehouse
      </button>
    </div>
  );
}
