const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/asyncHandler');
const { requireFields, validateObjectId, validateEmail, validatePassword, pagination } = require('../middleware/validation');
const httpError = require('../middleware/errors');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = {};
  if (['customer', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  if (req.query.search) {
    const search = req.query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.orders = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user id');
  const user = await User.findById(req.params.id).select('email role');
  if (!user || user.role !== 'customer') throw httpError(404, 'Customer not found');
  const { page, limit, skip } = pagination(req.query);
  const filter = { 'customer.email': user.email };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items.product', 'name slug'),
    Order.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.myOrders = asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') throw httpError(403, 'Customer access required');
  const { page, limit, skip } = pagination(req.query);
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items.product', 'name slug'),
    Order.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.get = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user id');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw httpError(404, 'User not found');
  res.json({ user });
});

exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  validateEmail(req.body.email);
  validatePassword(req.body.password);
  const user = await User.create({ name: req.body.name, email: req.body.email, password: req.body.password, role: req.body.role === 'admin' ? 'admin' : 'customer' });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

exports.update = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user id');
  const update = {};
  for (const field of ['name', 'role']) if (req.body?.[field] !== undefined) update[field] = req.body[field];
  if (req.body?.email !== undefined) {
    validateEmail(req.body.email);
    update.email = req.body.email;
  }
  if (req.body?.password !== undefined) {
    validatePassword(req.body.password);
    update.password = req.body.password;
  }
  if (update.role && !['admin', 'customer'].includes(update.role)) throw httpError(400, 'Role must be admin or customer');
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw httpError(404, 'User not found');
  Object.assign(user, update);
  await user.save();
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

exports.remove = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'user id');
  if (req.params.id === req.user.id) throw httpError(400, 'You cannot delete your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) === 1) throw httpError(409, 'Cannot delete the last administrator');
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});
