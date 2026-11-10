require('dotenv').config();
const { Pool } = require('pg');

// Cloud (Render/Neon): DATABASE_URL with SSL
// Local: separate DB_* values from your .env
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 10000,
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'assetpro',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('DB Query Error:', err.message, '\nSQL:', text);
    throw err;
  }
};

const getClient = async () => {
  return await pool.connect();
};

module.exports = { query, getClient, pool };