const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApi, SKIP, PASSWORD } = require('./helpers');

describe('API: auth and request handling', { skip: SKIP }, () => {
  let api;
  before(async () => { api = await startApi(); });
  after(async () => { await api.stop(); });

  test('register returns a token and the user, never the password', async () => {
    const { token, user } = await api.registerUser('Asha');
    assert.ok(token.length > 20);
    assert.equal(user.name, 'Asha');
    assert.equal(Object.keys(user).sort().join(), 'email,id,name');
  });

  test('the password is stored as a bcrypt hash, not as plain text', async () => {
    const { email } = await api.registerUser();
    const { rows } = await api.db.query('SELECT password_hash FROM users WHERE email = $1', [email]);
    assert.notEqual(rows[0].password_hash, PASSWORD);
    assert.match(rows[0].password_hash, /^\$2[aby]\$/);
  });

  test('registering the same e-mail twice is rejected, even with different capitals', async () => {
    const { email } = await api.registerUser();
    const { status, data } = await api.call('POST', '/auth/register', {
      body: { name: 'Again', email: email.toUpperCase(), password: PASSWORD },
    });
    assert.equal(status, 409);
    assert.equal(data.error, 'An account with this email already exists.');
  });

  test('registration validation errors come back as 400 with a clear message', async () => {
    const bad = (body) => api.call('POST', '/auth/register', { body });
    assert.equal((await bad({ email: 'a@b.co', password: PASSWORD })).data.error, 'Please enter your name.');
    assert.equal((await bad({ name: 'A', email: 'nope', password: PASSWORD })).data.error, 'Please enter a valid email address.');
    const short = await bad({ name: 'A', email: 'a@b.co', password: '123' });
    assert.equal(short.status, 400);
    assert.equal(short.data.error, 'Password must be at least 8 characters.');
  });

  test('login works, and the e-mail is not case sensitive', async () => {
    const { email } = await api.registerUser();
    const { status, data } = await api.call('POST', '/auth/login', {
      body: { email: email.toUpperCase(), password: PASSWORD },
    });
    assert.equal(status, 200);
    assert.ok(data.token);
    assert.equal(data.user.email, email);
  });

  test('a wrong password and an unknown e-mail get the same 401 message', async () => {
    const { email } = await api.registerUser();
    const wrongPassword = await api.call('POST', '/auth/login', { body: { email, password: 'wrong-password' } });
    const unknownEmail = await api.call('POST', '/auth/login', { body: { email: 'nobody@example.test', password: PASSWORD } });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.data.error, 'Invalid email or password.');
    assert.equal(unknownEmail.data.error, 'Invalid email or password.');
  });

  test('readings and reports need a valid token', async () => {
    for (const path of ['/readings', '/reports/daily']) {
      const missing = await api.call('GET', path);
      assert.equal(missing.status, 401);
      assert.equal(missing.data.error, 'Please log in.');

      const garbage = await api.call('GET', path, { token: 'not-a-real-token' });
      assert.equal(garbage.status, 401);
      assert.equal(garbage.data.error, 'Session expired. Please log in again.');
    }
  });

  test('requests with no body are handled as normal 4xx errors, not 500', async () => {
    assert.equal((await api.call('POST', '/auth/register')).status, 400);
    assert.equal((await api.call('POST', '/auth/login')).status, 401);
    const { token } = await api.registerUser();
    const noBody = await api.call('POST', '/readings', { token });
    assert.equal(noBody.status, 400);
    assert.equal(noBody.data.error, 'Please enter a glucose value.');
  });

  test('malformed JSON is a 400 with a clear message', async () => {
    const { status, data } = await api.call('POST', '/auth/login', { rawBody: '{bad json' });
    assert.equal(status, 400);
    assert.equal(data.error, 'Request body is not valid JSON.');
  });

  test('an oversized body is rejected with 413', async () => {
    const { status } = await api.call('POST', '/auth/login', { body: { email: 'a'.repeat(20000) } });
    assert.equal(status, 413);
  });
});
