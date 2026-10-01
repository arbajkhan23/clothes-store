const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { pagination } = require('../middleware/validation');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.dashboard = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 6);
  const [products, categories, orderEmails, orders, pendingOrders, revenue, daily, recentOrders] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    Order.distinct('customer.email'),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $match: { paymentStatus: 'paid', status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$paymentStatus', 'paid'] }, { $ne: ['$status', 'cancelled'] }] }, '$total', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(6).select('orderNumber customer total status paymentStatus createdAt'),
  ]);
  const customersWithoutOrders = await User.countDocuments({ role: 'customer', email: { $nin: orderEmails } });
  const dailyByDate = new Map(daily.map((item) => [item._id, item]));
  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const item = dailyByDate.get(key);
    return { date: key, orders: item?.orders || 0, revenue: item?.revenue || 0 };
  });
  res.json({
    stats: { products, categories, customers: orderEmails.length + customersWithoutOrders, orders, pendingOrders, paidRevenue: revenue[0]?.total || 0 },
    activity,
    recentOrders,
  });
});

exports.products = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = {};
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'archived') filter.isActive = false;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search.slice(0, 100)), 'i');
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.categories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'archived') filter.isActive = false;
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search.slice(0, 100)), 'i');
  const categories = await Category.find(filter).sort({ name: 1 });
  res.json({ categories });
});

exports.customers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const search = req.query.search ? escapeRegex(req.query.search.slice(0, 100)) : '';
  const orderFilter = search ? { $or: [{ 'customer.name': new RegExp(search, 'i') }, { 'customer.email': new RegExp(search, 'i') }] } : {};
  const accountFilter = { role: 'customer' };
  if (search) accountFilter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  const [orderCustomers, accounts] = await Promise.all([
    Order.aggregate([
      { $match: orderFilter },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customer.email',
          name: { $first: '$customer.name' },
          phone: { $first: '$customer.phone' },
          orderCount: { $sum: 1 },
          lastOrderAt: { $max: '$createdAt' },
          paidTotal: { $sum: { $cond: [{ $and: [{ $eq: ['$paymentStatus', 'paid'] }, { $ne: ['$status', 'cancelled'] }] }, '$total', 0] } },
        },
      },
    ]),
    User.find(accountFilter).select('name email createdAt').lean(),
  ]);
  const byEmail = new Map();
  for (const customer of orderCustomers) {
    byEmail.set(customer._id, { ...customer, email: customer._id, createdAt: customer.lastOrderAt, customerId: null });
  }
  for (const account of accounts) {
    const existing = byEmail.get(account.email);
    byEmail.set(account.email, {
      ...existing,
      _id: account._id,
      customerId: account._id,
      email: account.email,
      name: account.name,
      phone: existing?.phone || '',
      orderCount: existing?.orderCount || 0,
      paidTotal: existing?.paidTotal || 0,
      createdAt: account.createdAt,
      lastOrderAt: existing?.lastOrderAt || null,
    });
  }
  const customers = [...byEmail.values()].sort((left, right) => new Date(right.lastOrderAt || right.createdAt) - new Date(left.lastOrderAt || left.createdAt));
  const total = customers.length;
  const items = customers.slice(skip, skip + limit);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.customerOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const email = req.params.email.toLowerCase();
  const filter = { 'customer.email': email };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items.product', 'name slug'),
    Order.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
