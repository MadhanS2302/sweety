const bcrypt = require('bcryptjs');
const db = require('./db');
const { SLOT_KEYS } = require('./utils/validators');
const { todayString } = require('./utils/dates');

const DEMO = { name: 'Demo User', email: 'demo@sweety.test', password: 'Demo@1234' };
const BASE = { morning: 95, after_breakfast: 150, after_lunch: 135, after_dinner: 140 };

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayString(d);
}

(async () => {
  try {
    const hash = await bcrypt.hash(DEMO.password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
      [DEMO.name, DEMO.email, hash]
    );
    const userId = rows[0].id;
    await db.query('DELETE FROM readings WHERE user_id = $1', [userId]);

    // ~60 days of readings so "monthly" (previous month) always has data
    let inserted = 0;
    for (let i = 0; i < 60; i++) {
      for (let s = 0; s < SLOT_KEYS.length; s++) {
        if ((i + s) % 7 === 0) continue; // leave some gaps, like real life
        const slot = SLOT_KEYS[s];
        const value = BASE[slot] + ((i * 7 + s * 13) % 40) - 10;
        await db.query(
          'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
          [userId, daysAgo(i), slot, value]
        );
        inserted++;
      }
    }
    console.log(`Seeded ${DEMO.email} / ${DEMO.password} with ${inserted} readings.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
