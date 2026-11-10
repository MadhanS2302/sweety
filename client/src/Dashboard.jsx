import { useEffect, useState } from 'react';
import { api } from './api';
import ReadingForm from './ReadingForm.jsx';
import Reports from './Reports.jsx';
import { slotLabel, todayString } from './utils';

export default function Dashboard() {
  const [date, setDate] = useState(todayString());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [version, setVersion] = useState(0); // bump to reload readings + reports
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api(`/readings?date=${date}`)
      .then((data) => !ignore && setReadings(data.readings))
      .catch((err) => !ignore && setError(err.message));
    return () => { ignore = true; };
  }, [date, version]);

  const refresh = () => { setEditing(null); setError(''); setVersion((v) => v + 1); };

  async function remove(reading) {
    if (!window.confirm(`Delete the ${slotLabel(reading.slot)} reading (${reading.value} mg/dl)?`)) return;
    try {
      await api(`/readings/${reading.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <div className="card">
        <label>Selected date
          <input type="date" value={date} max={todayString()}
            onChange={(e) => { setDate(e.target.value); setEditing(null); setError(''); }} />
        </label>
      </div>

      <ReadingForm date={date} editing={editing} onSaved={refresh} onCancel={() => setEditing(null)} />

      <section className="card">
        <h3>Readings on this date</h3>
        {error && <p className="error" role="alert">{error}</p>}
        {readings.length === 0 ? (
          <p className="empty">No readings yet for this date.</p>
        ) : (
          <ul className="list">
            {readings.map((r) => (
              <li key={r.id}>
                <span>{slotLabel(r.slot)}</span>
                <strong>{r.value} mg/dl</strong>
                <span className="actions">
                  <button className="link" onClick={() => setEditing(r)}>Edit</button>
                  <button className="link danger" onClick={() => remove(r)}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Reports date={date} refreshKey={version} />
    </main>
  );
}
