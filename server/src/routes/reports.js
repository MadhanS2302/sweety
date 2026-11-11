const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { SLOT_KEYS } = require('../utils/validators');
const { isValidDate, todayString, getReportRange } = require('../utils/dates');
const { computeStats } = require('../utils/stats');

const router = express.Router();
router.use(auth);

// GET /api/reports/daily | month-to-date | monthly ?date=YYYY-MM-DD
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  if (!['daily', 'month-to-date', 'monthly'].includes(type)) {
    return res.status(404).json({ error: 'Unknown report type.' });
  }
  const date = req.query.date || todayString();
  if (!isValidDate(date)) return res.status(400).json({ error: 'Please choose a valid date.' });
  if (date > todayString()) return res.status(400).json({ error: 'Date cannot be in the future.' });

  const { from, to } = getReportRange(type, date);
  const { rows } = await db.query(
    `SELECT id, reading_date AS date, slot, value FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [req.userId, from, to]
  );
  rows.sort((a, b) => a.date.localeCompare(b.date) || SLOT_KEYS.indexOf(a.slot) - SLOT_KEYS.indexOf(b.slot));

  // Every report also returns its readings: the daily report lists them and the
  // month-to-date / monthly reports use them to draw the chart
  res.json({ type, from, to, stats: computeStats(rows.map((r) => r.value)), readings: rows });
});

module.exports = router;
