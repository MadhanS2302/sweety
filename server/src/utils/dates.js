const pad = (n) => String(n).padStart(2, '0');
const fmtUTC = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

// Today's date as 'YYYY-MM-DD' in the server's local time
function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// True only for real calendar dates in 'YYYY-MM-DD' format (rejects 2026-02-31)
function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && fmtUTC(d) === s;
}

// Date ranges for the three reports, based on the selected date
function getReportRange(type, dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  switch (type) {
    case 'daily':
      return { from: dateStr, to: dateStr };
    case 'month-to-date':
      return { from: `${y}-${pad(m)}-01`, to: dateStr };
    case 'monthly': {
      const first = new Date(Date.UTC(y, m - 2, 1)); // 1st of previous month
      const last = new Date(Date.UTC(y, m - 1, 0)); // last day of previous month
      return { from: fmtUTC(first), to: fmtUTC(last) };
    }
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

module.exports = { todayString, isValidDate, getReportRange };
