const test = require('node:test');
const assert = require('node:assert/strict');
const { validateReading } = require('../src/utils/validators');

const TODAY = '2026-10-15';
const ok = { value: 120, date: '2026-10-15', slot: 'morning' };
const check = (patch) => validateReading({ ...ok, ...patch }, TODAY);

test('valid reading passes', () => assert.equal(check({}), null));

test('value is required', () => {
  assert.equal(check({ value: '' }), 'Please enter a glucose value.');
  assert.equal(check({ value: undefined }), 'Please enter a glucose value.');
});

test('value must be a whole number between 40 and 600', () => {
  const msg = 'Value must be between 40 and 600 mg/dl.';
  assert.equal(check({ value: 39 }), msg);
  assert.equal(check({ value: 601 }), msg);
  assert.equal(check({ value: 120.5 }), msg);
  assert.equal(check({ value: 'abc' }), msg);
  assert.equal(check({ value: 40 }), null);
  assert.equal(check({ value: 600 }), null);
});

test('date cannot be in the future', () => {
  assert.equal(check({ date: '2026-10-16' }), 'Date cannot be in the future.');
  assert.equal(check({ date: TODAY }), null);
});

test('slot must be one of the 4 slots', () => {
  assert.equal(check({ slot: 'midnight' }), 'Please choose a time slot.');
});
