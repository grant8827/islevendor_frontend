import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import islevendorIcon from '../../assets/islevendor-icon.png';

export default function DashboardTopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-navy text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-1.5 text-lg font-black tracking-tight">
          <img src={islevendorIcon} alt="" className="h-6 w-6" />
          isle<span className="text-primary">vendor</span>
        </Link>
        {title && <span className="text-xs text-slate-300 border-l border-white/20 pl-4">{title}</span>}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-300">
          {user?.fullName} <span className="text-slate-400">({user?.role})</span>
        </span>
        <button type="button" onClick={logout} className="text-primary hover:text-primary-dark hover:underline">
          Log out
        </button>
      </div>
    </header>
  );
}
