const test = require('node:test');
const assert = require('node:assert/strict');
const rateLimit = require('../src/middleware/rateLimit');

// Minimal fake Express response that records what the middleware does
function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    set(k, v) { this.headers[k] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

function hit(limiter, ip) {
  const res = fakeRes();
  let passed = false;
  limiter({ ip }, res, () => { passed = true; });
  return { res, passed };
}

test('allows requests up to the limit, then answers 429', () => {
  const limiter = rateLimit({ max: 3, windowMs: 1000, now: () => 0 });
  for (let i = 0; i < 3; i++) assert.equal(hit(limiter, '1.1.1.1').passed, true);

  const { res, passed } = hit(limiter, '1.1.1.1');
  assert.equal(passed, false);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.error, 'Too many attempts. Please try again later.');
});

test('sends a Retry-After header in seconds', () => {
  let t = 0;
  const limiter = rateLimit({ max: 1, windowMs: 60000, now: () => t });
  hit(limiter, '1.1.1.1');
  t = 10000; // 10s into the window -> 50s left
  const { res } = hit(limiter, '1.1.1.1');
  assert.equal(res.headers['Retry-After'], '50');
});

test('each IP address has its own counter', () => {
  const limiter = rateLimit({ max: 1, windowMs: 1000, now: () => 0 });
  assert.equal(hit(limiter, '1.1.1.1').passed, true);
  assert.equal(hit(limiter, '1.1.1.1').passed, false);
  assert.equal(hit(limiter, '2.2.2.2').passed, true);
});

test('the counter resets after the window ends', () => {
  let t = 0;
  const limiter = rateLimit({ max: 1, windowMs: 1000, now: () => t });
  assert.equal(hit(limiter, '1.1.1.1').passed, true);
  assert.equal(hit(limiter, '1.1.1.1').passed, false);
  t = 1000;
  assert.equal(hit(limiter, '1.1.1.1').passed, true);
});
