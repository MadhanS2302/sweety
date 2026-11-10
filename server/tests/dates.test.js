const test = require('node:test');
const assert = require('node:assert/strict');
const { getReportRange, isValidDate } = require('../src/utils/dates');

test('daily range is the selected date', () => {
  assert.deepEqual(getReportRange('daily', '2026-10-15'), { from: '2026-10-15', to: '2026-10-15' });
});

test('month-to-date runs from the 1st to the selected date', () => {
  assert.deepEqual(getReportRange('month-to-date', '2026-10-15'), { from: '2026-10-01', to: '2026-10-15' });
});

test('monthly is the whole previous month', () => {
  assert.deepEqual(getReportRange('monthly', '2026-10-15'), { from: '2026-09-01', to: '2026-09-30' });
});

test('monthly handles January -> December of previous year', () => {
  assert.deepEqual(getReportRange('monthly', '2026-01-10'), { from: '2025-12-01', to: '2025-12-31' });
});

test('monthly handles leap-year February', () => {
  assert.deepEqual(getReportRange('monthly', '2024-03-05'), { from: '2024-02-01', to: '2024-02-29' });
});

test('isValidDate rejects impossible dates and bad formats', () => {
  assert.equal(isValidDate('2026-02-31'), false);
  assert.equal(isValidDate('15-10-2026'), false);
  assert.equal(isValidDate('2026-10-15'), true);
});
