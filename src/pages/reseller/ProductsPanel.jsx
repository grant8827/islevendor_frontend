import { useEffect, useState } from 'react';
import { Package, Plus, Check } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

// Default markup suggested when a reseller adds an item — they can edit it
// before confirming; the backend still enforces retail > wholesale.
const DEFAULT_MARKUP = 1.25;

export default function ProductsPanel({ store }) {
  const [grants, setGrants] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  async function load() {
    setLoading(true);
    const [grantList, myStore] = await Promise.all([
      apiRequest('/commerce/grants/mine'),
      apiRequest(`/commerce/stores/${store.slug}`, { auth: false }),
    ]);
    setGrants(grantList);
    setMyListings(myStore.listings);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [store.slug]);

  function priceFor(product) {
    if (prices[product.id] !== undefined) return prices[product.id];
    return Math.round(Number(product.wholesalePriceJmd) * DEFAULT_MARKUP);
  }

  async function addToStore(product) {
    const retailPriceJmd = Number(priceFor(product));
    if (retailPriceJmd <= Number(product.wholesalePriceJmd)) {
      notify('Retail price must be higher than the wholesale price.');
      return;
    }
    try {
      await apiRequest(`/commerce/stores/${store.id}/listings`, {
        method: 'POST',
        body: { masterProductId: product.id, retailPriceJmd },
      });
      notify(`${product.title} added to your store.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  async function removeFromStore(product) {
    const listing = myListings.find((l) => l.masterProductId === product.id);
    if (!listing) return;
    try {
      await apiRequest(`/commerce/stores/${store.id}/listings/${listing.id}`, { method: 'DELETE' });
      notify(`${product.title} removed from your store.`);
      load();
    } catch (err) {
      notify(err.message);
    }
  }

  const listedProductIds = new Set(myListings.map((l) => l.masterProductId));

  // Group granted products by warehouse for display.
  const byWarehouse = grants.reduce((acc, grant) => {
    const wh = grant.masterProduct.warehouse;
    (acc[wh.id] ||= { warehouse: wh, products: [] }).products.push(grant.masterProduct);
    return acc;
  }, {});

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-amazon-yellow" />
        <div>
          <h2 className="font-bold text-white text-lg">Products</h2>
          <p className="text-xs text-slate-400">
            Items warehouses have added to your account — only these can be listed on your storefront.
          </p>
        </div>
      </div>

      {grants.length === 0 && (
        <p className="text-sm text-slate-500">
          Nothing here yet. Get approved from the <strong>Warehouses</strong> tab, then ask them to add items to
          your account — they control what you can sell.
        </p>
      )}

      {Object.values(byWarehouse).map(({ warehouse, products }) => (
        <div key={warehouse.id} className="mb-8">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-3">{warehouse.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const added = listedProductIds.has(product.id);
              return (
                <div key={product.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      {product.title}
                      {!product.isActive && (
                        <span className="text-[10px] font-bold uppercase text-amazon-orange bg-amazon-orange/10 border border-amazon-orange/30 px-1.5 py-0.5 rounded">
                          Suspended
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{product.category} · {product.stockQuantity} in stock</p>
                    <p className="text-xs text-slate-400 mt-1">Wholesale: J${Number(product.wholesalePriceJmd).toLocaleString()}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center text-xs text-slate-400">
                      <span className="mr-1">J$</span>
                      <input
                        type="number"
                        min={Number(product.wholesalePriceJmd) + 1}
                        disabled={added}
                        value={priceFor(product)}
                        onChange={(e) => setPrices((p) => ({ ...p, [product.id]: e.target.value }))}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white disabled:opacity-50"
                      />
                    </div>
                    {added ? (
                      <button
                        type="button"
                        onClick={() => removeFromStore(product)}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/10 hover:bg-red-500/10 text-emerald-400 hover:text-red-400 border border-emerald-500/20 hover:border-red-500/20 text-xs font-bold py-1.5 rounded-lg transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Added — remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToStore(product)}
                        disabled={!product.isActive}
                        className="flex-1 flex items-center justify-center gap-1 bg-amazon-yellow hover:bg-amazon-orange disabled:opacity-50 disabled:hover:bg-amazon-yellow text-slate-950 text-xs font-bold py-1.5 rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> {product.isActive ? 'Add to My Store' : 'Unavailable'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
