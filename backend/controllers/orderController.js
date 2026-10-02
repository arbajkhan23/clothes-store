
const crypto = require('node:crypto');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { applyCoupon } = require('../couponService');
const asyncHandler = require('../middleware/asyncHandler');
const {
  requireFields,
  validateObjectId,
  validateEmail,
  pagination,
} = require('../middleware/validation');
const httpError = require('../middleware/errors');

// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Validate required top-level fields
  requireFields(body, ['customer', 'shippingAddress', 'items']);

  // Validate customer details
  requireFields(body.customer, ['name', 'email', 'phone']);
  validateEmail(body.customer.email);

  // Validate shipping address
  requireFields(body.shippingAddress, [
    'line1',
    'city',
    'region',
    'postalCode',
    'country',
  ]);

  // Validate items array
  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 50
  ) {
    throw httpError(
      400,
      'Order must contain between 1 and 50 items'
    );
  }

  // Combine duplicate product IDs and validate quantities
  const quantities = new Map();

  for (const item of body.items) {
    requireFields(item, ['product', 'quantity']);

    validateObjectId(item.product, 'product id');

    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      throw httpError(
        400,
        'Item quantity must be an integer from 1 to 99'
      );
    }

    const productId = String(item.product);
    const newQuantity =
      (quantities.get(productId) || 0) + item.quantity;

    if (newQuantity > 99) {
      throw httpError(
        400,
        'Total quantity for a product cannot exceed 99'
      );
    }

    quantities.set(productId, newQuantity);
  }

  // Track stock changes so they can be rolled back on failure
  const changedStock = [];
  let reservedCoupon = null;

  try {
    const orderItems = [];
    let subtotal = 0;

    // Reserve stock atomically and calculate prices from the database
    for (const [productId, quantity] of quantities.entries()) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          isActive: true,
          stock: { $gte: quantity },
        },
        {
          $inc: { stock: -quantity },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!product) {
        throw httpError(
          409,
          'A product is unavailable or has insufficient stock'
        );
      }

      changedStock.push({ productId, quantity });

      const unitPrice = Number(product.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw httpError(
          400,
          'A product has an invalid price'
        );
      }

      subtotal += unitPrice * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity,
        unitPrice,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Apply coupon using the server-side coupon service
    const couponCode =
      typeof body.couponCode === 'string'
        ? body.couponCode.trim()
        : '';

    const applied = await applyCoupon(
      couponCode,
      subtotal,
      Boolean(couponCode)
    );

    reservedCoupon = applied.coupon || null;

    const discountAmount = Number(applied.discountAmount || 0);

    if (
      !Number.isFinite(discountAmount) ||
      discountAmount < 0 ||
      discountAmount > subtotal
    ) {
      throw httpError(400, 'Invalid coupon discount amount');
    }

    const total =
      Math.round((subtotal - discountAmount) * 100) / 100;

    // Create the order
    const order = await Order.create({
      orderNumber: `CS-${Date.now()}-${crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase()}`,

      user: req.user?._id || null,

      customer: {
        name: String(body.customer.name).trim(),
        email: String(body.customer.email).trim().toLowerCase(),
        phone: String(body.customer.phone).trim(),
      },

      shippingAddress: {
        line1: String(body.shippingAddress.line1).trim(),
        line2: String(body.shippingAddress.line2 || '').trim(),
        city: String(body.shippingAddress.city).trim(),
        region: String(body.shippingAddress.region).trim(),
        postalCode: String(body.shippingAddress.postalCode).trim(),
        country: String(body.shippingAddress.country).trim(),
      },

      items: orderItems,
      subtotal,
      couponCode: reservedCoupon?.code || '',
      discountAmount,
      total,
      notes: String(body.notes || '').trim(),
    });

    // Successful order response
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    // Restore reserved stock if order creation failed
    const rollbackTasks = changedStock.map(
      ({ productId, quantity }) =>
        Product.updateOne(
          { _id: productId },
          { $inc: { stock: quantity } }
        )
    );

    // Release coupon redemption if it was reserved
    if (reservedCoupon) {
      rollbackTasks.push(
        Coupon.updateOne(
          {
            _id: reservedCoupon._id,
            redemptions: { $gt: 0 },
          },
          {
            $inc: { redemptions: -1 },
          }
        )
      );
    }

    // Do not hide the original error if rollback also fails
    const rollbackResults = await Promise.allSettled(rollbackTasks);

    const rollbackFailed = rollbackResults.some(
      (result) => result.status === 'rejected'
    );

    if (rollbackFailed) {
      console.error(
        'Order rollback failed. Manual stock/coupon review may be required.',
        rollbackResults
      );
    }

    throw error;
  }
});

// ==========================================
// LIST ORDERS (ADMIN)
// GET /api/orders
// ==========================================
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);

  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name slug'),

    Order.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ==========================================
// GET SINGLE ORDER (ADMIN)
// GET /api/orders/:id
// ==========================================
exports.get = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');

  const order = await Order.findById(req.params.id)
    .populate('items.product', 'name slug');

  if (!order) {
    throw httpError(404, 'Order not found');
  }

  return res.json({
    success: true,
    order,
  });
});

// ==========================================
// UPDATE ORDER (ADMIN)
// PATCH /api/orders/:id
// ==========================================
exports.update = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'order id');

  const allowed = ['status', 'paymentStatus', 'notes'];

  const update = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key]) =>
      allowed.includes(key)
    )
  );

  if (!Object.keys(update).length) {
    throw httpError(
      400,
      'Provide status, paymentStatus, or notes to update'
    );
  }

  // Only allow a valid notes string
  if (
    Object.prototype.hasOwnProperty.call(update, 'notes') &&
    typeof update.notes !== 'string'
  ) {
    throw httpError(400, 'Notes must be a string');
  }

  const shouldRestock = update.status === 'cancelled';

  // Prevent an already-cancelled order from being cancelled again
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      ...(shouldRestock
        ? { status: { $ne: 'cancelled' } }
        : {}),
    },
    {
      $set: update,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    const exists = await Order.exists({
      _id: req.params.id,
    });

    if (!exists) {
      throw httpError(404, 'Order not found');
    }

    throw httpError(
      409,
      'Cancelled orders cannot be updated again'
    );
  }

  // Restore stock and coupon redemption when order is cancelled
  if (shouldRestock) {
    const restockTasks = order.items.map((item) =>
      Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      )
    );

    if (order.couponCode) {
      restockTasks.push(
        Coupon.updateOne(
          {
            code: order.couponCode,
            redemptions: { $gt: 0 },
          },
          {
            $inc: { redemptions: -1 },
          }
        )
      );
    }

    await Promise.all(restockTasks);
  }

  return res.json({
    success: true,
    message: 'Order updated successfully',
    order,
  });
});