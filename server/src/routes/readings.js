const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { SLOTS, validateReading } = require('../utils/validators');
const { isValidDate } = require('../utils/dates');

const router = express.Router();
router.use(auth); // every route below only touches the logged-in user's data

const COLUMNS = 'id, reading_date AS date, slot, value';
const duplicateMessage = (slot) => `You already have an ${SLOTS[slot]} reading for this date.`;

// GET /api/readings?date=YYYY-MM-DD&page=1&limit=20
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const params = [req.userId];
  let where = 'user_id = $1';

  if (req.query.date) {
    if (!isValidDate(req.query.date)) return res.status(400).json({ error: 'Please choose a valid date.' });
    params.push(req.query.date);
    where += ` AND reading_date = $${params.length}`;
  }

  const total = (await db.query(`SELECT COUNT(*)::int AS n FROM readings WHERE ${where}`, params)).rows[0].n;
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM readings WHERE ${where}
     ORDER BY reading_date DESC, id ASC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params
  );
  res.json({ readings: rows, page, limit, total });
});

router.post('/', async (req, res) => {
  const error = validateReading(req.body);
  if (error) return res.status(400).json({ error });

  const { date, slot } = req.body;
  const value = Number(req.body.value);

  const { rows: day } = await db.query(
    'SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2',
    [req.userId, date]
  );
  if (day.length >= 4) return res.status(409).json({ error: 'You can add only 4 readings per day.' });
  if (day.some((r) => r.slot === slot)) return res.status(409).json({ error: duplicateMessage(slot) });

  try {
    const { rows } = await db.query(
      `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [req.userId, date, slot, value]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    // Two requests racing past the check above: the UNIQUE constraint is the safety net
    if (err.code === '23505') return res.status(409).json({ error: duplicateMessage(slot) });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const error = validateReading(req.body);
  if (error) return res.status(400).json({ error });

  const { date, slot } = req.body;
  const value = Number(req.body.value);

  const existing = await db.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!existing.rowCount) return res.status(404).json({ error: 'Reading not found.' });

  // Same checks as create, ignoring the reading being edited
  const { rows: day } = await db.query(
    'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
    [req.userId, date, req.params.id]
  );
  if (day.length >= 4) return res.status(409).json({ error: 'You can add only 4 readings per day.' });
  if (day.some((r) => r.slot === slot)) return res.status(409).json({ error: duplicateMessage(slot) });

  try {
    const { rows } = await db.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
      [date, slot, value, req.params.id, req.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: duplicateMessage(slot) });
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const result = await db.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Reading not found.' });
  res.status(204).end();
});

module.exports = router;
