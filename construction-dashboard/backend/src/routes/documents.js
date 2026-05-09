const router = require('express').Router();
const c = require('../controllers/documentsController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.post('/upload', c.uploadDocument);
router.get('/', c.search);
router.get('/:id/download', c.download);
module.exports = router;
