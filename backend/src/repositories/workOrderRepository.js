const { query, getClient } = require('../config/database');

const findAll = async ({ status, priority, assignedTo, assetId } = {}) => {
  const conditions = [];
  const params = [];

  if (status)     { conditions.push(`wo.status = $${params.length+1}`);      params.push(status); }
  if (priority)   { conditions.push(`wo.priority = $${params.length+1}`);    params.push(priority); }
  if (assignedTo) { conditions.push(`wo.assigned_to = $${params.length+1}`); params.push(assignedTo); }
  if (assetId)    { conditions.push(`wo.asset_id = $${params.length+1}`);    params.push(assetId); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(`
    SELECT
      wo.*,
      a.name        AS asset_name,
      a.asset_code,
      u1.name       AS assigned_to_name,
      u2.name       AS created_by_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', wop.id,
            'part_name', sp.name,
            'sku', sp.sku,
            'quantity', wop.quantity
          )
        ) FILTER (WHERE wop.id IS NOT NULL), '[]'
      ) AS parts
    FROM work_orders wo
    JOIN  assets a  ON a.id  = wo.asset_id
    LEFT JOIN users u1 ON u1.id = wo.assigned_to
    LEFT JOIN users u2 ON u2.id = wo.created_by
    LEFT JOIN work_order_parts wop ON wop.work_order_id = wo.id
    LEFT JOIN spare_parts sp       ON sp.id = wop.spare_part_id
    ${where}
    GROUP BY wo.id, a.name, a.asset_code, u1.name, u2.name
    ORDER BY
      CASE wo.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
      wo.due_date ASC NULLS LAST,
      wo.created_at DESC
  `, params);

  return result.rows;
};

const findById = async (id) => {
  const result = await query(`
    SELECT wo.*, a.name AS asset_name, a.asset_code, a.running_hours,
           u1.name AS assigned_to_name, u2.name AS created_by_name,
           COALESCE(
             json_agg(json_build_object('part_name', sp.name, 'sku', sp.sku, 'quantity', wop.quantity))
             FILTER (WHERE wop.id IS NOT NULL), '[]'
           ) AS parts
    FROM work_orders wo
    JOIN assets a ON a.id = wo.asset_id
    LEFT JOIN users u1 ON u1.id = wo.assigned_to
    LEFT JOIN users u2 ON u2.id = wo.created_by
    LEFT JOIN work_order_parts wop ON wop.work_order_id = wo.id
    LEFT JOIN spare_parts sp ON sp.id = wop.spare_part_id
    WHERE wo.id = $1
    GROUP BY wo.id, a.name, a.asset_code, a.running_hours, u1.name, u2.name
  `, [id]);
  return result.rows[0] || null;
};

const create = async ({ title, description, assetId, assignedTo, createdBy, priority, woType, estimatedHours, dueDate, parts = [] }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`
      INSERT INTO work_orders
        (title, description, asset_id, assigned_to, created_by, priority, status, wo_type, estimated_hours, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$8,$9)
      RETURNING *
    `, [title, description, assetId, assignedTo || null, createdBy, priority || 'normal', woType || 'corrective', estimatedHours || null, dueDate || null]);

    const wo = rows[0];

    for (const part of parts) {
      await client.query(
        `INSERT INTO work_order_parts (work_order_id, spare_part_id, quantity) VALUES ($1,$2,$3)`,
        [wo.id, part.partId, part.quantity]
      );
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, field_name, new_value)
       VALUES ($1,$2,'CREATE','work_order',$3,'status','open')`,
      [createdBy, 'Manager', wo.id]
    );

    await client.query('COMMIT');
    return findById(wo.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const update = async (id, { status, assignedTo, priority, actualHours, completionNotes, dueDate }) => {
  const fields = [];
  const params = [];

  if (status          !== undefined) { fields.push(`status = $${params.length+1}`);           params.push(status); }
  if (assignedTo      !== undefined) { fields.push(`assigned_to = $${params.length+1}`);      params.push(assignedTo); }
  if (priority        !== undefined) { fields.push(`priority = $${params.length+1}`);         params.push(priority); }
  if (actualHours     !== undefined) { fields.push(`actual_hours = $${params.length+1}`);     params.push(actualHours); }
  if (completionNotes !== undefined) { fields.push(`completion_notes = $${params.length+1}`); params.push(completionNotes); }
  if (dueDate         !== undefined) { fields.push(`due_date = $${params.length+1}`);         params.push(dueDate); }
  if (status === 'in_progress')      { fields.push(`started_at = COALESCE(started_at, NOW())`); }

  if (!fields.length) return findById(id);
  params.push(id);
  await query(`UPDATE work_orders SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
  return findById(id);
};

