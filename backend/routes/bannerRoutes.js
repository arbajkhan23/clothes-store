const router = require('express').Router();
const controller = require('../controllers/bannerController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', controller.publicList);
router.get('/admin', authenticate, requireAdmin, controller.list);
router.post('/', authenticate, requireAdmin, controller.create);
router.patch('/:id', authenticate, requireAdmin, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.archive);

module.exports = router;