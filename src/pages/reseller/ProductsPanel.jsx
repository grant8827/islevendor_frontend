import { useEffect, useState } from 'react';
import { Package, Plus, Check } from 'lucide-react';
import { apiRequest } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';

const PLATFORM_COMMISSION_RATE = 0.05;

// Mirrors backend-node/src/lib/pricing.ts's computeAffiliatePricing exactly —
// a preview only (the actual charge is always computed server-side at
// checkout), so a reseller can see what they'll earn before adding an item.
// The reseller no longer sets a price: the warehouse's (post-discount)
// wholesale price plus the warehouse's own reseller commission % plus the
// platform's flat 5% are what the customer pays.
function pricingFor(product) {
  const wholesale = Number(product.wholesalePriceJmd);
  const discountMultiplier = 1 - product.discountPercent / 100;
  const unitWholesale = wholesale * discountMultiplier;
  const resellerCut = unitWholesale * (product.warehouse.resellerCommissionPercent / 100);
  const platformCut = unitWholesale * PLATFORM_COMMISSION_RATE;
  const retail = unitWholesale + resellerCut + platformCut;
  return { unitWholesale, resellerCut, platformCut, retail };
}

export default function ProductsPanel({ store }) {
  const [grants, setGrants] = useState([]);
  const [myListings, setMyListings] = useState([]);
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

  async function addToStore(product) {
    try {
      await apiRequest(`/commerce/stores/${store.id}/listings`, {
        method: 'POST',
        body: { masterProductId: product.id },
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

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-navy text-lg">Products</h2>
          <p className="text-xs text-slate-500">
            Items warehouses have added to your account — only these can be listed on your storefront. Pricing is set
            by each warehouse's wholesale price and reseller commission %, not by you.
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
          <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-3">
            {warehouse.name} · {warehouse.resellerCommissionPercent}% reseller commission
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const added = listedProductIds.has(product.id);
              const { unitWholesale, resellerCut, retail } = pricingFor({ ...product, warehouse });
              return (
                <div key={product.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {product.title}
                      {!product.isActive && (
                        <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                          Suspended
                        </span>
                      )}
                      {product.condition === 'USED' && (
                        <span className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                          Used
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{product.category} · {product.stockQuantity} in stock</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Wholesale: J${unitWholesale.toLocaleString()}
                      {product.discountPercent > 0 && (
                        <span className="text-primary font-bold"> ({product.discountPercent}% off)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      You earn: <span className="font-bold text-primary-dark">J${resellerCut.toLocaleString()}</span> per unit
                    </p>
                    <p className="text-xs text-slate-500">Customer pays: J${retail.toLocaleString()}</p>
                  </div>
                  <div className="mt-3">
                    {added ? (
                      <button
                        type="button"
                        onClick={() => removeFromStore(product)}
                        className="w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-red-50 text-primary-dark hover:text-red-600 border border-primary/20 hover:border-red-300 text-xs font-bold py-1.5 rounded-lg transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Added — remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToStore(product)}
                        disabled={!product.isActive}
                        className="btn-primary w-full flex items-center justify-center gap-1 disabled:opacity-50 text-xs py-1.5"
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
