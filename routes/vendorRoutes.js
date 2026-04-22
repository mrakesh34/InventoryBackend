const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    getVendorApplications,
    getPendingCount,
    approveVendor,
    rejectVendor,
    getAllVendors,
} = require('../controllers/vendorController');
const { getVendorActivitySummary } = require('../controllers/stockActivityController');

// All routes require admin authentication
router.get('/applications/count', protect, adminOnly, getPendingCount);
router.get('/applications', protect, adminOnly, getVendorApplications);
router.get('/all', protect, adminOnly, getAllVendors);
router.get('/activity-summary', protect, adminOnly, getVendorActivitySummary);
router.patch('/approve/:userId', protect, adminOnly, approveVendor);
router.patch('/reject/:userId', protect, adminOnly, rejectVendor);

module.exports = router;
