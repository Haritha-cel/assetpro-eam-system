require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  // If DATABASE_URL exists (Render), use it. Otherwise, fall back to individual locals
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'assetpro',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // SSL for Render PostgreSQL
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com')
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
});

// Simple query helper
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('DB Query Error:', err.message, '\nSQL:', text);
    throw err;
  }
};

// Transaction helper — returns a connected client
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = { query, getClient, pool };
