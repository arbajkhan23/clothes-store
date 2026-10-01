const router = require('express').Router();
const controller = require('../controllers/orderController');
const { authenticate, optionalAuthenticate, requireAdmin } = require('../middleware/auth');

router.post('/', optionalAuthenticate, controller.create);
router.get('/', authenticate, requireAdmin, controller.list);
router.get('/:id', authenticate, requireAdmin, controller.get);
router.patch('/:id', authenticate, requireAdmin, controller.update);

module.exports = router;
