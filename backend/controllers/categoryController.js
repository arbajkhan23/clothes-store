const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const { requireFields, validateObjectId } = require('../middleware/validation');
const httpError = require('../middleware/errors');

const editableFields = ['name', 'slug', 'description', 'image', 'isActive'];
function pickEditable(body) {
  return Object.fromEntries(Object.entries(body || {}).filter(([key]) => editableFields.includes(key)));
}

exports.list = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ categories });
});

exports.get = asyncHandler(async (req, res) => {
  const filter = /^[a-f\d]{24}$/i.test(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
  const category = await Category.findOne({ ...filter, isActive: true });
  if (!category) throw httpError(404, 'Category not found');
  res.json({ category });
});

exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'slug']);
  res.status(201).json({ category: await Category.create(pickEditable(req.body)) });
});

exports.update = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'category id');
  const category = await Category.findByIdAndUpdate(req.params.id, pickEditable(req.body), { new: true, runValidators: true });
  if (!category) throw httpError(404, 'Category not found');
  res.json({ category });
});

exports.remove = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'category id');
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!category) throw httpError(404, 'Category not found');
  res.json({ message: 'Category archived', category });
});
