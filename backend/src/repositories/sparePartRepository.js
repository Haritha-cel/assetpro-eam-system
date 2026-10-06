const { query } = require('../config/database');

const findAll = async ({ search, lowStock } = {}) => {
  const conditions = [];
  const params = [];
  if (search)   { conditions.push(`(name ILIKE $${params.length+1} OR sku ILIKE $${params.length+1})`); params.push(`%${search}%`); }
  if (lowStock) { conditions.push(`quantity <= reorder_point`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT *, (quantity <= reorder_point) AS is_low_stock,
            ROUND((quantity::numeric / NULLIF(max_stock,0) * 100), 1) AS stock_pct
     FROM spare_parts ${where} ORDER BY name`,
    params
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await query('SELECT * FROM spare_parts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const create = async ({ name, sku, description, quantity, unitCost, reorderPoint, maxStock, supplier }) => {
  const result = await query(
    `INSERT INTO spare_parts (name, sku, description, quantity, unit_cost, reorder_point, max_stock, supplier)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, sku, description, quantity || 0, unitCost, reorderPoint || 0, maxStock || 100, supplier]
  );
  return result.rows[0];
};

const adjustStock = async (id, adjustment) => {
  const result = await query(
    `UPDATE spare_parts SET quantity = quantity + $1 WHERE id = $2 RETURNING *`,
    [adjustment, id]
  );
  return result.rows[0];
};

module.exports = { findAll, findById, create, adjustStock };
