import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { opportunities } from './opportunityContent.js';
import Navbar from '../../components/marketplace/Navbar.jsx';

// Each opportunity's "Apply" CTA now goes to its dedicated ISLE-100
// onboarding wizard rather than the generic /register form — 'store' maps
// to the small-vendor wizard (Shop model / ISLE-103), the other three
// slugs match their wizard route 1:1.
const ONBOARDING_PATH = {
  warehouse: '/join/warehouse',
  reseller: '/join/reseller',
  store: '/join/vendor',
  driver: '/join/driver',
};

export default function OpportunityPage() {
  const { slug } = useParams();
  const opportunity = opportunities[slug];

  if (!opportunity) return <Navigate to="/" replace />;

  const { icon: Icon, eyebrow, headline, subtext, steps, highlights, applyLabel } = opportunity;
  const applyPath = ONBOARDING_PATH[slug] || '/register';

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* HERO */}
      <div className="bg-linear-to-r from-navy via-navy to-slate-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <span className="inline-block bg-primary/20 text-primary border border-primary/40 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight">{headline}</h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">{subtext}</p>
          <Link
            to={applyPath}
            className="inline-flex items-center gap-2 btn-primary font-bold text-sm px-6 py-3 rounded-lg transition shadow-lg"
          >
            {applyLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="bg-white border border-slate-200 rounded-xl p-5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-navy text-primary font-black text-xs mb-3">
                {i + 1}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HIGHLIGHTS */}
      <div className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {highlights.map((h) => (
            <div key={h.title} className="text-center sm:text-left">
              <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center mb-3 mx-auto sm:mx-0">
                <h.icon className="w-5 h-5 text-navy" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{h.title}</h3>
              <p className="text-xs text-slate-600">{h.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Ready to get started?</h2>
        <p className="text-sm text-slate-600">
          Applications are reviewed as they come in — the form below creates your account as part of applying.
        </p>
        <Link
          to={applyPath}
          className="inline-flex items-center gap-2 btn-primary font-bold text-sm px-6 py-3 rounded-lg transition shadow-lg"
        >
          {applyLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <footer className="bg-navy text-slate-400 text-xs py-6 text-center">
        © 2026 IsleVendor Jamaica. <Link to="/" className="text-primary hover:underline">Back to marketplace</Link>
      </footer>
    </div>
  );
}
