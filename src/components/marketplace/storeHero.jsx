// A reseller's storefront banner — shared by the public storefront page, the
// dashboard's My Store tab and the banner editor's live preview, so all three
// always show exactly the same thing.
//
import { validColor } from './heroTheme.js';

// `hero` is { heroMode: 'DEFAULT' | 'COLOR' | 'IMAGE', heroColor, heroImageUrl }
// (the fields straight off the store). Anything missing — including a shop's
// storefront, which has no custom banner — falls back to the platform default.

/**
 * The banner's background layers. Render inside a `relative overflow-hidden`
 * container, with the content in a `relative` sibling on top.
 */
export function HeroBackground({ hero }) {
  const mode = hero?.heroMode ?? 'DEFAULT';
  return (
    <>
      {/* The platform default is always underneath, so a custom banner that
          can't load (broken image URL) still falls back to it. */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-secondary-dark" aria-hidden="true" />
      {mode === 'DEFAULT' && (
        <>
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-secondary/20" aria-hidden="true" />
          <div className="absolute right-24 -bottom-20 h-40 w-40 rounded-full bg-primary/15" aria-hidden="true" />
        </>
      )}
      {mode === 'COLOR' && validColor(hero.heroColor) && <div className="absolute inset-0" style={{ background: hero.heroColor }} aria-hidden="true" />}
      {mode === 'IMAGE' && hero.heroImageUrl && (
        <>
          <img
            src={hero.heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          {/* Keeps the white store name legible over any photo. */}
          <div className="absolute inset-0 bg-navy/55" aria-hidden="true" />
        </>
      )}
    </>
  );
}
