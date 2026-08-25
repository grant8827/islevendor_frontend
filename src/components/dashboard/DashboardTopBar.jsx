import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardTopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-amazon-navy text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-lg font-black tracking-tight">
          isle<span className="text-amazon-yellow">vendor</span>
        </Link>
        {title && <span className="text-xs text-slate-400 border-l border-slate-700 pl-4">{title}</span>}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-300">
          {user?.fullName} <span className="text-slate-500">({user?.role})</span>
        </span>
        <button type="button" onClick={logout} className="text-amazon-yellow hover:underline">
          Log out
        </button>
      </div>
    </header>
  );
}
