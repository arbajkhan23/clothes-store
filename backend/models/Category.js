const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  image: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
