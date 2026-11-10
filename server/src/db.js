const { Pool, types } = require('pg');
const config = require('./config');

// Return DATE columns (OID 1082) as 'YYYY-MM-DD' strings, avoiding timezone shifts
types.setTypeParser(1082, (value) => value);

module.exports = new Pool({ connectionString: config.databaseUrl });
