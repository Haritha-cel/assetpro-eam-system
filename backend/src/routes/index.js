const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');

const authCtrl  = require('../controllers/authController');
const assetCtrl = require('../controllers/assetController');
const woCtrl    = require('../controllers/workOrderController');
const dashCtrl  = require('../controllers/dashboardController');

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts' });
const apiLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
router.use(apiLimiter);

// ── Health ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/login',    loginLimiter, authCtrl.login);
router.post('/auth/register', authenticate, authorize('admin'), authCtrl.register);
router.get('/auth/profile',   authenticate, authCtrl.profile);
router.get('/users',          authenticate, authorize('admin', 'manager'), authCtrl.listUsers);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, authorize('admin', 'manager'), dashCtrl.getDashboard);

// ── Assets ────────────────────────────────────────────────────────────────────
router.get('/assets',                  authenticate, assetCtrl.getAll);
router.get('/assets/maintenance-due',  authenticate, authorize('admin', 'manager'), assetCtrl.getDueForMaintenance);
router.get('/assets/:id',              authenticate, assetCtrl.getById);
router.post('/assets',                 authenticate, authorize('admin', 'manager'), assetCtrl.create);
router.patch('/assets/:id',            authenticate, authorize('admin', 'manager'), assetCtrl.update);

// ── Work Orders ───────────────────────────────────────────────────────────────
router.get('/work-orders',              authenticate, woCtrl.getAll);
router.get('/work-orders/counts',       authenticate, woCtrl.getStatusCounts);
router.get('/work-orders/:id',          authenticate, woCtrl.getById);
router.post('/work-orders',             authenticate, authorize('admin', 'manager'), woCtrl.create);
router.patch('/work-orders/:id',        authenticate, woCtrl.update);
router.post('/work-orders/:id/complete',authenticate, woCtrl.complete);

// ── Spare Parts ───────────────────────────────────────────────────────────────
router.get('/parts',             authenticate, dashCtrl.getParts);
router.post('/parts',            authenticate, authorize('admin', 'manager'), dashCtrl.createPart);
router.post('/parts/:id/adjust', authenticate, authorize('admin', 'manager'), dashCtrl.adjustStock);

// ── Audit Log ─────────────────────────────────────────────────────────────────
router.get('/audit', authenticate, authorize('admin', 'manager'), dashCtrl.getAuditLogs);

module.exports = router;
