require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Force SSL for Render
});

async function setup() {
  console.log('⏳ Creating tables on Render database...');
  try {
    // Read your schema file
    const schemaSql = fs.readFileSync('../docs/schema.sql', 'utf8');
    
    // Execute it
    await pool.query(schemaSql);
    console.log('✅ Schema created successfully! Tables now exist.');
  } catch (err) {
    console.error('❌ Schema failed:', err.message);
  } finally {
    await pool.end();
  }
}

setup();