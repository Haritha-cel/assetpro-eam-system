const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');

const login = async (email, password) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });

  await userRepo.updateLastLogin(user.id);

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
  };
};

const register = async ({ name, email, password, role, department }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  return userRepo.create({ name, email, passwordHash, role, department });
};

module.exports = { login, register };
