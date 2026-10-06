const woService = require('../services/workOrderService');

/**
 * @swagger
 * /work-orders:
 *   get:
 *     summary: List work orders (Technicians see own only)
 *     tags: [Work Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open,assigned,in_progress,completed,cancelled] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [critical,high,normal,low] }
 *     responses:
 *       200: { description: List of work orders }
 */
const getAll = async (req, res) => {
  try {
    const wos = await woService.getAll(req.query, req.user);
    return res.status(200).json({ success: true, data: wos });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /work-orders/{id}:
 *   get:
 *     summary: Get work order by ID
 *     tags: [Work Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Work order detail with parts }
 *       403: { description: Not your work order (technician) }
 *       404: { description: Not found }
 */
const getById = async (req, res) => {
  try {
    const wo = await woService.getById(req.params.id, req.user);
    return res.status(200).json({ success: true, data: wo });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /work-orders:
 *   post:
 *     summary: Create work order (Admin + Manager only)
 *     tags: [Work Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, assetId]
 *             properties:
 *               title:          { type: string }
 *               description:    { type: string }
 *               assetId:        { type: string, format: uuid }
 *               assignedTo:     { type: string, format: uuid }
 *               priority:       { type: string, enum: [critical,high,normal,low] }
 *               woType:         { type: string, enum: [preventive,corrective,inspection,emergency] }
 *               estimatedHours: { type: number }
 *               dueDate:        { type: string, format: date }
 *               parts:          { type: array, items: { type: object, properties: { partId: {type:string}, quantity: {type:integer} } } }
 *     responses:
 *       201: { description: Work order created }
 *       403: { description: Technicians cannot create WOs }
 */
const create = async (req, res) => {
  try {
    if (!req.body.title || !req.body.assetId) {
      return res.status(400).json({ success: false, message: 'title and assetId are required' });
    }
    const wo = await woService.create(req.body, req.user);
    return res.status(201).json({ success: true, message: 'Work order created', data: wo });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /work-orders/{id}:
 *   patch:
 *     summary: Update work order status / assignment
 *     tags: [Work Orders]
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
 *               status:     { type: string }
 *               assignedTo: { type: string }
 *               priority:   { type: string }
 *     responses:
 *       200: { description: Updated }
 */
const update = async (req, res) => {
  try {
    const wo = await woService.update(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, message: 'Work order updated', data: wo });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /work-orders/{id}/complete:
 *   post:
 *     summary: Complete WO — deducts parts, updates asset, resets maintenance, logs audit
 *     tags: [Work Orders]
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
 *             required: [actualHours]
 *             properties:
 *               actualHours:     { type: number }
 *               completionNotes: { type: string }
 *     responses:
 *       200: { description: WO completed — transaction committed }
 *       409: { description: Insufficient spare parts stock }
 */
const complete = async (req, res) => {
  try {
    if (!req.body.actualHours) {
      return res.status(400).json({ success: false, message: 'actualHours is required' });
    }
    const wo = await woService.complete(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      message: 'Work order completed — parts deducted, asset updated, maintenance reset, audit logged',
      data: wo,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

const getStatusCounts = async (req, res) => {
  try {
    const counts = await woService.getStatusCounts();
    return res.status(200).json({ success: true, data: counts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getById, create, update, complete, getStatusCounts };
