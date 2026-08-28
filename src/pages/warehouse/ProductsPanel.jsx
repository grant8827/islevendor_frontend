import { useEffect, useState } from 'react';
import { Plus, Package, ImageOff, Pencil, Trash2, PauseCircle, PlayCircle, X } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import MultiImageInput from '../../components/dashboard/MultiImageInput.jsx';

const EMPTY_FORM = {
  title: '',
  category: '',
  description: '',
  wholesalePriceJmd: '',
  discountPercent: '0',
  condition: 'NEW',
  productDetails: '',
  stockQuantity: '',
  images: [''],
};

// `warehouses` — the owner's full list (id, name), so the add-product form
// can target any of them, not just whichever one is currently selected in
// the dashboard's switcher. Editing an existing product can't move it
// between warehouses (the backend doesn't support that), so the dropdown
// only appears while adding.
export default function ProductsPanel({ warehouseId, warehouses = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding, else editing this product's id
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouseId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useToast();

  function load() {
    setLoading(true);
    apiRequest(`/warehouse/products?warehouseId=${warehouseId}`, { auth: false })
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, [warehouseId]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function openAddForm() {
    setEditingId(null);
    setTargetWarehouseId(warehouseId);
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
      wholesalePriceJmd: String(product.wholesalePriceJmd),
      discountPercent: String(product.discountPercent ?? 0),
      condition: product.condition || 'NEW',
      productDetails: product.productDetails || '',
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
        await apiRequest(`/warehouse/products/${editingId}`, {
          method: 'PATCH',
          body: {
            title: form.title,
            category: form.category,
            description: form.description || null,
            wholesalePriceJmd: Number(form.wholesalePriceJmd),
            discountPercent: Number(form.discountPercent) || 0,
            condition: form.condition,
            productDetails: form.productDetails || null,
            stockQuantity: Number(form.stockQuantity) || 0,
            images,
          },
        });
        notify(`${form.title} updated.`);
      } else {
        await apiRequest('/warehouse/products', {
          method: 'POST',
          body: {
            warehouseId: targetWarehouseId,
            title: form.title,
            category: form.category,
            description: form.description || undefined,
            wholesalePriceJmd: Number(form.wholesalePriceJmd),
            discountPercent: Number(form.discountPercent) || 0,
            condition: form.condition,
            productDetails: form.productDetails || undefined,
            stockQuantity: Number(form.stockQuantity) || 0,
            images,
          },
        });
        notify(`${form.title} added.`);
      }
      closeForm();
      // Adding to a *different* warehouse than the one currently selected
      // won't show up in this list (it's scoped to warehouseId) — the
      // toast above still confirms it went through.
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleSuspend(product) {
    try {
      await apiRequest(`/warehouse/products/${product.id}`, { method: 'PATCH', body: { isActive: !product.isActive } });
      notify(product.isActive ? `${product.title} suspended.` : `${product.title} unsuspended.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Remove "${product.title}" permanently? This can't be undone.`)) return;
    try {
      await apiRequest(`/warehouse/products/${product.id}`, { method: 'DELETE' });
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
          <h2 className="font-bold text-navy text-lg">Master Stock Catalog</h2>
          <p className="text-xs text-slate-500">SKUs available for resellers to import onto their storefronts.</p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? closeForm() : openAddForm())}
          className="btn-primary font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          {!editingId && warehouses.length > 1 && (
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Warehouse</label>
              <select
                value={targetWarehouseId}
                onChange={(e) => setTargetWarehouseId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input value={form.title} onChange={update('title')} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <input value={form.category} onChange={update('category')} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Wholesale price (JMD)</label>
            <input type="number" min="0" step="0.01" value={form.wholesalePriceJmd} onChange={update('wholesalePriceJmd')} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Discount off wholesale (%)</label>
            <input type="number" min="0" max="90" value={form.discountPercent} onChange={update('discountPercent')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Stock quantity</label>
            <input type="number" min="0" value={form.stockQuantity} onChange={update('stockQuantity')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Condition</label>
            <select value={form.condition} onChange={update('condition')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary">
              <option value="NEW">New</option>
              <option value="USED">Used</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="What resellers and customers should know about this product…"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary resize-y"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Product details for customers (returns, warranty, etc.)</label>
            <textarea
              value={form.productDetails}
              onChange={update('productDetails')}
              rows={3}
              placeholder="E.g. 7-day return window, 1-year warranty, hand wash only…"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-secondary resize-y"
            />
          </div>
          <div className="col-span-2">
            <MultiImageInput value={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
          </div>
          {error && <p className="col-span-2 text-xs text-red-400" role="alert">{error}</p>}
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60 text-xs font-bold px-4 py-2.5 rounded-lg transition">
              {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Save Product'}
            </button>
            <button type="button" onClick={closeForm} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Package className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No products yet. Add your first SKU.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="table-header-row uppercase">
              <tr>
                <th className="px-5 py-3">Image</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Condition</th>
                <th className="px-5 py-3">Wholesale</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className={`hover:bg-surface transition ${p.isActive ? '' : 'opacity-50'}`}>
                  <td className="px-5 py-3">
                    <div className="h-10 w-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageOff className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-bold text-slate-900">
                    <span className="flex items-center gap-2">
                      {p.title}
                      {!p.isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          Suspended
                        </span>
                      )}
                    </span>
                    {p.description && <p className="text-[11px] font-normal text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-5 py-3">{p.category}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      p.condition === 'USED' ? 'text-slate-600 bg-slate-100 border-slate-300' : 'text-primary-dark bg-primary/10 border-primary/30'
                    }`}>
                      {p.condition === 'USED' ? 'Used' : 'New'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-primary font-bold">
                    J${(Number(p.wholesalePriceJmd) * (1 - p.discountPercent / 100)).toLocaleString()}
                    {p.discountPercent > 0 && (
                      <span className="block text-[10px] text-slate-400 font-normal line-through">
                        J${Number(p.wholesalePriceJmd).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">{p.stockQuantity} units</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEditForm(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={p.isActive ? 'Suspend' : 'Unsuspend'}
                        onClick={() => toggleSuspend(p)}
                        className={`p-1.5 rounded-lg transition ${
                          p.isActive ? 'text-slate-500 hover:text-primary hover:bg-slate-100' : 'text-primary hover:bg-slate-100'
                        }`}
                      >
                        {p.isActive ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Remove"
                        onClick={() => removeProduct(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition"
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
