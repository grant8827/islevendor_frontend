import { Store, Warehouse, Truck, Building2, DollarSign, Package, ShieldCheck, MapPin, Clock, Wallet, Users } from 'lucide-react';

export const opportunities = {
  reseller: {
    role: 'RESELLER',
    icon: Store,
    eyebrow: 'Sell Without Stock',
    headline: 'Run your own store — no inventory, no warehouse, no upfront cash.',
    subtext:
      "Pick products from warehouses that approve you, set your own retail price, and keep the margin. IsleVendor handles the storefront, checkout, and delivery — you focus on selling.",
    steps: [
      { title: 'Create your storefront', body: 'Pick a store name and a custom URL — yours in seconds.' },
      { title: 'Apply to warehouses', body: 'Browse registered warehouses and apply to sell their stock.' },
      { title: 'Get items added to your account', body: 'Once approved, the warehouse decides which specific items you can sell.' },
      { title: 'List, sell, get paid', body: 'Set your retail price and keep the margin — the platform handles checkout and payout.' },
    ],
    highlights: [
      { icon: DollarSign, title: 'Keep the margin', body: 'You set the retail price above wholesale — the difference is yours.' },
      { icon: Package, title: 'Zero inventory', body: "No warehousing, no upfront stock purchase — the warehouse fulfills orders." },
      { icon: ShieldCheck, title: 'Verified warehouses', body: 'Every warehouse on the platform is a registered account you can review before applying.' },
    ],
    applyLabel: 'Apply as an Affiliate',
  },
  store: {
    role: 'STORE',
    icon: Building2,
    eyebrow: 'For Small Businesses',
    headline: 'Sell what you already stock — no warehouse, no approval needed.',
    subtext:
      "Got a small shop with your own limited catalog? List your items directly and sell straight to customers — unlike an affiliate or a warehouse, a Store sells its own stock with no approval step.",
    steps: [
      { title: 'Set up your store', body: 'Add your shop name, address, and parish.' },
      { title: 'Add your items', body: 'List what you sell — title, price, stock, and a photo.' },
      { title: 'Go live instantly', body: 'No approval step — your items appear on the marketplace as soon as you add them.' },
      { title: 'Pack and get paid', body: 'Mark orders ready for pickup — a nearby driver is dispatched, and your share is settled automatically.' },
    ],
    highlights: [
      { icon: Package, title: 'Your own catalog', body: "Small and limited is fine — list only what you actually stock." },
      { icon: Users, title: 'No approval layer', body: "Unlike an affiliate, you're not selling someone else's stock — nobody has to approve what you list." },
      { icon: Wallet, title: 'Automatic settlement', body: 'A 3-way split (store / driver / platform) is calculated and tracked per order.' },
    ],
    applyLabel: 'Add Your Store',
  },
  warehouse: {
    role: 'WAREHOUSE',
    icon: Warehouse,
    eyebrow: 'For Warehouses & Wholesalers',
    headline: 'List your stock. Let vetted affiliates move it for you.',
    subtext:
      'Register your depot, add your catalog, and approve affiliates to sell specific items on your behalf. Orders get packed by you and dispatched to a nearby courier automatically.',
    steps: [
      { title: 'Register your warehouse', body: 'Add your depot name, address, and parish.' },
      { title: 'Add your product catalog', body: 'List SKUs with wholesale pricing, stock, images, and descriptions.' },
      { title: 'Approve affiliates', body: 'Review applications and decide exactly which items each affiliate can sell.' },
      { title: 'Pack and get paid', body: 'Mark orders ready for pickup — a nearby driver is dispatched, and your share is settled automatically.' },
    ],
    highlights: [
      { icon: Package, title: 'You control the catalog', body: 'Suspend, edit, or remove any SKU at any time — affiliates only ever see what you allow.' },
      { icon: MapPin, title: 'Automatic dispatch', body: "Mark an order ready and the nearest available driver is offered the job." },
      { icon: Wallet, title: 'Automatic settlement', body: 'The 4-way split (warehouse / affiliate / driver / platform) is calculated and tracked per order.' },
    ],
    applyLabel: 'Register Your Warehouse',
  },
  driver: {
    role: 'DRIVER',
    icon: Truck,
    eyebrow: 'IsleDash Delivery',
    headline: 'Deliver on your own schedule, get paid per drop-off.',
    subtext:
      'Go online when you want to work, get offered nearby pickups in real time, and earn a delivery fee for every completed job — all across Kingston and beyond.',
    steps: [
      { title: 'Sign up', body: 'Create your driver account with your basic details.' },
      { title: 'Complete verification', body: "ID and photo verification (coming soon) keeps the platform safe for everyone." },
      { title: 'Go online', body: 'Toggle online in the driver app whenever you want to accept jobs.' },
      { title: 'Accept jobs, get paid', body: "Nearby pickups are offered to you first — complete the drop-off and your fee is settled." },
    ],
    highlights: [
      { icon: Clock, title: 'Work on your schedule', body: 'Go online and offline whenever suits you — no fixed shifts.' },
      { icon: MapPin, title: 'Nearby jobs first', body: 'Dispatch offers pickups to the closest available driver.' },
      { icon: DollarSign, title: 'Per-delivery pay', body: 'A fixed fee is set aside for you the moment a customer pays.' },
    ],
    applyLabel: 'Apply to Drive',
  },
};
