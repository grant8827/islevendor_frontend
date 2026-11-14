// The site colours a home hero card can use (Admin Console → Home Hero).
// Keys match the backend's HERO_BACKGROUNDS; classes are written out in full
// so Tailwind keeps them. Text flips to navy on the white card.
export const HERO_BACKGROUNDS = [
  { key: 'navy', label: 'Navy', swatch: 'bg-navy', card: 'bg-navy text-white' },
  { key: 'primary', label: 'Green', swatch: 'bg-primary', card: 'bg-primary text-white' },
  { key: 'primary-dark', label: 'Dark green', swatch: 'bg-primary-dark', card: 'bg-primary-dark text-white' },
  { key: 'secondary', label: 'Teal', swatch: 'bg-secondary', card: 'bg-secondary text-white' },
  { key: 'secondary-dark', label: 'Dark teal', swatch: 'bg-secondary-dark', card: 'bg-secondary-dark text-white' },
  { key: 'white', label: 'White', swatch: 'bg-white border border-slate-300', card: 'bg-white text-navy border border-slate-200' },
];

export function heroBackground(key) {
  return HERO_BACKGROUNDS.find((b) => b.key === key) ?? HERO_BACKGROUNDS[0];
}
