export const SLOTS = [
  { key: 'morning', label: 'Morning (fasting)' },
  { key: 'after_breakfast', label: 'After breakfast' },
  { key: 'after_lunch', label: 'After lunch' },
  { key: 'after_dinner', label: 'After dinner' },
];

export const slotLabel = (key) => SLOTS.find((s) => s.key === key)?.label ?? key;

const pad = (n) => String(n).padStart(2, '0');
export const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// '2026-10-15' -> '15 Oct 2026'
export const formatDate = (s) =>
  new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
