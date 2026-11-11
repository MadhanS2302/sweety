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

// Readings -> one row per day, with one column per slot, ready for a line chart:
// [{ date: '2026-11-03', morning: 95, after_lunch: 140 }, ...]
export function buildChartData(readings) {
  const byDate = new Map();
  for (const r of readings) {
    if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date });
    byDate.get(r.date)[r.slot] = r.value;
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
