// Which text/chip colors stay readable on a storefront banner — see
// storeHero.jsx for the banner itself. `hero` is the store's
// { heroMode, heroColor, heroImageUrl }.

const DARK_TEXT_ON_LIGHT = {
  text: 'text-navy',
  muted: 'text-slate-600',
  chip: 'bg-navy/10 border-navy/20 hover:bg-navy/15',
  icon: 'text-primary-dark',
};
const LIGHT_TEXT_ON_DARK = {
  text: 'text-white',
  muted: 'text-slate-300',
  chip: 'bg-white/10 border-white/20 hover:bg-white/20',
  icon: 'text-primary',
};

// WCAG relative luminance — a light banner color needs dark text, a dark
// one needs white.
function isLightColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4;
}

export const validColor = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);

/** Text/chip class names that stay readable on this banner. */
export function heroTheme(hero) {
  if (hero?.heroMode === 'COLOR' && validColor(hero.heroColor) && isLightColor(hero.heroColor)) return DARK_TEXT_ON_LIGHT;
  return LIGHT_TEXT_ON_DARK; // default gradient, dark colors, and images (which get a dark overlay)
}
