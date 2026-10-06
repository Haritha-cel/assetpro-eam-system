const assetService = require('../services/assetService');

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets with maintenance schedule
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, maintenance, inactive, retired] }
 *       - in: query
 *         name: assetType
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of assets with maintenance progress }
 */
const getAll = async (req, res) => {
  try {
    const assets = await assetService.getAll(req.query);
    return res.status(200).json({ success: true, data: assets });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     summary: Get single asset by ID
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Asset detail }
 *       404: { description: Asset not found }
 */
const getById = async (req, res) => {
  try {
    const asset = await assetService.getById(req.params.id);
    return res.status(200).json({ success: true, data: asset });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /assets:
 *   post:
 *     summary: Create new asset (Admin + Manager)
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, assetCode, assetType]
 *             properties:
 *               name:         { type: string }
 *               assetCode:    { type: string }
 *               serialNumber: { type: string }
 *               assetType:    { type: string }
 *               location:     { type: string }
 *               runningHours: { type: number }
 *               manufacturer: { type: string }
 *               model:        { type: string }
 *               year:         { type: integer }
 *               purchaseCost: { type: number }
 *     responses:
 *       201: { description: Asset created }
 */
const create = async (req, res) => {
  try {
    if (!req.body.name || !req.body.assetCode || !req.body.assetType) {
      return res.status(400).json({ success: false, message: 'name, assetCode, and assetType are required' });
    }
    const asset = await assetService.create(
      { ...req.body, createdByName: req.user.name },
      req.user.id
    );
    return res.status(201).json({ success: true, message: 'Asset created', data: asset });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /assets/{id}:
 *   patch:
 *     summary: Update asset (Admin + Manager)
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:       { type: string }
 *               location:     { type: string }
 *               runningHours: { type: number }
 *               notes:        { type: string }
 *     responses:
 *       200: { description: Asset updated }
 */
const update = async (req, res) => {
  try {
    const asset = await assetService.update(req.params.id, req.body, req.user.id, req.user.name);
    return res.status(200).json({ success: true, message: 'Asset updated', data: asset });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const getDueForMaintenance = async (req, res) => {
  try {
    const assets = await assetService.getDueForMaintenance();
    return res.status(200).json({ success: true, data: assets });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getById, create, update, getDueForMaintenance };
