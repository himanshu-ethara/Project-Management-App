const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');

router.use(authenticate);
router.get('/', getDashboard);

module.exports = router;
