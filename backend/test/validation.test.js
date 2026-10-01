const test = require('node:test');
const assert = require('node:assert/strict');
const { pagination, validateEmail, validatePassword, validateObjectId } = require('../middleware/validation');

test('pagination clamps invalid and oversized values', () => {
  assert.deepEqual(pagination({ page: '-2', limit: '1000' }), { page: 1, limit: 100, skip: 0 });
});

test('email, password, and identifier validators reject invalid input', () => {
  assert.throws(() => validateEmail('not-an-email'), { statusCode: 400 });
  assert.throws(() => validatePassword('short'), { statusCode: 400 });
  assert.throws(() => validateObjectId('bad-id'), { statusCode: 400 });
});
