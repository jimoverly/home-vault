export const CATEGORIES = {
  valuables: { label: 'Valuables', icon: '💎', color: '#D4A574' },
  electronics: { label: 'Electronics', icon: '💻', color: '#7B9EA8' },
  furniture: { label: 'Furniture', icon: '🪑', color: '#A8937B' },
  jewelry: { label: 'Jewelry', icon: '💍', color: '#C4A882' },
  appliances: { label: 'Appliances', icon: '🏠', color: '#8BA893' },
  vehicles: { label: 'Vehicles', icon: '🚗', color: '#9B8EA8' },
  collectibles: { label: 'Collectibles', icon: '🎨', color: '#A88B7B' },
  other: { label: 'Other', icon: '📦', color: '#8B8B8B' },
};

export const DOC_TYPES = {
  insurance: { label: 'Insurance Policy', icon: '🛡️', color: '#5B8A72' },
  receipt: { label: 'Receipt / Proof of Purchase', icon: '🧾', color: '#8A7B5B' },
  warranty: { label: 'Warranty', icon: '📋', color: '#5B7B8A' },
  appraisal: { label: 'Appraisal', icon: '📊', color: '#8A5B7B' },
  identity: { label: 'ID / Personal Document', icon: '🪪', color: '#6B8A5B' },
  property: { label: 'Property / Title', icon: '🏡', color: '#8A6B5B' },
  financial: { label: 'Financial Document', icon: '💰', color: '#5B8A8A' },
  medical: { label: 'Medical Record', icon: '🏥', color: '#8A5B5B' },
  legal: { label: 'Legal Document', icon: '⚖️', color: '#5B5B8A' },
  other_doc: { label: 'Other Document', icon: '📄', color: '#7B7B7B' },
};

export function formatCurrency(val) {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(val);
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#C87070', pct: 20 };
  if (score <= 2) return { label: 'Fair', color: '#C8A870', pct: 40 };
  if (score <= 3) return { label: 'Good', color: '#A8C870', pct: 65 };
  if (score <= 4) return { label: 'Strong', color: '#70C888', pct: 85 };
  return { label: 'Excellent', color: '#50B090', pct: 100 };
}
