import { useEffect, useState } from 'react';
import { api } from './api';
import GlucoseChart from './GlucoseChart.jsx';
import { formatDate, slotLabel } from './utils';

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'month-to-date', label: 'Month-to-date' },
  { key: 'monthly', label: 'Previous month' },
];

export default function Reports({ date, refreshKey }) {
  const [type, setType] = useState('daily');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setError('');
    api(`/reports/${type}?date=${date}`)
      .then((data) => !ignore && setReport(data))
      .catch((err) => { if (!ignore) { setReport(null); setError(err.message); } });
    return () => { ignore = true; };
  }, [type, date, refreshKey]);

  const range = report && (report.from === report.to
    ? formatDate(report.from)
    : `${formatDate(report.from)} – ${formatDate(report.to)}`);

  return (
    <section className="card">
      <h3>Reports</h3>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${type === t.key ? 'active' : ''}`} onClick={() => setType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {report && (
        <>
          <p className="muted">{range}</p>
          {report.stats.count === 0 ? (
            <p className="empty">No readings for this period yet. Add one to see your report. 🌱</p>
          ) : (
            <div className="stats">
              <Stat label="Highest" value={report.stats.highest} />
              <Stat label="Lowest" value={report.stats.lowest} />
              <Stat label="Average" value={report.stats.average.toFixed(1)} />
              <Stat label="Readings" value={report.stats.count} unit="" />
            </div>
          )}
          {type !== 'daily' && report.readings.length > 0 && <GlucoseChart readings={report.readings} />}
          {type === 'daily' && report.readings.length > 0 && (
            <ul className="list">
              {report.readings.map((r) => (
                <li key={r.id}><span>{slotLabel(r.slot)}</span><strong>{r.value} mg/dl</strong></li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, unit = 'mg/dl' }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="muted">{label}{unit && ` (${unit})`}</div>
    </div>
  );
}
