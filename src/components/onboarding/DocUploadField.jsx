import { useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// KYC document picker (COCJ registration, TRN card, proof of address, gov
// ID, license photo, insurance/fitness cert, …). Unlike ImageInput.jsx
// (dashboard product photos), this never uploads on its own — the file is
// held in the wizard's state and only sent at final submit, as part of the
// same multipart request as the rest of the form (see api/onboarding.js).
// That sidesteps needing an authenticated /uploads/image call before the
// applicant's account even exists yet.
export default function DocUploadField({ label, hint, required, value, onChange }) {
  const [error, setError] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, GIF, or PDF files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File must be under 5MB');
      e.target.value = '';
      return;
    }
    onChange(file);
  }

  return (
    <div>
      <span className="block text-xs font-semibold text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <label
        className={`flex items-center gap-3 border-2 border-dashed rounded-lg px-3 py-3 cursor-pointer transition ${
          value ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-navy bg-slate-50'
        }`}
      >
        {value ? <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Upload className="w-5 h-5 text-slate-500 shrink-0" />}
        <span className="text-xs text-slate-600 truncate">{value ? value.name : 'Tap to choose a file (JPG, PNG, or PDF)'}</span>
        <input type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFile} className="sr-only" />
      </label>
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-red-600 mt-1">{error}</span>}
    </div>
  );
}
