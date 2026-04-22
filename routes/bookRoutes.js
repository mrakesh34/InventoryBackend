const express = require('express');
const router = express.Router();

const {
    seedBooks, getAllBooks, getBookById,
    createBook, updateBook, deleteBook,
    updateBookStock, getMyBooks, getLowStockBooks,
    getInventoryValuation, rateBook,
} = require('../controllers/bookController');

const { protect, adminOnly, adminOrVendor } = require('../middleware/authMiddleware');

// Public routes
router.get('/seed', seedBooks);
router.get('/', getAllBooks);

// ⚠️ Named routes MUST come before /:id wildcard
router.get('/my-books',             protect, adminOrVendor,        getMyBooks);              // Vendor: own books only
router.get('/low-stock',            protect, adminOrVendor,        getLowStockBooks);        // Admin+Vendor: low stock alert
router.get('/inventory-valuation',  protect, adminOnly,            getInventoryValuation);   // Admin: valuation report

router.get('/:id', getBookById);

// Protected routes (admin or vendor)
router.post('/', protect, adminOrVendor, createBook);
router.patch('/:id/stock', protect, adminOrVendor, updateBookStock);
router.patch('/:id/rate',  protect, rateBook);          // Any logged-in user with delivered order
router.patch('/:id', protect, adminOrVendor, updateBook);
router.delete('/:id', protect, adminOrVendor, deleteBook);

module.exports = router;
