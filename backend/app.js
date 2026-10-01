
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Allowed frontend origins
const defaultOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://lume-fullstack.web.app',
  'https://lume-fullstack-ecommerce-h2kk.vercel.app'
];

// Additional origins from .env
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([...defaultOrigins, ...envOrigins])
];

// CORS configuration
app.use(cors({
  origin(origin, callback) {
    // Allow requests without Origin, such as health checks
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error('CORS blocked origin:', origin);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

// Request body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '1mb'
}));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;