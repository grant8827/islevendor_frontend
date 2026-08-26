// Labeled input/select/textarea for the onboarding wizards' light theme —
// counterpart to the dashboard's dark inputs (see WarehouseSetupForm.jsx).
const baseClass =
  'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary';

export default function FormField({ label, hint, required, as = 'input', options, children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {as === 'select' ? (
        <select className={baseClass} required={required} {...props}>
          {options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea className={baseClass} required={required} {...props} />
      ) : (
        <input className={baseClass} required={required} {...props} />
      )}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
      {children}
    </label>
  );
}
