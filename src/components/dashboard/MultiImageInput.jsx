import { useState } from 'react';
import { Link2, Upload, ImageOff, Plus, X } from 'lucide-react';
import { uploadImage } from '../../api/client.js';

const MAX_PHOTOS = 6;

function ImageSlot({ label, value, onChange, onRemove, removable }) {
  const [mode, setMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
        {removable && (
          <button type="button" onClick={onRemove} className="text-slate-500 hover:text-red-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="h-16 w-full bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
        {value ? (
          <img src={value} alt="" className="max-h-full max-w-full object-contain" onError={(e) => (e.target.style.display = 'none')} />
        ) : (
          <ImageOff className="w-5 h-5 text-slate-600" />
        )}
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1 text-[10px] px-1.5 py-1 rounded border transition ${
            mode === 'url' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Link2 className="w-3 h-3" /> URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1 text-[10px] px-1.5 py-1 rounded border transition ${
            mode === 'upload' ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Upload className="w-3 h-3" /> Upload
        </button>
      </div>

      {mode === 'url' && (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-amazon-yellow"
        />
      )}
      {mode === 'upload' && (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="w-full text-[10px] text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-amazon-yellow file:text-slate-950 file:text-[10px] file:font-bold file:cursor-pointer"
        />
      )}
      {uploading && <p className="text-[10px] text-slate-400">Uploading…</p>}
      {error && <p className="text-[10px] text-red-400" role="alert">{error}</p>}
    </div>
  );
}

/**
 * `value` is an ordered array of image URLs — value[0] is always the item's
 * main photo (what shows on the marketplace grid and product cards);
 * anything after that is gallery-only, shown on the product detail page.
 * Always keeps at least one slot rendered so there's somewhere to set the
 * main photo.
 */
export default function MultiImageInput({ value, onChange }) {
  const images = value?.length ? value : [''];

  function setAt(i, url) {
    const next = [...images];
    next[i] = url;
    onChange(next);
  }
  function removeAt(i) {
    const next = images.filter((_, idx) => idx !== i);
    onChange(next.length ? next : ['']);
  }

  return (
    <div>
      <label className="block text-xs text-slate-400 mb-2">Photos — first one is the main photo customers see first</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <ImageSlot
            key={i}
            label={i === 0 ? 'Main photo' : `Photo ${i + 1}`}
            value={url}
            onChange={(u) => setAt(i, u)}
            onRemove={() => removeAt(i)}
            removable={images.length > 1}
          />
        ))}
        {images.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => onChange([...images, ''])}
            className="min-h-[9.5rem] border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-white hover:border-slate-500 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-bold">Add Photo</span>
          </button>
        )}
      </div>
    </div>
  );
}
