const mongoose = require('mongoose');

function requireFields(value, fields) {
  const missing = fields.filter((field) => value?.[field] === undefined || value[field] === null || value[field] === '');
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
}

function validateObjectId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
}

function validateEmail(email) {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('A valid email address is required');
    error.statusCode = 400;
    throw error;
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
    const error = new Error('Password must be between 10 and 128 characters');
    error.statusCode = 400;
    throw error;
  }
}

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { requireFields, validateObjectId, validateEmail, validatePassword, pagination };
