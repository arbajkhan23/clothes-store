const router = require('express').Router();
const controller = require('../controllers/couponController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/validate', controller.validate);
router.get('/', authenticate, requireAdmin, controller.list);
router.post('/', authenticate, requireAdmin, controller.create);
router.patch('/:id', authenticate, requireAdmin, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.archive);

module.exports = router;