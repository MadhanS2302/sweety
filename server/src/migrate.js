const fs = require('fs');
const path = require('path');
const db = require('./db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(sql);
    console.log('Migration complete: tables are ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
