const authService = require('../services/authService');
const userRepo    = require('../repositories/userRepository');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: admin@assetpro.com }
 *               password: { type: string, example: Password123! }
 *     responses:
 *       200: { description: Login successful — returns JWT token and user }
 *       401: { description: Invalid credentials }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const result = await authService.login(email, password);
    return res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user (Admin only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:       { type: string }
 *               email:      { type: string }
 *               password:   { type: string }
 *               role:       { type: string, enum: [admin, manager, technician] }
 *               department: { type: string }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already in use }
 */
const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({ success: true, message: 'User created', data: user });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200: { description: User profile }
 */
const profile = async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (Admin + Manager)
 *     tags: [Auth]
 *     responses:
 *       200: { description: List of users }
 */
const listUsers = async (req, res) => {
  try {
    const users = await userRepo.findAll();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, register, profile, listUsers };
