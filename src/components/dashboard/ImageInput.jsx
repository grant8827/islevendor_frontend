import { useState } from 'react';
import { Link2, Upload, ImageOff } from 'lucide-react';
import { uploadImage } from '../../api/client.js';

export default function ImageInput({ value, onChange }) {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">Product image</label>
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition ${
            mode === 'url' ? 'bg-secondary/10 border-secondary text-secondary' : 'border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" /> Image URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition ${
            mode === 'upload' ? 'bg-secondary/10 border-secondary text-secondary' : 'border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload from computer
        </button>
      </div>

      {mode === 'url' && (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/product.jpg"
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
        />
      )}

      {mode === 'upload' && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-bold file:cursor-pointer"
        />
      )}

      {uploading && <p className="text-xs text-slate-500 mt-1">Uploading…</p>}
      {error && <p className="text-xs text-red-400 mt-1" role="alert">{error}</p>}

      <div className="mt-2 h-24 w-24 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
        {value ? (
          <img src={value} alt="Preview" className="max-h-full max-w-full object-contain" onError={(e) => (e.target.style.display = 'none')} />
        ) : (
          <ImageOff className="w-6 h-6 text-slate-600" />
        )}
      </div>
    </div>
  );
}
