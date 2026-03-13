const express = require('express');
const router = express.Router();

const {
    seedBooks,
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
} = require('../controllers/bookController');

const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/seed', seedBooks);
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Protected routes (require login)
router.post('/', protect, createBook);
router.patch('/:id', protect, updateBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;
