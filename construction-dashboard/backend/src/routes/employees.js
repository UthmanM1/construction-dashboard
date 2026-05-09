const router = require('express').Router();
const c = require('../controllers/employeesController');
const { authenticate, requireRole } = require('../middleware/auth');
router.use(authenticate);
router.get('/', c.getAll);
router.post('/activity', c.logActivity);
router.get('/activity', c.getActivity);
router.put('/activity/:id/approve', requireRole('manager', 'admin'), c.approveActivity);
module.exports = router;
