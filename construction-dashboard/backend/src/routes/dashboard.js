const router = require('express').Router();
const { getSummary, getAlerts, resolveAlert } = require('../controllers/dashboardController');
const { authenticate, requireRole } = require('../middleware/auth');
router.use(authenticate);
router.get('/summary', getSummary);
router.get('/alerts', getAlerts);
router.put('/alerts/:id/resolve', requireRole('manager', 'admin'), resolveAlert);
module.exports = router;
