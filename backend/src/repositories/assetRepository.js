const { query } = require('../config/database');

// Get all assets with maintenance schedule joined
const findAll = async ({ status, assetType, search } = {}) => {
  const conditions = [];
  const params = [];

  if (status)    { conditions.push(`a.status = $${params.length + 1}`);      params.push(status); }
  if (assetType) { conditions.push(`a.asset_type = $${params.length + 1}`);  params.push(assetType); }
  if (search)    {
    conditions.push(`(a.name ILIKE $${params.length + 1} OR a.asset_code ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(`
    SELECT
      a.*,
      ms.interval_hours,
      ms.last_service_hours,
      ms.last_service_date,
      (ms.last_service_hours + ms.interval_hours)             AS next_service_hours,
      (a.running_hours - ms.last_service_hours)               AS hours_since_service,
      (ms.last_service_hours + ms.interval_hours - a.running_hours) AS hours_until_service,
      ROUND(
        ((a.running_hours - ms.last_service_hours) / NULLIF(ms.interval_hours, 0) * 100)::numeric, 1
      ) AS maintenance_pct
    FROM assets a
    LEFT JOIN maintenance_schedules ms
           ON ms.asset_id = a.id AND ms.is_active = true
    ${where}
    ORDER BY a.name
  `, params);

  return result.rows;
};

const findById = async (id) => {
  const result = await query(`
    SELECT
      a.*,
      ms.interval_hours,
      ms.last_service_hours,
      ms.last_service_date,
      (ms.last_service_hours + ms.interval_hours)             AS next_service_hours,
      (a.running_hours - ms.last_service_hours)               AS hours_since_service,
      (ms.last_service_hours + ms.interval_hours - a.running_hours) AS hours_until_service,
      ROUND(
        ((a.running_hours - ms.last_service_hours) / NULLIF(ms.interval_hours, 0) * 100)::numeric, 1
      ) AS maintenance_pct
    FROM assets a
    LEFT JOIN maintenance_schedules ms
           ON ms.asset_id = a.id AND ms.is_active = true
    WHERE a.id = $1
  `, [id]);
  return result.rows[0] || null;
};

const create = async ({ name, assetCode, serialNumber, assetType, status, location, runningHours, manufacturer, model, year, purchaseCost, notes, createdBy }) => {
  const result = await query(`
    INSERT INTO assets
      (name, asset_code, serial_number, asset_type, status, location, running_hours, manufacturer, model, year, purchase_cost, notes, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
  `, [name, assetCode, serialNumber, assetType, status || 'active', location, runningHours || 0, manufacturer, model, year, purchaseCost, notes, createdBy]);
  return result.rows[0];
};

const update = async (id, { name, status, location, runningHours, notes }) => {
  const fields  = [];
  const params  = [];
  if (name         !== undefined) { fields.push(`name = $${params.length+1}`);          params.push(name); }
  if (status       !== undefined) { fields.push(`status = $${params.length+1}`);        params.push(status); }
  if (location     !== undefined) { fields.push(`location = $${params.length+1}`);      params.push(location); }
  if (runningHours !== undefined) { fields.push(`running_hours = $${params.length+1}`); params.push(runningHours); }
  if (notes        !== undefined) { fields.push(`notes = $${params.length+1}`);         params.push(notes); }
  if (!fields.length) return findById(id);
  params.push(id);
  const result = await query(
    `UPDATE assets SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0];
};

// Assets that have exceeded their maintenance threshold
const findDueForMaintenance = async () => {
  const result = await query(`
    SELECT a.*, ms.interval_hours, ms.last_service_hours,
           (a.running_hours - ms.last_service_hours) AS hours_since_service,
           (ms.last_service_hours + ms.interval_hours - a.running_hours) AS hours_until_service
    FROM assets a
    JOIN maintenance_schedules ms ON ms.asset_id = a.id AND ms.is_active = true
    WHERE a.running_hours >= (ms.last_service_hours + ms.interval_hours)
      AND a.status != 'retired'
    ORDER BY hours_until_service ASC
  `);
  return result.rows;
};

const getStatusCounts = async () => {
  const result = await query('SELECT status, COUNT(*) AS count FROM assets GROUP BY status');
  return result.rows;
};

module.exports = { findAll, findById, create, update, findDueForMaintenance, getStatusCounts };
