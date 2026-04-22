const express = require('express');
const router = express.Router();
const { protect, adminOnly, vendorOnly } = require('../middleware/authMiddleware');
const { getAllActivity, getVendorActivity } = require('../controllers/stockActivityController');

// ⚠️ Named route MUST come before / wildcard
router.get('/vendor', protect, vendorOnly, getVendorActivity);   // Vendor: own books only

router.get('/', protect, adminOnly, getAllActivity);              // Admin: all activity

module.exports = router;
