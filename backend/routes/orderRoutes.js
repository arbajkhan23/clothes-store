const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

const {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
} = require('../middleware/auth');

// Create a new order (guest or logged-in customer)
router.post(
  '/',
  optionalAuthenticate,
  orderController.create
);

// Get all orders (admin only)
router.get(
  '/',
  authenticate,
  requireAdmin,
  orderController.list
);

// Get a single order by ID (admin only)
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  orderController.get
);

// Update order status, payment status, or notes (admin only)
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  orderController.update
);

module.exports = router;