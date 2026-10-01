const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0, default: null },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: { type: [{ type: String, trim: true }], default: [] },
  sizes: { type: [{ type: String, trim: true, uppercase: true }], default: [] },
  colors: { type: [{ type: String, trim: true }], default: [] },
  stock: { type: Number, min: 0, default: 0, validate: Number.isInteger },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