// ── THE BUSINESS LOGIC TRANSACTION ────────────────────────────────────────────
// When a WO is completed:
// 1. Mark WO completed
// 2. Deduct spare parts from inventory
// 3. Mark asset as active
// 4. Reset maintenance schedule
// 5. Append audit log entries
// All inside one PostgreSQL transaction — rolls back on any failure
const complete = async (id, { actualHours, completionNotes, userId, userName }) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch WO and lock row
    const { rows: woRows } = await client.query(
      `SELECT wo.*, a.id AS asset_id FROM work_orders wo
       JOIN assets a ON a.id = wo.asset_id WHERE wo.id = $1 FOR UPDATE`,
      [id]
    );
    const wo = woRows[0];
    if (!wo)                     throw Object.assign(new Error('Work order not found'), { statusCode: 404 });
    if (wo.status === 'completed') throw Object.assign(new Error('Already completed'),   { statusCode: 400 });

    // 2. Mark WO completed
    await client.query(
      `UPDATE work_orders
       SET status='completed', actual_hours=$1, completion_notes=$2, completed_at=NOW()
       WHERE id=$3`,
      [actualHours, completionNotes, id]
    );

    // 3. Deduct spare parts (check stock first)
    const { rows: parts } = await client.query(
      `SELECT wop.quantity AS needed, sp.id AS part_id, sp.name, sp.quantity AS in_stock
       FROM work_order_parts wop
       JOIN spare_parts sp ON sp.id = wop.spare_part_id
       WHERE wop.work_order_id = $1`,
      [id]
    );

    for (const p of parts) {
      if (p.in_stock < p.needed) {
        throw Object.assign(
          new Error(`Not enough stock for '${p.name}' — need ${p.needed}, have ${p.in_stock}`),
          { statusCode: 409 }
        );
      }
      await client.query(
        `UPDATE spare_parts SET quantity = quantity - $1 WHERE id = $2`,
        [p.needed, p.part_id]
      );
      // Audit: inventory deduction
      await client.query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, field_name, old_value, new_value, metadata)
         VALUES ($1,$2,'DEDUCT','spare_part',$3,'quantity',$4,$5,$6)`,
        [userId, userName, p.part_id, String(p.in_stock), String(p.in_stock - p.needed), JSON.stringify({ work_order_id: id })]
      );
    }

    // 4. Mark asset as active
    await client.query(
      `UPDATE assets SET status='active' WHERE id=$1 AND status='maintenance'`,
      [wo.asset_id]
    );

    // 5. Reset maintenance schedule
    await client.query(
      `UPDATE maintenance_schedules
       SET last_service_hours = (SELECT running_hours FROM assets WHERE id = $1),
           last_service_date  = CURRENT_DATE
       WHERE asset_id = $1 AND is_active = true`,
      [wo.asset_id]
    );

    // 6. Audit: WO completion
    await client.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, field_name, old_value, new_value)
       VALUES ($1,$2,'COMPLETE','work_order',$3,'status',$4,'completed')`,
      [userId, userName, id, wo.status]
    );

    await client.query('COMMIT');
    return findById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getStatusCounts = async () => {
  const result = await query('SELECT status, COUNT(*) AS count FROM work_orders GROUP BY status');
  return result.rows;
};

module.exports = { findAll, findById, create, update, complete, getStatusCounts };
