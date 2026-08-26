import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Navbar from '../marketplace/Navbar.jsx';

// Success screen shown after any of the four onboarding submissions —
// displays the IV-XX-XXXXXX reference id from each story's acceptance
// criteria and what happens next.
export default function SuccessScreen({ title, referenceId, reviewEta = '24-48 hrs', note, dashboardCta = 'Go to your dashboard' }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">{title}</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your application is under review — most decisions come back within {reviewEta}. We'll email you once you're approved.
        </p>

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Your reference ID</span>
          <span className="block text-xl font-black text-navy tracking-wide">{referenceId}</span>
        </div>

        {note && <p className="text-xs text-slate-500 mb-6">{note}</p>}

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 btn-primary font-bold text-sm px-6 py-3 rounded-lg transition shadow-lg"
        >
          {dashboardCta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
