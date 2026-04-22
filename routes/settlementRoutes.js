const express = require('express');
const router  = express.Router();
const { protect, adminOnly, vendorOnly } = require('../middleware/authMiddleware');
const { getSettlementSummary, getMyEarnings, createSettlement } = require('../controllers/settlementController');

router.get('/summary',        protect, adminOnly,  getSettlementSummary);   // Admin: all vendor earnings
router.get('/my-earnings',    protect, vendorOnly,  getMyEarnings);          // Vendor: own earnings
router.post('/:vendorId',     protect, adminOnly,  createSettlement);        // Admin: mark vendor as settled

module.exports = router;
