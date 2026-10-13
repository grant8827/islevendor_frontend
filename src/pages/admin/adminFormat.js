// Labels, styles and formatters shared by the admin console's panels.

export const APPLICANT_TYPE_LABELS = {
  warehouse: 'Warehouse',
  reseller: 'Reseller',
  'small-vendor': 'Store',
  driver: 'Driver',
};

export const STATUS_STYLES = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-primary/10 text-primary-dark border-primary/30',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

export const inputClass =
  'bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary';

export const humanize = (value) => String(value).toLowerCase().replaceAll('_', ' ');

export const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');
