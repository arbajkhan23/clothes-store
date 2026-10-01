const router = require('express').Router();
const controller = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/me/orders', authenticate, controller.myOrders);
router.use(authenticate, requireAdmin);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id/orders', controller.orders);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
