import { useState } from 'react';
import { Check, Image as ImageIcon, Palette, Sparkles } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import ImageInput from '../../components/dashboard/ImageInput.jsx';
import { HeroBackground } from '../../components/marketplace/storeHero.jsx';
import { heroTheme } from '../../components/marketplace/heroTheme.js';

const MODES = [
  { key: 'DEFAULT', label: 'Default', hint: 'The IsleVendor look', icon: Sparkles },
  { key: 'COLOR', label: 'Color', hint: 'A solid color', icon: Palette },
  { key: 'IMAGE', label: 'Image', hint: 'Your own photo', icon: ImageIcon },
];

// Brand-flavored starting points; the picker below takes any color.
const SWATCHES = ['#083a59', '#0a6d83', '#11a8b5', '#4e9f1f', '#b45309', '#be123c', '#6d28d9', '#1e293b'];

// Where a reseller chooses their storefront banner: keep the default, use a
// color, or use an image. The preview is the same component the storefront
// renders, fed the draft values, so what they see is what shoppers get.
export default function HeroEditor({ store, onSaved, onCancel }) {
  const { notify } = useToast();
  const [mode, setMode] = useState(store.heroMode ?? 'DEFAULT');
  const [color, setColor] = useState(store.heroColor ?? SWATCHES[1]);
  const [imageUrl, setImageUrl] = useState(store.heroImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const draft = { heroMode: mode, heroColor: color, heroImageUrl: imageUrl.trim() || null };
  const theme = heroTheme(draft);
  const changed = mode !== (store.heroMode ?? 'DEFAULT') || color !== (store.heroColor ?? SWATCHES[1]) || (imageUrl.trim() || null) !== (store.heroImageUrl ?? null);

  async function save(e) {
    e.preventDefault();
    setError(null);
    if (mode === 'IMAGE' && !draft.heroImageUrl) {
      setError('Add an image, or pick Default or Color instead.');
      return;
    }
    setSaving(true);
    try {
      const saved = await apiRequest(`/commerce/stores/${store.id}`, {
        method: 'PATCH',
        body: { heroMode: mode, heroColor: color, heroImageUrl: draft.heroImageUrl },
      });
      notify('Store banner updated.');
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 mb-6">
      <h3 className="font-bold text-navy text-sm">Customize your store banner</h3>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">Shown across the top of your storefront and this page.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4" role="radiogroup" aria-label="Banner style">
        {MODES.map(({ key, label, hint, icon: Icon }) => {
          const selected = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(key)}
              className={`text-left rounded-xl border p-3 transition flex items-start gap-2.5 ${
                selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${selected ? 'text-primary-dark' : 'text-slate-400'}`} />
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-900">{label}</span>
                <span className="block text-[11px] text-slate-500">{hint}</span>
              </span>
              {selected && <Check className="w-4 h-4 text-primary-dark shrink-0" />}
            </button>
          );
        })}
      </div>

      {mode === 'COLOR' && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">Banner color</p>
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use ${c}`}
                aria-pressed={color === c}
                className={`h-8 w-8 rounded-full border-2 transition ${color === c ? 'border-navy scale-110' : 'border-white ring-1 ring-slate-300'}`}
                style={{ background: c }}
              />
            ))}
            <label className="flex items-center gap-2 ml-2 text-xs text-slate-500">
              Custom
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 rounded border border-slate-300 bg-white p-0.5 cursor-pointer" />
              <span className="font-mono text-slate-700">{color}</span>
            </label>
          </div>
        </div>
      )}

      {mode === 'IMAGE' && (
        <div className="mb-4">
          <ImageInput value={imageUrl} onChange={setImageUrl} label="Banner image" variant="banner" />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Wide photos (around 1600×400) work best. We add a soft dark overlay so your store name stays easy to read.
          </p>
        </div>
      )}

      <p className="text-xs text-slate-500 mb-2">Preview</p>
      <div className="relative overflow-hidden rounded-xl h-28 mb-4">
        <HeroBackground hero={draft} />
        <div className={`relative h-full flex items-center px-5 ${theme.text}`}>
          <div>
            <p className="text-lg font-black leading-tight">{store.storeName}</p>
            <p className={`text-xs ${theme.muted}`}>/store/{store.slug}</p>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !changed} className="btn-primary disabled:opacity-60 text-xs font-bold px-4 py-2.5 rounded-lg transition">
          {saving ? 'Saving…' : 'Save Banner'}
        </button>
        <button type="button" onClick={onCancel} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition">
          Cancel
        </button>
      </div>
    </form>
  );
}
