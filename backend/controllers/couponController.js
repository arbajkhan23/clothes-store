const Coupon = require('../models/Coupon');
const asyncHandler = require('../middleware/asyncHandler');
const httpError = require('../middleware/errors');
const { applyCoupon } = require('../couponService');

exports.validate = asyncHandler(async (req, res) => {
  const subtotal = Number(req.body?.subtotal);
  if (!req.body?.code || !Number.isFinite(subtotal) || subtotal < 0) throw httpError(400, 'A discount code and valid subtotal are required');
  const result = await applyCoupon(req.body.code, subtotal);
  res.json({ code: result.coupon.code, discountAmount: result.discountAmount, total: Math.max(0, subtotal - result.discountAmount) });
});

exports.list = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
});

exports.create = asyncHandler(async (req, res) => {
  const fields = ['code', 'discountType', 'discountValue', 'minimumSubtotal', 'maxRedemptions', 'startsAt', 'expiresAt', 'isActive'];
  const payload = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => fields.includes(key)));
  if (payload.code) payload.code = payload.code.trim().toUpperCase();
  res.status(201).json({ coupon: await Coupon.create(payload) });
});

exports.update = asyncHandler(async (req, res) => {
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ['code', 'discountType', 'discountValue', 'minimumSubtotal', 'maxRedemptions', 'startsAt', 'expiresAt', 'isActive'].includes(key)));
  if (update.code) update.code = update.code.trim().toUpperCase();
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!coupon) throw httpError(404, 'Coupon not found');
  res.json({ coupon });
});

exports.archive = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) throw httpError(404, 'Coupon not found');
  res.json({ coupon });
});