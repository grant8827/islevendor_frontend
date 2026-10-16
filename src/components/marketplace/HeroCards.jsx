import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import OceanScene from './OceanScene.jsx';
import isledashLogo from '../../assets/isledash-logo.png';

// Every card: the same size, side by side in a row you scroll sideways.
const CARD =
  'relative flex h-[380px] w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl p-6 shadow-sm sm:w-[340px] lg:w-[360px]';
const HEADLINE = 'text-[28px] font-black leading-[1.08] tracking-tight';
const PRIMARY = 'btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-md';

function ShopLocalCard() {
  return (
    <article className={`${CARD} bg-[#0b2a5b] text-white`}>
      <OceanScene fit="xMaxYMax slice" />
      <div className="relative">
        <h2 className={HEADLINE}>
          Shop Local.
          <span className="block">Support Local.</span>
        </h2>
        <p className="mt-2 text-lg font-bold leading-snug">Build a Stronger Jamaica.</p>
      </div>
      <Link to="/?category=All" className={`${PRIMARY} relative mt-auto self-start px-6 py-3 text-base`}>
        Shop Now <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function MarketplaceCard() {
  return (
    <article className={`${CARD} bg-linear-to-br from-white via-slate-50 to-teal-50 text-ink`}>
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-secondary/10" />
      <div className="absolute -bottom-24 -left-16 h-48 w-[120%] -rotate-3 rounded-[50%] bg-primary/15" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-dark">
          <MapPin className="h-3 w-3" /> Across Jamaica
        </span>
        <h2 className={`${HEADLINE} mt-3 text-navy`}>
          Everything you need,
          <span className="block text-primary">closer to home.</span>
        </h2>
        <p className="mt-3 text-sm leading-6">Compare local offers and order from Jamaican businesses.</p>
      </div>
      <div className="relative mt-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          <Link to="/?category=All" className={PRIMARY}>
            Shop marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><PackageCheck className="h-3.5 w-3.5 text-primary" /> New every day</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Shop with confidence</span>
        </div>
      </div>
    </article>
  );
}

function IsleDashCard() {
  return (
    <article className={`${CARD} bg-linear-to-b from-sky-50 via-white to-primary/10 text-ink`}>
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-dark">
          <Truck className="h-3 w-3" /> IsleDash delivery
        </span>
        <h2 className={`${HEADLINE} mt-3 text-navy`}>
          From store to door,
          <span className="block text-primary">across the island.</span>
        </h2>
      </div>
      <img src={isledashLogo} alt="IsleDash: we deliver from store to door" className="relative mx-auto my-2 h-32 w-32 object-contain" />
      <div className="relative mt-auto space-y-2">
        <Link to="/?category=All" className={PRIMARY}>
          Start shopping <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-slate-600">Delivered to your door, or pick it up yourself for free.</p>
      </div>
    </article>
  );
}

function DealsCard() {
  return (
    <article className={`${CARD} bg-linear-to-br from-primary to-primary-dark text-white`}>
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
      <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/10" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          <BadgePercent className="h-3 w-3" /> Deals
        </span>
        <h2 className={`${HEADLINE} mt-3`}>
          Great prices,
          <span className="block">every day.</span>
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/90">Discounts from local stores and resellers, updated all the time.</p>
      </div>
      <BadgePercent className="relative mx-auto my-2 h-24 w-24 text-white/90" strokeWidth={1.25} />
      <a href="#sales" className="relative mt-auto inline-flex items-center justify-center gap-2 self-start rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-primary-dark shadow-md transition hover:bg-slate-50">
        Shop deals <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}

const CARDS = [ShopLocalCard, MarketplaceCard, IsleDashCard, DealsCard];

/**
 * The home page's featured cards: a row that scrolls sideways (swipe,
 * trackpad or the arrows), several cards in view at once. No autoplay.
 * Each arrow only shows while there's more to see in its direction.
 */
export default function HeroCards() {
  const row = useRef(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);

  const update = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setCanBack(el.scrollLeft > 4);
    setCanForward(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  // One card's width (plus the gap) per click.
  function scrollByCard(direction) {
    const el = row.current;
    const card = el?.firstElementChild;
    if (!el || !card) return;
    el.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: 'smooth' });
  }

  return (
    <section aria-label="Featured" className="relative mx-auto max-w-7xl px-4 pt-6">
      <div
        ref={row}
        className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CARDS.map((Card, i) => (
          <Card key={i} />
        ))}
      </div>

      {canBack && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll back"
          className="absolute left-4 top-1/2 hidden h-24 w-11 -translate-y-1/2 items-center justify-center rounded-r-xl border border-slate-200 bg-white/95 text-navy shadow-md transition hover:bg-white sm:flex"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}
      {canForward && (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Scroll forward"
          className="absolute right-4 top-1/2 hidden h-24 w-11 -translate-y-1/2 items-center justify-center rounded-l-xl border border-slate-200 bg-white/95 text-navy shadow-md transition hover:bg-white sm:flex"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}
    </section>
  );
}
