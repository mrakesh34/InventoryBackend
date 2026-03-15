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
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrderById);

// Admin routes
router.get('/all-orders', protect, adminOnly, getAllOrders);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
