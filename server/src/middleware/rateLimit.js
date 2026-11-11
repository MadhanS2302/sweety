// Tiny in-memory rate limiter (fixed window, per client IP).
// Good enough for a single server instance; use a shared store such as Redis if you scale out.
function rateLimit({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'Too many attempts. Please try again later.',
  now = Date.now,
} = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  return function limiter(req, res, next) {
    const t = now();

    // Drop expired entries now and then so the map cannot grow forever
    if (hits.size > 1000) {
      for (const [key, entry] of hits) if (t >= entry.resetAt) hits.delete(key);
    }

    let entry = hits.get(req.ip);
    if (!entry || t >= entry.resetAt) {
      entry = { count: 0, resetAt: t + windowMs };
      hits.set(req.ip, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - t) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

module.exports = rateLimit;
