const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAnalyticsOverview, getReportsData } = require('../controllers/analyticsController');

router.get('/overview', protect, adminOnly, getAnalyticsOverview);
router.get('/reports',  protect, adminOnly, getReportsData);

module.exports = router;
