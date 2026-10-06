const { query } = require('../config/database');

const findByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await query(
    'SELECT id, name, email, role, department, is_active, last_login, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const findAll = async () => {
  const result = await query(
    'SELECT id, name, email, role, department, is_active, last_login, created_at FROM users ORDER BY role, name'
  );
  return result.rows;
};

const create = async ({ name, email, passwordHash, role, department }) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, department, created_at`,
    [name, email, passwordHash, role || 'technician', department]
  );
  return result.rows[0];
};

const updateLastLogin = async (id) => {
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
};

module.exports = { findByEmail, findById, findAll, create, updateLastLogin };
