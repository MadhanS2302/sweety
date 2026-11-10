const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/reports', require('./routes/reports'));

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Express 5 forwards errors from async handlers here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
