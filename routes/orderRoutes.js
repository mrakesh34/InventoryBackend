const express = require('express');
const router = express.Router();
const { protect, adminOnly, vendorOnly, adminOrVendor } = require('../middleware/authMiddleware');
const {
    createPaymentIntent,
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrders,
    getVendorOrders,
    updateOrderStatus,
    cancelOrder
} = require('../controllers/orderController');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, createOrder);

// ⚠️ Named routes MUST come before /:id wildcard
router.get('/my-orders', protect, getUserOrders);
router.get('/all-orders', protect, adminOnly, getAllOrders);
router.get('/vendor-orders', protect, vendorOnly, getVendorOrders);

router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, adminOrVendor, updateOrderStatus);
router.patch('/:id/cancel', protect, cancelOrder);


module.exports = router;
