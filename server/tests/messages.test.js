const test = require('node:test');
const assert = require('node:assert/strict');
const { duplicateMessage } = require('../src/utils/validators');

test('duplicate message uses "an" before vowel-led slot names (matches the spec wording)', () => {
  assert.equal(duplicateMessage('after_lunch'), 'You already have an After lunch reading for this date.');
  assert.equal(duplicateMessage('after_breakfast'), 'You already have an After breakfast reading for this date.');
  assert.equal(duplicateMessage('after_dinner'), 'You already have an After dinner reading for this date.');
});

test('duplicate message uses "a" before the Morning slot', () => {
  assert.equal(duplicateMessage('morning'), 'You already have a Morning (fasting) reading for this date.');
});
