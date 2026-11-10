const test = require('node:test');
const assert = require('node:assert/strict');
const { computeStats } = require('../src/utils/stats');

test('computes highest, lowest, count and average rounded to 1 decimal', () => {
  assert.deepEqual(computeStats([100, 120, 141]), { count: 3, highest: 141, lowest: 100, average: 120.3 });
});

test('empty list gives an empty result', () => {
  assert.deepEqual(computeStats([]), { count: 0, highest: null, lowest: null, average: null });
});
