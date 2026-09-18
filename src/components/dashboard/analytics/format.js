const compactNumber = (n) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export const formatJmd = (n) => `J$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
export const formatJmdCompact = (n) => `J$${compactNumber(n)}`;
