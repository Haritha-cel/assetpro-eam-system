const { query } = require('../config/database');

// Top technicians — GROUP BY + JOIN + ORDER BY (the kind of SQL IFS loves)
const getTopTechnicians = async (limit = 5) => {
  const result = await query(`
    SELECT
      u.id,
      u.name,
      u.department,
      COUNT(wo.id)                                              AS completed_count,
      ROUND(AVG(wo.actual_hours)::numeric, 1)                  AS avg_hours,
      ROUND(AVG(
        EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 3600
      )::numeric, 1)                                           AS avg_resolution_hours
    FROM users u
    JOIN work_orders wo
      ON wo.assigned_to = u.id AND wo.status = 'completed'
    WHERE u.role = 'technician' AND u.is_active = true
    GROUP BY u.id, u.name, u.department
    ORDER BY completed_count DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
};

// Aggregated summary for dashboard KPIs
const getSummary = async () => {
  const [assetCounts, woCounts, lowStock, dueCount, topTechs, monthly] = await Promise.all([
    query(`SELECT status, COUNT(*) AS count FROM assets GROUP BY status`),
    query(`SELECT status, COUNT(*) AS count FROM work_orders GROUP BY status`),
    query(`SELECT COUNT(*) AS count FROM spare_parts WHERE quantity <= reorder_point`),
    query(`
      SELECT COUNT(*) AS count FROM assets a
      JOIN maintenance_schedules ms ON ms.asset_id = a.id AND ms.is_active = true
      WHERE a.running_hours >= (ms.last_service_hours + ms.interval_hours)
    `),
    getTopTechnicians(5),
    // Monthly completions (last 6 months)
    query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', completed_at), 'Mon YYYY') AS month,
        COUNT(*) AS completed
      FROM work_orders
      WHERE status = 'completed'
        AND completed_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', completed_at)
      ORDER BY DATE_TRUNC('month', completed_at) ASC
    `),
  ]);

  const assets = {};
  assetCounts.rows.forEach(r => { assets[r.status] = parseInt(r.count); });

  const wos = {};
  woCounts.rows.forEach(r => { wos[r.status] = parseInt(r.count); });

  return {
    assets: {
      total:       Object.values(assets).reduce((a, b) => a + b, 0),
      active:      assets.active      || 0,
      maintenance: assets.maintenance || 0,
      inactive:    assets.inactive    || 0,
    },
    workOrders: {
      open:       (wos.open || 0) + (wos.assigned || 0),
      inProgress: wos.in_progress || 0,
      completed:  wos.completed   || 0,
    },
    lowStockCount:         parseInt(lowStock.rows[0].count),
    maintenanceDueCount:   parseInt(dueCount.rows[0].count),
    topTechnicians:        topTechs,
    monthlyCompletions:    monthly.rows,
  };
};

// Recent audit events for dashboard feed
const getRecentAudit = async (limit = 10) => {
  const result = await query(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
};

module.exports = { getSummary, getTopTechnicians, getRecentAudit };
