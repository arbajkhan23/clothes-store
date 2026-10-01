const crypto = require('node:crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { applyCoupon } = require('../couponService');
const asyncHandler = require('../middleware/asyncHandler');
const { requireFields, validateObjectId, validateEmail, pagination } = require('../middleware/validation');
const httpError = require('../middleware/errors');

exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['customer', 'shippingAddress', 'items']);
  requireFields(req.body.customer, ['name', 'email', 'phone']);
  requireFields(req.body.shippingAddress, ['line1', 'city', 'region', 'postalCode', 'country']);
  validateEmail(req.body.customer.email);
  if (!Array.isArray(req.body.items) || req.body.items.length === 0 || req.body.items.length > 50) {
    throw httpError(400, 'Order must contain between 1 and 50 items');
  }

  const quantities = new Map();
  for (const item of req.body.items) {
    requireFields(item, ['product', 'quantity']);
    validateObjectId(item.product, 'product id');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw httpError(400, 'Item quantity must be an integer from 1 to 99');
    quantities.set(item.product, (quantities.get(item.product) || 0) + item.quantity);
  }

  const changedStock = [];
  let reservedCoupon = null;
  try {
    const orderItems = [];
    let subtotal = 0;
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!product) throw httpError(409, 'A product is unavailable or has insufficient stock');
      changedStock.push({ productId, quantity });
      const unitPrice = product.price;
      subtotal += unitPrice * quantity;
      orderItems.push({ product: product._id, name: product.name, quantity, unitPrice });
    }

    const applied = await applyCoupon(req.body.couponCode, subtotal, Boolean(req.body.couponCode));
    reservedCoupon = applied.coupon;
    const order = await Order.create({
      orderNumber: `CS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      user: req.user?._id || null,
      customer: req.body.customer,
      shippingAddress: req.body.shippingAddress,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      couponCode: applied.coupon?.code || '',
      discountAmount: applied.discountAmount,
      total: Math.round((subtotal - applied.discountAmount) * 100) / 100,
      notes: req.body.notes || '',
    });
    res.status(201).json({ order });
  } catch (error) {
    await Promise.all(changedStock.map(({ productId, quantity }) => Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })));
    if (reservedCoupon) await Coupon.updateOne({ _id: reservedCoupon._id, redemptions: { $gt: 0 } }, { $inc: { redemptions: -1 } });
    throw error;
  }
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('items.product', 'name slug'),
    Order.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.get = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id).populate('items.product', 'name slug');
  if (!order) throw httpError(404, 'Order not found');
  res.json({ order });
});

exports.update = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');
  const allowed = ['status', 'paymentStatus', 'notes'];
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(update).length) throw httpError(400, 'Provide status, paymentStatus, or notes to update');

  const shouldRestock = update.status === 'cancelled';
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, ...(shouldRestock ? { status: { $ne: 'cancelled' } } : {}) },
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!order) {
    const exists = await Order.exists({ _id: req.params.id });
    if (!exists) throw httpError(404, 'Order not found');
    throw httpError(409, 'Cancelled orders cannot be updated again');
  }
  if (shouldRestock) {
    await Promise.all(order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })));
    if (order.couponCode) await Coupon.updateOne({ code: order.couponCode, redemptions: { $gt: 0 } }, { $inc: { redemptions: -1 } });
  }
  res.json({ order });
});
