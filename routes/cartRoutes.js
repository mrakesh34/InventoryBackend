const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/cartController');

// All cart routes require user to be logged in
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:bookId', updateCartItem);
router.delete('/:bookId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
