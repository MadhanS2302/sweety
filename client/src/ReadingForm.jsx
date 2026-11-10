import { useEffect, useState } from 'react';
import { api } from './api';
import { SLOTS, formatDate } from './utils';

// Adds a reading for `date`, or edits `editing` when it is set
export default function ReadingForm({ date, editing, onSaved, onCancel }) {
  const [slot, setSlot] = useState(SLOTS[0].key);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError('');
    setSlot(editing ? editing.slot : SLOTS[0].key);
    setValue(editing ? String(editing.value) : '');
  }, [editing]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { date: editing ? editing.date : date, slot, value };
      if (editing) await api(`/readings/${editing.id}`, { method: 'PUT', body });
      else await api('/readings', { method: 'POST', body });
      setValue('');
      onSaved();
    } catch (err) {
      setError(err.message); // e.g. "You can add only 4 readings per day."
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h3>{editing ? `Edit reading (${formatDate(editing.date)})` : `Add reading for ${formatDate(date)}`}</h3>
      <div className="row">
        <label>Time slot
          <select value={slot} onChange={(e) => setSlot(e.target.value)}>
            {SLOTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label>Glucose (mg/dl)
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 110" />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button className="btn" disabled={saving}>{editing ? 'Save changes' : 'Add reading'}</button>
        {editing && <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
