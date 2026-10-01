const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/adminController');
const uploadController = require('../controllers/uploadController');

router.use(authenticate, requireAdmin);
router.get('/dashboard', controller.dashboard);
router.post('/uploads/signature', uploadController.signature);
router.get('/customers', controller.customers);
router.get('/customers/:email/orders', controller.customerOrders);
router.get('/products', controller.products);
router.get('/categories', controller.categories);

module.exports = router;
