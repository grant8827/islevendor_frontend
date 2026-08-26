import { Outlet } from 'react-router-dom';
import Navbar from './components/marketplace/Navbar.jsx';

// Shared by every page that doesn't need its own full-width chrome (login,
// register, storefronts, …) — the shopping navbar is the same everywhere
// so navigation feels consistent site-wide (see Navbar.jsx for what it
// deliberately leaves out). `.simple-page` (index.css) still styles the
// centered form/content column below it — kept outside Navbar's own
// `<header>` so its header-specific rules don't bleed onto Navbar's markup.
export default function Layout() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="simple-page">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
