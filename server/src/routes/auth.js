const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { validateRegistration } = require('../utils/validators');

const router = express.Router();

const sign = (user) =>
  jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

router.post('/register', async (req, res) => {
  const error = validateRegistration(req.body);
  if (error) return res.status(400).json({ error });

  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const hash = await bcrypt.hash(req.body.password, 10);

  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.status(201).json({ token: sign(rows[0]), user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
