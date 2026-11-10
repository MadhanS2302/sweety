const config = require('./config');

if (!config.databaseUrl || !config.jwtSecret) {
  console.error('Missing DATABASE_URL or JWT_SECRET. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = require('./app');
app.listen(config.port, () => console.log(`Sweety API running on http://localhost:${config.port}`));
