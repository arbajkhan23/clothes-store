const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');
const { requireFields, validateObjectId, pagination } = require('../middleware/validation');
const httpError = require('../middleware/errors');

const editableFields = ['name', 'slug', 'description', 'price', 'compareAtPrice', 'category', 'images', 'sizes', 'colors', 'stock', 'isActive', 'featured'];
const sortOptions = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1, createdAt: -1 },
  'price-desc': { price: -1, createdAt: -1 },
};

function exactFilter(value) {
  return new RegExp(`^${String(value).slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function pickEditable(body) {
  return Object.fromEntries(Object.entries(body || {}).filter(([key]) => editableFields.includes(key)));
}

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.search) filter.$text = { $search: req.query.search.slice(0, 100) };
  if (req.query.size) filter.sizes = exactFilter(req.query.size);
  if (req.query.color) filter.colors = exactFilter(req.query.color);
  const sort = sortOptions[req.query.sort] || sortOptions.newest;
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.filters = asyncHandler(async (req, res) => {
  const [sizes, colors] = await Promise.all([
    Product.distinct('sizes', { isActive: true }),
    Product.distinct('colors', { isActive: true }),
  ]);
  res.json({
    sizes: sizes.filter(Boolean).sort((left, right) => left.localeCompare(right)),
    colors: colors.filter(Boolean).sort((left, right) => left.localeCompare(right)),
  });
});

exports.get = asyncHandler(async (req, res) => {
  const filter = /^[a-f\d]{24}$/i.test(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
  const product = await Product.findOne({ ...filter, isActive: true }).populate('category', 'name slug');
  if (!product) throw httpError(404, 'Product not found');
  res.json({ product });
});

exports.create = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'slug', 'price', 'category']);
  validateObjectId(req.body.category, 'category id');
  res.status(201).json({ product: await Product.create(pickEditable(req.body)) });
});

exports.update = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  const product = await Product.findByIdAndUpdate(req.params.id, pickEditable(req.body), { new: true, runValidators: true }).populate('category', 'name slug');
  if (!product) throw httpError(404, 'Product not found');
  res.json({ product });
});

exports.remove = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'product id');
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) throw httpError(404, 'Product not found');
  res.json({ message: 'Product archived', product });
});
