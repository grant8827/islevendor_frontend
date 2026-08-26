import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

// Back / Next / Submit row, shared by all four onboarding wizards.
export default function StepFooter({ step, lastStep, submitting, onBack, onNext, onSubmit }) {
  return (
    <div className="flex items-center justify-between">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      ) : (
        <span />
      )}

      {step < lastStep ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 btn-primary font-bold text-sm px-5 py-2.5 rounded-lg transition"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-secondary disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-lg transition"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      )}
    </div>
  );
}
