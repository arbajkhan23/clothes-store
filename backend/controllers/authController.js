const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { requireFields, validateEmail, validatePassword } = require('../middleware/validation');
const httpError = require('../middleware/errors');

function createToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length > 0 && leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

exports.setupAdmin = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password', 'setupKey']);
  if (!process.env.ADMIN_SETUP_KEY || !safeEqual(req.body.setupKey, process.env.ADMIN_SETUP_KEY)) {
    throw httpError(403, 'Invalid admin setup key');
  }
  if (await User.exists({ role: 'admin' })) throw httpError(409, 'An administrator is already configured');

  validateEmail(req.body.email);
  validatePassword(req.body.password);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const user = await User.create({ name: req.body.name, email: req.body.email, password: req.body.password, role: 'admin' });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: createToken(user) });
});

exports.register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  validateEmail(req.body.email);
  validatePassword(req.body.password);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  if (typeof req.body.name !== 'string' || req.body.name.trim().length < 2 || req.body.name.trim().length > 80) {
    throw httpError(400, 'Name must be between 2 and 80 characters');
  }
  const user = await User.create({
    name: req.body.name.trim(),
    email: req.body.email.trim().toLowerCase(),
    password: req.body.password,
    role: 'customer',
  });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: createToken(user) });
});

exports.login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  validateEmail(req.body.email);
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw httpError(401, 'Invalid email or password');
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: createToken(user) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
});
