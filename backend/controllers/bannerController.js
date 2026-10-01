const Banner = require('../models/Banner');
const asyncHandler = require('../middleware/asyncHandler');
const httpError = require('../middleware/errors');

exports.publicList = asyncHandler(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ banners });
});

exports.list = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json({ banners });
});

exports.create = asyncHandler(async (req, res) => {
  const fields = ['title', 'subtitle', 'imageUrl', 'linkUrl', 'buttonLabel', 'sortOrder', 'isActive'];
  const payload = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => fields.includes(key)));
  res.status(201).json({ banner: await Banner.create(payload) });
});

exports.update = asyncHandler(async (req, res) => {
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ['title', 'subtitle', 'imageUrl', 'linkUrl', 'buttonLabel', 'sortOrder', 'isActive'].includes(key)));
  const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!banner) throw httpError(404, 'Banner not found');
  res.json({ banner });
});

exports.archive = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!banner) throw httpError(404, 'Banner not found');
  res.json({ banner });
});