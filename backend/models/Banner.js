const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  subtitle: { type: String, trim: true, maxlength: 240, default: '' },
  imageUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  linkUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  buttonLabel: { type: String, trim: true, maxlength: 40, default: 'Shop now' },
  sortOrder: { type: Number, min: 0, validate: Number.isInteger, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

bannerSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);