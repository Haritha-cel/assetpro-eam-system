const dashService = require('../services/dashboardService');
const { query }   = require('../config/database');

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Dashboard KPIs, top technicians, monthly completions (Admin + Manager)
 *     tags: [Dashboard]
 *     responses:
 *       200: { description: Aggregated dashboard data }
 */
const getDashboard = async (req, res) => {
  try {
    const data = await dashService.getSummary();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Immutable audit log (Admin + Manager)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *     responses:
 *       200: { description: Audit log entries }
 */
const getAuditLogs = async (req, res) => {
  try {
    const { entityType, action, limit = 100 } = req.query;
    const conditions = [];
    const params = [];
    if (entityType) { conditions.push(`entity_type = $${params.length+1}`); params.push(entityType); }
    if (action)     { conditions.push(`action = $${params.length+1}`);      params.push(action.toUpperCase()); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit));
    const result = await query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /parts:
 *   get:
 *     summary: List spare parts inventory
 *     tags: [Parts]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Parts list }
 */
const getParts = async (req, res) => {
  try {
    const { findAll } = require('../repositories/sparePartRepository');
    const parts = await findAll({ search: req.query.search, lowStock: req.query.lowStock === 'true' });
    return res.status(200).json({ success: true, data: parts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /parts:
 *   post:
 *     summary: Add spare part (Admin + Manager)
 *     tags: [Parts]
 *     responses:
 *       201: { description: Part created }
 */
const createPart = async (req, res) => {
  try {
    const { create } = require('../repositories/sparePartRepository');
    if (!req.body.name || !req.body.sku) {
      return res.status(400).json({ success: false, message: 'name and sku required' });
    }
    const part = await create(req.body);
    return res.status(201).json({ success: true, data: part });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /parts/{id}/adjust:
 *   post:
 *     summary: Adjust stock quantity (Admin + Manager)
 *     tags: [Parts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adjustment]
 *             properties:
 *               adjustment: { type: integer, description: "Positive to add, negative to deduct" }
 *               reason:     { type: string }
 *     responses:
 *       200: { description: Stock adjusted }
 */
const adjustStock = async (req, res) => {
  try {
    const { adjustStock: adjust, findById } = require('../repositories/sparePartRepository');
    const existing = await findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Part not found' });

    const part = await adjust(req.params.id, req.body.adjustment);
    await query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, field_name, old_value, new_value)
       VALUES ($1,$2,'ADJUST','spare_part',$3,'quantity',$4,$5)`,
      [req.user.id, req.user.name, req.params.id, String(existing.quantity), String(part.quantity)]
    );
    return res.status(200).json({ success: true, message: 'Stock adjusted', data: part });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard, getAuditLogs, getParts, createPart, adjustStock };
