export default function DashboardSidebar({ items, active, onSelect }) {
  return (
    <nav className="w-56 shrink-0 bg-slate-950 border-r border-slate-800 py-4">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition ${
            active === item.key
              ? 'bg-slate-800 text-amazon-yellow font-bold border-r-2 border-amazon-yellow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
          {item.badge > 0 && (
            <span className="ml-auto bg-amazon-orange text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
