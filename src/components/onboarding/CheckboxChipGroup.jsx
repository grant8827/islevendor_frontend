// Multi-select chip grid — used for coverage/zone parishes, storage types,
// security controls, and target categories across all four onboarding
// forms. `value` is the array of currently-selected options.
//
// Tailwind's class scanner needs full class names literally present in the
// source (a template-literal `grid-cols-${columns}` won't get generated) —
// hence the lookup instead of interpolating.
const COLUMN_CLASSES = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' };

export default function CheckboxChipGroup({ label, hint, options, value, onChange, required, columns = 3 }) {
  function toggle(option) {
    const opt = typeof option === 'string' ? option : option.value;
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }

  return (
    <div>
      <span className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className={`grid grid-cols-2 ${COLUMN_CLASSES[columns] || COLUMN_CLASSES[3]} gap-2`}>
        {options.map((option) => {
          const opt = typeof option === 'string' ? option : option.value;
          const optLabel = typeof option === 'string' ? option : option.label;
          const selected = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={selected}
              className={`text-xs px-3 py-2 rounded-lg border text-left transition ${
                selected
                  ? 'bg-navy border-navy text-primary font-semibold'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-navy'
              }`}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
      {required && value.length === 0 && (
        <span className="block text-[11px] text-amber-600 mt-1">Select at least one</span>
      )}
    </div>
  );
}
