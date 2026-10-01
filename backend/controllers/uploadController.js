const crypto = require('node:crypto');
const asyncHandler = require('../middleware/asyncHandler');
const httpError = require('../middleware/errors');

exports.signature = asyncHandler(async (req, res) => {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = process.env;
  if (!cloudName || !apiKey || !apiSecret) throw httpError(503, 'Image uploads are not configured');

  const params = { folder: 'clothes-store', timestamp: Math.floor(Date.now() / 1000) };
  const canonical = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  const signature = crypto.createHash('sha1').update(`${canonical}${apiSecret}`).digest('hex');
  res.json({ cloudName, apiKey, signature, ...params });
});