// Shared helpers for the API integration tests.
// They start the real Express app on a random port and talk to the real PostgreSQL
// database from your .env (run `npm run migrate` first). Every user they create has an
// "apitest-" e-mail and is deleted again when the test file finishes.
const assert = require('node:assert/strict');
const config = require('../../src/config');
const app = require('../../src/app');
const db = require('../../src/db');

const available = Boolean(config.databaseUrl && config.jwtSecret);
const SKIP = available ? false : 'DATABASE_URL / JWT_SECRET not set (copy .env.example to .env first)';
const PASSWORD = 'secret123';

async function startApi() {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const createdEmails = [];

  // call('POST', '/readings', { token, body }) -> { status, data }
  async function call(method, path, { token, body, rawBody } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined || rawBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
    return { status: res.status, data };
  }

  async function registerUser(name = 'API Test') {
    const email = `apitest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
    const { status, data } = await call('POST', '/auth/register', { body: { name, email, password: PASSWORD } });
    assert.equal(status, 201);
    createdEmails.push(email);
    return { email, password: PASSWORD, token: data.token, user: data.user };
  }

  async function stop() {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (createdEmails.length) await db.query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]); // readings cascade
    await db.end();
  }

  return { call, registerUser, stop, db, createdEmails };
}

module.exports = { startApi, SKIP, PASSWORD };
