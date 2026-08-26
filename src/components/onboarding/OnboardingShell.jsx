import { Check } from 'lucide-react';
import Navbar from '../marketplace/Navbar.jsx';

/**
 * Shared page chrome for all four onboarding wizards (ISLE-101..104): a
 * light, full-width, self-contained page (own Navbar — same reasoning as
 * HomePage/OpportunityPage, not the dashboard's dark chrome, since these
 * are reached from the public "Apply" flow, not a logged-in area) with a
 * step progress bar and a card for the current step's fields.
 */
export default function OnboardingShell({
  icon: Icon,
  title,
  subtitle,
  steps,
  currentStep,
  error,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="bg-linear-to-r from-navy via-navy to-slate-900 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black">{title}</h1>
          {subtitle && <p className="text-slate-300 text-sm max-w-lg mx-auto">{subtitle}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step progress */}
        <ol className="flex items-center gap-1 mb-8">
          {steps.map((label, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <li key={label} className="flex-1 flex items-center gap-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                      done
                        ? 'bg-navy border-navy text-primary'
                        : active
                          ? 'border-navy text-navy bg-white'
                          : 'border-slate-300 text-slate-500 bg-white'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] text-center leading-tight hidden sm:block ${
                      active ? 'text-navy font-bold' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-4 sm:-mt-5 ${done ? 'bg-navy' : 'bg-slate-300'}`} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-slate-900 text-base mb-5">{steps[currentStep]}</h2>
          <div className="space-y-4">{children}</div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200">{footer}</div>
        </div>
      </div>
    </div>
  );
}
