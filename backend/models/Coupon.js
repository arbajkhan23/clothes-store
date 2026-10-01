const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, minlength: 3, maxlength: 40, match: /^[A-Z0-9_-]+$/ },
  discountType: { type: String, enum: ['percent', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0.01 },
  minimumSubtotal: { type: Number, min: 0, default: 0 },
  maxRedemptions: { type: Number, min: 1, validate: Number.isInteger, default: null },
  redemptions: { type: Number, min: 0, validate: Number.isInteger, default: 0 },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);