require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const swaggerUi  = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes     = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Docs ──────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'AssetPro API',
  swaggerOptions: { persistAuthorization: true },
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  // Handle Postgres unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AssetPro API  →  http://localhost:${PORT}`);
  console.log(`📚 Swagger Docs  →  http://localhost:${PORT}/api-docs\n`);
});

module.exports = app;
