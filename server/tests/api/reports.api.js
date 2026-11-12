const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApi, SKIP } = require('./helpers');

// Selected date: 15 Oct 2026. Readings are placed around the edges of each report range.
const SELECTED = '2026-10-15';
const READINGS = [
  ['2026-09-10', 'morning', 100], ['2026-09-10', 'after_dinner', 140], // previous month
  ['2026-09-30', 'morning', 120],                                       // last day of previous month
  ['2026-10-01', 'morning', 90],                                        // first day of this month
  ['2026-10-15', 'after_lunch', 150], ['2026-10-15', 'morning', 110],   // the selected day
  ['2026-10-16', 'morning', 300],                                       // after the selected day
];

describe('API: reports', { skip: SKIP }, () => {
  let api;
  let token;
  before(async () => {
    api = await startApi();
    ({ token } = await api.registerUser());
    for (const [date, slot, value] of READINGS) {
      const res = await api.call('POST', '/readings', { token, body: { date, slot, value } });
      assert.equal(res.status, 201);
    }
  });
  after(async () => { await api.stop(); });

  const report = (type, date = SELECTED, t = token) => api.call('GET', `/reports/${type}?date=${date}`, { token: t });

  test('daily: only the selected day, listed in slot order', async () => {
    const { status, data } = await report('daily');
    assert.equal(status, 200);
    assert.deepEqual([data.from, data.to], [SELECTED, SELECTED]);
    assert.deepEqual(data.stats, { count: 2, highest: 150, lowest: 110, average: 130 });
    assert.deepEqual(data.readings.map((r) => [r.slot, r.value]), [['morning', 110], ['after_lunch', 150]]);
  });

  test('month-to-date: 1st of the month up to the selected date, average to 1 decimal', async () => {
    const { data } = await report('month-to-date');
    assert.deepEqual([data.from, data.to], ['2026-10-01', SELECTED]);
    assert.deepEqual(data.stats, { count: 3, highest: 150, lowest: 90, average: 116.7 }); // 350 / 3
    assert.equal(data.readings.length, 3); // the chart uses these
  });

  test('monthly: the whole previous month', async () => {
    const { data } = await report('monthly');
    assert.deepEqual([data.from, data.to], ['2026-09-01', '2026-09-30']);
    assert.deepEqual(data.stats, { count: 3, highest: 140, lowest: 100, average: 120 });
    assert.equal(data.readings.length, 3);
  });

  test('a user with no readings gets an empty report', async () => {
    const other = await api.registerUser();
    for (const type of ['daily', 'month-to-date', 'monthly']) {
      const { status, data } = await report(type, SELECTED, other.token);
      assert.equal(status, 200);
      assert.deepEqual(data.stats, { count: 0, highest: null, lowest: null, average: null });
      assert.deepEqual(data.readings, []);
    }
  });

  test('monthly for January looks at December of the previous year', async () => {
    const { data } = await report('monthly', '2026-01-20');
    assert.deepEqual([data.from, data.to], ['2025-12-01', '2025-12-31']);
  });

  test('validation: future date, bad date and unknown report type', async () => {
    const future = await report('daily', new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
    assert.equal(future.status, 400);
    assert.equal(future.data.error, 'Date cannot be in the future.');

    const bad = await report('daily', '2026-02-31');
    assert.equal(bad.status, 400);
    assert.equal(bad.data.error, 'Please choose a valid date.');

    const unknown = await report('weekly');
    assert.equal(unknown.status, 404);
    assert.equal(unknown.data.error, 'Unknown report type.');
  });
});
