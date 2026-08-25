import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Shared step/field/file state + navigation for all four onboarding
 * wizards. Each page supplies its own `initialForm`, `stepValidators`
 * (one function per step returning an error string or null), and a
 * `submit(form, files)` call to the matching api/onboarding.js function.
 */
export function useOnboardingForm({ initialForm, stepCount, validateStep, submit }) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function update(field) {
    return (e) => {
      const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  function updateValue(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateFile(field) {
    return (file) => setFiles((f) => ({ ...f, [field]: file }));
  }

  function next() {
    const validationError = validateStep(step, form, files);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (step < stepCount - 1) setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    const validationError = validateStep(step, form, files);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const data = await submit(form, files);
      // Hydrate AuthContext's `user` from the token the submit just stored
      // (see AuthContext.refreshUser's doc comment) so the success screen's
      // "Go to your dashboard" link — a ProtectedRoute — actually works.
      await refreshUser();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return { step, form, files, error, submitting, result, update, updateValue, updateFile, next, back, handleSubmit, setError };
}
