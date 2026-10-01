const Coupon = require('./models/Coupon');
const httpError = require('./middleware/errors');

async function applyCoupon(code, subtotal, reserve = false) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return { coupon: null, discountAmount: 0 };
  if (normalizedCode.length > 40 || !/^[A-Z0-9_-]+$/.test(normalizedCode)) throw httpError(400, 'This discount code is invalid or expired');

  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
  const now = new Date();
  if (!coupon || coupon.startsAt > now || (coupon.expiresAt && coupon.expiresAt < now)) {
    throw httpError(400, 'This discount code is invalid or expired');
  }
  if (subtotal < coupon.minimumSubtotal) throw httpError(400, `This code requires a minimum order of $${coupon.minimumSubtotal.toFixed(2)}`);
  if (coupon.maxRedemptions !== null && coupon.redemptions >= coupon.maxRedemptions) throw httpError(409, 'This discount code has reached its redemption limit');

  let reservedCoupon = coupon;
  if (reserve) {
    const filter = { _id: coupon._id, isActive: true };
    if (coupon.maxRedemptions !== null) filter.redemptions = { $lt: coupon.maxRedemptions };
    reservedCoupon = await Coupon.findOneAndUpdate(filter, { $inc: { redemptions: 1 } }, { new: true });
    if (!reservedCoupon) throw httpError(409, 'This discount code has reached its redemption limit');
  }

  const rawDiscount = coupon.discountType === 'percent'
    ? subtotal * coupon.discountValue / 100
    : coupon.discountValue;
  const discountAmount = Math.round(Math.min(subtotal, rawDiscount) * 100) / 100;
  return { coupon: reservedCoupon, discountAmount };
}

module.exports = { applyCoupon };