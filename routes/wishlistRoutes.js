const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWishlist, toggleWishlist, checkWishlist } = require('../controllers/wishlistController');

router.get('/',                   protect, getWishlist);
router.get('/check/:bookId',      protect, checkWishlist);
router.post('/toggle/:bookId',    protect, toggleWishlist);

module.exports = router;
