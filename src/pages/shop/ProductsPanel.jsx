import { useEffect, useState } from 'react';
import { Plus, Package, ImageOff, Pencil, Trash2, PauseCircle, PlayCircle, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import MultiImageInput from '../../components/dashboard/MultiImageInput.jsx';

const EMPTY_FORM = { title: '', category: '', description: '', priceJmd: '', stockQuantity: '', images: [''] };

export default function ProductsPanel({ shopId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding, else editing this product's id
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/shop/products?shopId=${shopId}`, { auth: false })
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, [shopId]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingId(product.id);
    setForm({
      title: product.title,
      category: product.category,
      description: product.description || '',
      priceJmd: String(product.priceJmd),
      stockQuantity: String(product.stockQuantity),
      images: product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [''],
    });
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const images = form.images.map((url) => url.trim()).filter(Boolean);
    if (images.length === 0) {
      setError('Add at least a main photo.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await apiRequest(`/shop/products/${editingId}`, {
          method: 'PATCH',
          body: {
            title: form.title,
            category: form.category,
            description: form.description || null,
            priceJmd: Number(form.priceJmd),
            stockQuantity: Number(form.stockQuantity) || 0,
            images,
          },
        });
        notify(`${form.title} updated.`);
      } else {
        await apiRequest('/shop/products', {
          method: 'POST',
          body: {
            shopId,
            title: form.title,
            category: form.category,
            description: form.description || undefined,
            priceJmd: Number(form.priceJmd),
            stockQuantity: Number(form.stockQuantity) || 0,
            images,
          },
        });
        notify(`${form.title} added.`);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleSuspend(product) {
    try {
      await apiRequest(`/shop/products/${product.id}`, { method: 'PATCH', body: { isActive: !product.isActive } });
      notify(product.isActive ? `${product.title} suspended.` : `${product.title} unsuspended.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Remove "${product.title}" permanently? This can't be undone.`)) return;
    try {
      await apiRequest(`/shop/products/${product.id}`, { method: 'DELETE' });
      notify(`${product.title} removed.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-white text-lg">Items For Sale</h2>
          <p className="text-xs text-slate-400">What you sell directly to customers — no approval needed.</p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? closeForm() : openAddForm())}
          className="bg-amazon-yellow hover:bg-amazon-orange text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Title</label>
            <input value={form.title} onChange={update('title')} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Category</label>
            <input value={form.category} onChange={update('category')} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Price (JMD)</label>
            <input type="number" min="0" step="0.01" value={form.priceJmd} onChange={update('priceJmd')} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stock quantity</label>
            <input type="number" min="0" value={form.stockQuantity} onChange={update('stockQuantity')} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="What customers should know about this item…"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-y"
            />
          </div>
          <div className="col-span-2">
            <MultiImageInput value={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
          </div>
          {error && <p className="col-span-2 text-xs text-red-400" role="alert">{error}</p>}
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={submitting} className="bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">
              {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Save Item'}
            </button>
            <button type="button" onClick={closeForm} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-slate-400">Loading…</p>}

      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Package className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No items yet. Add your first one.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-5 py-3">Image</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {products.map((p) => (
                <tr key={p.id} className={p.isActive ? '' : 'opacity-50'}>
                  <td className="px-5 py-3">
                    <div className="h-10 w-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageOff className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-bold text-white">
                    <span className="flex items-center gap-2">
                      {p.title}
                      {!p.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-amazon-orange bg-amazon-orange/10 border border-amazon-orange/30 px-1.5 py-0.5 rounded">
                          Suspended
                        </span>
                      )}
                    </span>
                    {p.description && <p className="text-[11px] font-normal text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{p.sku}</td>
                  <td className="px-5 py-3">{p.category}</td>
                  <td className="px-5 py-3 text-emerald-400 font-bold">J${Number(p.priceJmd).toLocaleString()}</td>
                  <td className="px-5 py-3">{p.stockQuantity} units</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEditForm(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={p.isActive ? 'Suspend' : 'Unsuspend'}
                        onClick={() => toggleSuspend(p)}
                        className={`p-1.5 rounded-lg transition ${
                          p.isActive ? 'text-slate-400 hover:text-amazon-yellow hover:bg-slate-700' : 'text-emerald-400 hover:bg-slate-700'
                        }`}
                      >
                        {p.isActive ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => removeProduct(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
