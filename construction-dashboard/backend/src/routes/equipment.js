const router = require('express').Router();
const c = require('../controllers/equipmentController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', c.getAll);
router.post('/usage', c.logUsage);
router.get('/usage', c.getUsage);
module.exports = router;
