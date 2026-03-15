const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    createPaymentIntent,
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, createOrder);

// ⚠️ Named routes MUST come before /:id wildcard
router.get('/my-orders', protect, getUserOrders);
router.get('/all-orders', protect, adminOnly, getAllOrders);  // ← moved up before /:id

router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
