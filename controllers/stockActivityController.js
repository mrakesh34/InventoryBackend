const StockActivity = require('../models/StockActivity');
const Book = require('../models/Book');

// @desc   Log a stock change (admin add or user purchase)
// Shared helper — call from bookController and orderController
const logStockActivity = async ({ bookId, bookTitle, type, quantity, stockBefore, stockAfter, performedBy, note = '' }) => {
    try {
        await StockActivity.create({ book: bookId, bookTitle, type, quantity, stockBefore, stockAfter, performedBy, note });
    } catch (err) {
        console.error('StockActivity log error:', err.message);
    }
};

// @desc   Get all stock activity (Admin)
// @route  GET /api/stock-activity
// @access Private/Admin
const getAllActivity = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, type } = req.query;
        const filter = type ? { type } : {};
        const activities = await StockActivity.find(filter)
            .populate('book', 'bookTitle imageURL category')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await StockActivity.countDocuments(filter);
        res.status(200).json({ activities, total, page: Number(page) });
    } catch (error) {
        next(error);
    }
};

module.exports = { logStockActivity, getAllActivity };
