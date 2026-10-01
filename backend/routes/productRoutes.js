const router = require('express').Router();
const controller = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', controller.list);
router.get('/filters', controller.filters);
router.get('/:id', controller.get);
router.post('/', authenticate, requireAdmin, controller.create);
router.patch('/:id', authenticate, requireAdmin, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.remove);

module.exports = router;
