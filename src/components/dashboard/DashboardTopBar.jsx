import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import islevendorIcon from '../../assets/islevendor-icon.png';

// `logo` lets one dashboard swap in its own brand lockup instead of the
// default isle vendor icon+wordmark — used only by DriverDashboard.jsx
// (IsleDash), every other dashboard renders the default.
export default function DashboardTopBar({ title, logo }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-navy text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to={logo?.to ?? '/'} className="flex items-center gap-1.5 text-lg font-black tracking-tight">
          {logo ? (
            // The asset has its own white background — a bare navy-on-image
            // edge looks like a stray box, so it gets a light card behind it
            // instead of sitting directly on bg-navy.
            <span className="bg-white rounded-md p-1 flex items-center">
              <img src={logo.src} alt={logo.alt} className="h-9 w-auto" />
            </span>
          ) : (
            <>
              <img src={islevendorIcon} alt="" className="h-6 w-6" />
              isle<span className="text-primary">vendor</span>
            </>
          )}
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
