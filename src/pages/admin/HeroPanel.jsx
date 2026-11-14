import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Check, Eye, EyeOff, ImageOff, Palette, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { HERO_BACKGROUNDS, heroBackground, SaleTag } from '../../components/marketplace/heroBackgrounds.jsx';
import { inputClass } from './adminFormat.js';
import { ListState } from './adminShared.jsx';

// A small version of the card exactly as the home page draws it.
function CardPreview({ item, background, small = false }) {
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl ${heroBackground(background).card} ${small ? 'h-28 w-24 shrink-0 p-2' : 'h-64 w-56 p-4'}`}>
      <SaleTag percent={item?.discountPercent} small={small} />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {item?.imageUrl ? <img src={item.imageUrl} alt="" className="max-h-full max-w-full object-contain" /> : <ImageOff className={`${small ? 'h-6 w-6' : 'h-12 w-12'} opacity-40`} />}
      </div>
      <p className={`mt-2 line-clamp-2 font-black leading-tight ${small ? 'text-[10px]' : 'text-lg'}`}>{item?.title || 'Pick an item'}</p>
    </div>
  );
}

function ColourPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Background colour">
      {HERO_BACKGROUNDS.map((b) => (
        <button
          key={b.key}
          type="button"
          role="radio"
          aria-checked={value === b.key}
          onClick={() => onChange(b.key)}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
            value === b.key ? 'border-secondary ring-2 ring-secondary/30 text-navy font-bold' : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <span className={`h-4 w-4 rounded-full ${b.swatch}`} />
          {b.label}
        </button>
      ))}
    </div>
  );
}

// Pick one of the items listed on the site, then a colour for its card.
function AddCardForm({ takenIds, onSaved, onCancel }) {
  const { notify } = useToast();
  const [listings, setListings] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [background, setBackground] = useState('navy');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/commerce/listings', { auth: false })
      .then(setListings)
      .catch((err) => setLoadError(err.message));
  }, []);

  const matches = useMemo(() => {
    if (!listings) return [];
    const q = query.trim().toLowerCase();
    return listings.filter((l) => !q || l.masterProduct.title.toLowerCase().includes(q) || l.store?.storeName?.toLowerCase().includes(q)).slice(0, 60);
  }, [listings, query]);

  const pickedItem = picked && { id: picked.id, title: picked.masterProduct.title, imageUrl: picked.masterProduct.imageUrl, discountPercent: picked.discountPercent };

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/admin/hero-slides', { method: 'POST', body: { listingId: picked.id, background } });
      notify(`${picked.masterProduct.title} added to the home hero.`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm grid gap-6 md:grid-cols-[1fr_auto]">
      <div className="space-y-4 min-w-0">
        <h3 className="font-bold text-navy">Add a hero card</h3>

        <div>
          <span className="block text-xs text-slate-600 mb-1">1. Pick an item listed on the site</span>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} w-full pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items or sellers" />
          </div>
          <div className="mt-2 max-h-80 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {loadError && <p className="p-3 text-xs text-red-600" role="alert">{loadError}</p>}
            {!loadError && !listings && <p className="p-3 text-xs text-slate-500">Loading items…</p>}
            {listings && matches.length === 0 && <p className="p-3 text-xs text-slate-500">No listed items match.</p>}
            {matches.map((l) => {
              const taken = takenIds.has(l.id);
              const selected = picked?.id === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  disabled={taken}
                  onClick={() => setPicked(l)}
                  className={`w-full flex items-center gap-3 p-2 text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${selected ? 'bg-secondary/10' : 'hover:bg-surface'}`}
                >
                  <span className="h-10 w-10 shrink-0 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    {l.masterProduct.imageUrl ? <img src={l.masterProduct.imageUrl} alt="" className="max-h-full max-w-full object-contain" /> : <ImageOff className="w-4 h-4 text-slate-300" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-900 truncate">{l.masterProduct.title}</span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {l.store?.storeName} · J${Number(l.retailPriceJmd).toLocaleString()}
                    </span>
                  </span>
                  {taken && <span className="text-[10px] font-bold uppercase text-slate-500">In hero</span>}
                  {selected && <Check className="w-4 h-4 text-secondary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-xs text-slate-600 mb-1">2. Background colour</span>
          <ColourPicker value={background} onChange={setBackground} />
        </div>

        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" disabled={!picked || saving} onClick={save} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg disabled:opacity-40">
            {saving ? 'Adding…' : 'Add to hero'}
          </button>
          <button type="button" onClick={onCancel} className="text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-surface">
            Cancel
          </button>
        </div>
      </div>
      <div>
        <span className="block text-xs text-slate-500 mb-2">Preview</span>
        <CardPreview item={pickedItem} background={background} />
      </div>
    </div>
  );
}

// Admin Console → Home Hero: which listed items show across the top of the home page.
export default function HeroPanel() {
  const { notify } = useToast();
  const [slides, setSlides] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [recolouring, setRecolouring] = useState(null); // slide id
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    apiRequest('/admin/hero-slides')
      .then(setSlides)
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  async function run(action, message) {
    setBusy(true);
    try {
      await action();
      if (message) notify(message);
      load();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  function move(index, by) {
    const ids = slides.map((s) => s.id);
    [ids[index], ids[index + by]] = [ids[index + by], ids[index]];
    run(() => apiRequest('/admin/hero-slides/order', { method: 'PUT', body: { ids } }));
  }

  const patch = (slide, body, message) => run(() => apiRequest(`/admin/hero-slides/${slide.id}`, { method: 'PATCH', body }), message);

  function remove(slide) {
    if (!window.confirm(`Remove “${slide.item?.title ?? 'this item'}” from the home hero? The item stays listed on the site.`)) return;
    run(() => apiRequest(`/admin/hero-slides/${slide.id}`, { method: 'DELETE' }), 'Removed from the home hero.');
  }

  const takenIds = useMemo(() => new Set((slides ?? []).map((s) => s.listingId)), [slides]);
  const iconButton = 'p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-surface disabled:opacity-30';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">Home Hero</h2>
          <p className="text-sm text-slate-500 mt-1">
            Pick items listed on the site to feature across the top of the home page. Each card shows the item's image and name and opens its product page. With none picked, the built-in cards show.
          </p>
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn-primary text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add card
          </button>
        )}
      </div>

      {adding && (
        <AddCardForm
          takenIds={takenIds}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      <ListState rows={slides} error={error} onRetry={load} emptyMessage="No items picked yet — the home page is showing the built-in cards." />

      {slides?.length > 0 && (
        <ul className="space-y-3">
          {slides.map((slide, i) => (
            <li key={slide.id} className={`bg-white border border-slate-200 rounded-xl p-3 ${slide.isActive && slide.item ? '' : 'opacity-70'}`}>
              <div className="flex items-center gap-4">
                <CardPreview item={slide.item} background={slide.background} small />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold text-navy truncate">{slide.item?.title ?? 'Item no longer listed'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {heroBackground(slide.background).label} · {slide.isActive ? 'Showing' : 'Hidden'}
                  </p>
                  {!slide.item && (
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> This item isn't for sale any more, so it's left off the home page.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <button type="button" className={iconButton} disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move up" title="Move up">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button type="button" className={iconButton} disabled={busy || i === slides.length - 1} onClick={() => move(i, 1)} aria-label="Move down" title="Move down">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button type="button" className={iconButton} disabled={busy} onClick={() => setRecolouring(recolouring === slide.id ? null : slide.id)} aria-label="Change colour" title="Change colour">
                    <Palette className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    disabled={busy}
                    onClick={() => patch(slide, { isActive: !slide.isActive }, slide.isActive ? 'Hidden from the home page.' : 'Showing on the home page.')}
                    aria-label={slide.isActive ? 'Hide' : 'Show'}
                    title={slide.isActive ? 'Hide' : 'Show'}
                  >
                    {slide.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button type="button" className={`${iconButton} text-red-600`} disabled={busy} onClick={() => remove(slide)} aria-label="Remove" title="Remove from hero">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {recolouring === slide.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <ColourPicker
                    value={slide.background}
                    onChange={(background) => {
                      setRecolouring(null);
                      if (background !== slide.background) patch(slide, { background }, 'Colour saved.');
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
