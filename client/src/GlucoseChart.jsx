import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SLOTS, buildChartData, formatDate } from './utils';

const COLORS = { morning: '#be185d', after_breakfast: '#d97706', after_lunch: '#2563eb', after_dinner: '#059669' };

// Line chart of readings over a period: one line per time slot
export default function GlucoseChart({ readings }) {
  const data = buildChartData(readings);

  return (
    <div className="chart" aria-label="Glucose readings chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={(d) => String(Number(d.slice(8)))} fontSize={12} />
          <YAxis domain={[(min) => Math.floor((min - 10) / 10) * 10, (max) => Math.ceil((max + 10) / 10) * 10]} fontSize={12} />
          <Tooltip labelFormatter={formatDate} formatter={(v) => `${v} mg/dl`} />
          <Legend />
          {SLOTS.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={COLORS[s.key]}
              strokeWidth={2} dot={{ r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="muted chart-note">Day of the month on the horizontal axis, mg/dl on the vertical axis.</p>
    </div>
  );
}
