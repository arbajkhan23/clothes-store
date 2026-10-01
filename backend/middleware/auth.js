const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.sub).select('-password');
  if (!user) {
    const error = new Error('Authentication account no longer exists');
    error.statusCode = 401;
    throw error;
  }
  req.user = user;
  next();
});

const optionalAuthenticate = (req, res, next) => {
  if (!req.get('authorization')) return next();
  return authenticate(req, res, next);
};

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate, requireAdmin };
