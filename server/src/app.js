const express = require('express');
const cors = require('cors');
const config = require('./config');
const rateLimit = require('./middleware/rateLimit');

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '10kb' }));
// A request without a JSON body leaves req.body undefined; give the routes an empty object instead
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
// Slow down password guessing on login / register
app.use('/api/auth', rateLimit({ max: 30 }), require('./routes/auth'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/reports', require('./routes/reports'));

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Express 5 forwards errors from async handlers here
app.use((err, req, res, next) => {
  // Problems with the request itself are the client's fault, not a server error
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
