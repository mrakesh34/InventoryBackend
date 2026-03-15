const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAllActivity } = require('../controllers/stockActivityController');

router.get('/', protect, adminOnly, getAllActivity);

module.exports = router;
