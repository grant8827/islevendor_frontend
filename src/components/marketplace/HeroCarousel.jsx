import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgePercent,
  Bike,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import OceanScene from './OceanScene.jsx';
import isledashLogo from '../../assets/isledash-logo.png';
import marketplaceArt from '../../assets/islevendor_hero.png';

const AUTOPLAY_MS = 7000;

// Shared height for every slide: shorter than the old single hero.
const SLIDE = 'relative flex w-full overflow-hidden min-h-[400px] sm:min-h-[360px] lg:min-h-[380px]';
const INNER = 'relative mx-auto flex w-full max-w-7xl items-center px-6 pb-12 pt-10 sm:px-14 lg:px-16';

function Badge({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" /> {children}
    </span>
  );
}

function ShopLocalSlide() {
  return (
    <div className={`${SLIDE} bg-[#0b2a5b] text-white`}>
      <OceanScene />
      <div className={INNER}>
        <div className="max-w-xl">
          <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Shop Local.
            <span className="block">Support Local.</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl">Build a Stronger Jamaica.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/85 sm:text-base">
            Every order supports a Jamaican business, from Kingston to Montego Bay.
          </p>
          <Link to="/?category=All" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base shadow-lg shadow-black/20">
            Shop Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MarketplaceSlide() {
  return (
    <div className={`${SLIDE} bg-linear-to-br from-white via-slate-50 to-teal-50 text-ink`}>
      <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-secondary/10" />
      <div className="absolute -bottom-56 -left-16 h-80 w-[70%] -rotate-3 rounded-[50%] bg-secondary/10" />
      <div className="absolute -bottom-64 -left-24 h-80 w-[60%] rotate-2 rounded-[50%] bg-primary/15" />
      <div className={INNER}>
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-dark">
            <MapPin className="h-3.5 w-3.5" /> Made for shoppers across Jamaica
          </span>
          <h2 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-navy sm:text-4xl lg:text-5xl">
            Everything you need,
            <span className="block text-primary">closer to home.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 sm:text-base">
            Browse great products, compare local offers, and order from Jamaican businesses. IsleVendor makes shopping across the island simple.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/?category=All" className="btn-primary inline-flex items-center gap-2 px-5 py-3 shadow-lg shadow-primary/20">
              Shop marketplace <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#sales" className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-white px-5 py-3 font-bold text-navy shadow-sm transition hover:border-secondary hover:text-secondary-dark">
              <BadgePercent className="h-4 w-4" /> Browse deals
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <Badge icon={PackageCheck}>New items every day</Badge>
            <Badge icon={ShieldCheck}>Shop with confidence</Badge>
            <Badge icon={Truck}>Convenient delivery</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function IsleDashSlide() {
  return (
    <div className={`${SLIDE} bg-linear-to-br from-sky-50 via-white to-primary/10 text-ink`}>
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-sky-200/40" />
      <div className="absolute -bottom-40 right-[-10%] h-72 w-[60%] rotate-3 rounded-[50%] bg-primary/15" />
      <div className={`${INNER} gap-10`}>
        <div className="max-w-xl flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-dark">
            <Truck className="h-3.5 w-3.5" /> IsleDash delivery
          </span>
          <h2 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-navy sm:text-4xl lg:text-5xl">
            From store to door,
            <span className="block text-primary">across the island.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 sm:text-base">
            Local IsleDash drivers bring your order to your door, and you can follow it every step of the way. Or pick it up yourself, free.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/?category=All" className="btn-primary inline-flex items-center gap-2 px-5 py-3 shadow-lg shadow-primary/20">
              Start shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/opportunities/driver" className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-white px-5 py-3 font-bold text-navy shadow-sm transition hover:border-secondary hover:text-secondary-dark">
              <Bike className="h-4 w-4" /> Drive with IsleDash
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <Badge icon={Users}>Local drivers</Badge>
            <Badge icon={MapPin}>Track your order</Badge>
            <Badge icon={PackageCheck}>Free pickup option</Badge>
          </div>
        </div>
        <div className="hidden shrink-0 lg:block">
          <div className="rounded-3xl border border-white bg-white/80 p-4 shadow-2xl shadow-navy/10">
            <img src={isledashLogo} alt="IsleDash: we deliver from store to door" className="h-56 w-56 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SellSlide() {
  return (
    <div className={`${SLIDE} bg-linear-to-br from-white via-slate-50 to-emerald-50 text-ink`}>
      <div className={`${INNER} gap-10`}>
        <div className="max-w-xl flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-dark">
            <Store className="h-3.5 w-3.5" /> For Jamaican businesses
          </span>
          <h2 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-navy sm:text-4xl lg:text-5xl">
            Sell on IsleVendor.
            <span className="block text-primary">Grow your business.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 sm:text-base">
            Open a store, resell products from local warehouses, or supply resellers island-wide. We handle payments and delivery.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/opportunities/store" className="btn-primary inline-flex items-center gap-2 px-5 py-3 shadow-lg shadow-primary/20">
              Open a store <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/opportunities/reseller" className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-white px-5 py-3 font-bold text-navy shadow-sm transition hover:border-secondary hover:text-secondary-dark">
              <Users className="h-4 w-4" /> Become a reseller
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-600">
            <Warehouse className="mr-1.5 inline h-4 w-4 text-primary" />
            Run a warehouse?{' '}
            <Link to="/opportunities/warehouse" className="font-bold text-navy hover:underline">
              Supply resellers
            </Link>
          </p>
        </div>
        <div className="hidden w-[46%] shrink-0 self-stretch lg:block">
          <img src={marketplaceArt} alt="" className="h-full max-h-[320px] w-full rounded-2xl object-cover object-[78%_center] shadow-2xl shadow-navy/10" />
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  { key: 'shop-local', label: 'Shop local', Slide: ShopLocalSlide },
  { key: 'marketplace', label: 'Everything you need', Slide: MarketplaceSlide },
  { key: 'isledash', label: 'IsleDash delivery', Slide: IsleDashSlide },
  { key: 'sell', label: 'Sell on IsleVendor', Slide: SellSlide },
];

/**
 * The home page's banners. Swipe or scroll them sideways (native scroll
 * snapping), or use the arrows and dots. They move on by themselves every
 * few seconds, except while the pointer or keyboard focus is on them, the
 * tab is hidden, or the visitor prefers reduced motion.
 */
export default function HeroCarousel() {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const goTo = useCallback(
    (index) => {
      const el = track.current;
      if (!el) return;
      const next = (index + SLIDES.length) % SLIDES.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion],
  );

  // Which slide is showing, from the scroll position (swipes included).
  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActive(Math.round(el.scrollLeft / el.clientWidth)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Keep the current slide in place when the window is resized.
  useEffect(() => {
    const onResize = () => {
      const el = track.current;
      if (el) el.scrollTo({ left: active * el.clientWidth, behavior: 'auto' });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  // Autoplay: restarts after every change, so a manual swipe gets a full turn.
  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = setTimeout(() => {
      if (document.visibilityState === 'visible') goTo(active + 1);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [active, paused, reducedMotion, goTo]);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(active - 1);
    }
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onKeyDown={onKeyDown}
    >
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map(({ key, label, Slide }, i) => (
          <div key={key} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}: ${label}`} inert={i !== active} className="flex w-full shrink-0 snap-start">
            <Slide />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(active - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-navy shadow-md backdrop-blur transition hover:bg-white sm:block"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(active + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-navy shadow-md backdrop-blur transition hover:bg-white sm:block"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map(({ key, label }, i) => (
          <button
            key={key}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show slide ${i + 1}: ${label}`}
            aria-current={i === active ? 'true' : undefined}
            className={`h-2.5 rounded-full shadow transition-all ${i === active ? 'w-7 bg-primary' : 'w-2.5 bg-white/80 hover:bg-white'}`}
          />
        ))}
      </div>
    </section>
  );
}
