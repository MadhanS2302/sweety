const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistration } = require('../src/utils/validators');

const ok = { name: 'Asha', email: 'asha@example.com', password: 'secret123' };
const check = (patch) => validateRegistration({ ...ok, ...patch });

test('valid registration passes', () => assert.equal(check({}), null));

test('name is required', () => {
  assert.equal(check({ name: '' }), 'Please enter your name.');
  assert.equal(check({ name: '   ' }), 'Please enter your name.');
  assert.equal(check({ name: undefined }), 'Please enter your name.');
});

test('email must look like an email address', () => {
  const msg = 'Please enter a valid email address.';
  assert.equal(check({ email: '' }), msg);
  assert.equal(check({ email: 'asha' }), msg);
  assert.equal(check({ email: 'asha@example' }), msg);
  assert.equal(check({ email: 'asha @example.com' }), msg);
});

test('password must be at least 8 characters', () => {
  const msg = 'Password must be at least 8 characters.';
  assert.equal(check({ password: '' }), msg);
  assert.equal(check({ password: 'short12' }), msg);
  assert.equal(check({ password: '12345678' }), null);
});
