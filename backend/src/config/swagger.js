const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AssetPro EAM API',
      version: '1.0.0',
      description: `Enterprise Asset Management REST API.
      
**Test Credentials (password: Password123!)**
- admin@assetpro.com → Admin (full access)
- manager@assetpro.com → Manager (create WOs, manage assets)
- priya@assetpro.com → Technician (own WOs only)`,
    },
    servers: [{ url: 'http://localhost:5000/api', description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
