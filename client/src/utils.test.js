import { describe, expect, it } from 'vitest';
import { buildChartData, formatDate, slotLabel } from './utils';

describe('utils', () => {
  it('formats a date like the report headings', () => {
    expect(formatDate('2026-10-15')).toBe('15 Oct 2026');
  });

  it('turns a slot key into its label', () => {
    expect(slotLabel('after_lunch')).toBe('After lunch');
  });

  it('groups readings into one row per day, sorted by date', () => {
    const readings = [
      { date: '2026-10-03', slot: 'morning', value: 95 },
      { date: '2026-10-01', slot: 'morning', value: 100 },
      { date: '2026-10-01', slot: 'after_lunch', value: 140 },
    ];
    expect(buildChartData(readings)).toEqual([
      { date: '2026-10-01', morning: 100, after_lunch: 140 },
      { date: '2026-10-03', morning: 95 },
    ]);
  });

  it('returns an empty list when there are no readings', () => {
    expect(buildChartData([])).toEqual([]);
  });
});
