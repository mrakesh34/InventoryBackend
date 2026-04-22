const express = require('express');
const router  = express.Router();
const { protect, adminOrVendor } = require('../middleware/authMiddleware');
const {
    joinWaitlist,
    leaveWaitlist,
    getWaitlistStatus,
    getWaitlistCount,
    getMyWaitlist,
    getWaitlistSummary,
} = require('../controllers/waitlistController');

// ⚠️ Named routes before /:bookId
router.get('/my',           protect,            getMyWaitlist);       // User: my waitlisted books
router.get('/summary',      protect, adminOrVendor, getWaitlistSummary);  // Admin/Vendor: all book waitlist counts

router.get('/:bookId/status', protect, getWaitlistStatus);           // User: am I on this waitlist?
router.get('/:bookId/count',  protect, adminOrVendor, getWaitlistCount);  // Admin/Vendor: count for a book
router.post('/:bookId',       protect, joinWaitlist);                 // User: join waitlist
router.delete('/:bookId',     protect, leaveWaitlist);                // User: leave waitlist

module.exports = router;
