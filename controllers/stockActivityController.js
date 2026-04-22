const StockActivity = require('../models/StockActivity');
const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');

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
        const { page = 1, limit = 50, type, vendorId } = req.query;
        const filter = {};
        if (type) filter.type = type;

        // If filtering by a specific vendor, find their book IDs first
        if (vendorId) {
            const vendorBooks = await Book.find({ vendor: vendorId }).select('_id');
            const vendorBookIds = vendorBooks.map(b => b._id);
            filter.book = { $in: vendorBookIds };
        }

        const activities = await StockActivity.find(filter)
            .populate('book', 'bookTitle imageURL category vendor')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await StockActivity.countDocuments(filter);
        res.status(200).json({ activities, total, page: Number(page) });
    } catch (error) {
        next(error);
    }
};

// @desc   Get stock activity for vendor's own books only
// @route  GET /api/stock-activity/vendor
// @access Private/Vendor
const getVendorActivity = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, type } = req.query;

        // Fetch the vendor's own book IDs
        const vendorBooks = await Book.find({ vendor: req.user._id }).select('_id');
        const vendorBookIds = vendorBooks.map(b => b._id);

        const filter = { book: { $in: vendorBookIds } };
        if (type) filter.type = type;

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

// @desc   Get per-vendor activity summary (for admin dashboard)
// @route  GET /api/vendor/activity-summary
// @access Admin only
const getVendorActivitySummary = async (req, res, next) => {
    try {
        // Get all approved vendors
        const vendors = await User.find({ role: 'vendor' }).select('_id name email createdAt').lean();

        const summaries = await Promise.all(vendors.map(async (vendor) => {
            // Get this vendor's books
            const books = await Book.find({ vendor: vendor._id }).select('_id bookTitle stock').lean();
            const bookIds = books.map(b => b._id);

            const [stockInResult, stockOutResult, lastActivity, ordersReceived, ordersDelivered] = await Promise.all([
                StockActivity.aggregate([
                    { $match: { book: { $in: bookIds }, type: 'stock_in' } },
                    { $group: { _id: null, total: { $sum: '$quantity' }, count: { $sum: 1 } } }
                ]),
                StockActivity.aggregate([
                    { $match: { book: { $in: bookIds }, type: 'stock_out' } },
                    { $group: { _id: null, total: { $sum: '$quantity' }, count: { $sum: 1 } } }
                ]),
                StockActivity.findOne({ book: { $in: bookIds } }).sort({ createdAt: -1 }).select('createdAt').lean(),
                // Count distinct orders that contain at least one of this vendor's books
                Order.countDocuments({ 'items.book': { $in: bookIds } }),
                // Count delivered orders containing this vendor's books
                Order.countDocuments({ 'items.book': { $in: bookIds }, orderStatus: 'Delivered' })
            ]);

            // Derive current stock per book from the latest activity log entry (ground truth)
            // Falls back to Book.stock if no activity exists for that book
            const stockPerBook = await Promise.all(
                books.map(async (b) => {
                    const latest = await StockActivity
                        .findOne({ book: b._id })
                        .sort({ createdAt: -1 })
                        .select('stockAfter')
                        .lean();
                    return latest ? latest.stockAfter : (b.stock || 0);
                })
            );
            const totalAvailableStock = stockPerBook.reduce((sum, s) => sum + s, 0);

            return {
                _id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                joinedAt: vendor.createdAt,
                totalBooks: books.length,
                totalAvailableStock,
                totalStockIn: stockInResult[0]?.total || 0,
                stockInEvents: stockInResult[0]?.count || 0,
                totalStockOut: stockOutResult[0]?.total || 0,
                stockOutEvents: stockOutResult[0]?.count || 0,
                lastActivityAt: lastActivity?.createdAt || null,
                ordersReceived,
                ordersDelivered,
            };
        }));

        // Sort by most recent activity
        summaries.sort((a, b) => {
            if (!a.lastActivityAt) return 1;
            if (!b.lastActivityAt) return -1;
            return new Date(b.lastActivityAt) - new Date(a.lastActivityAt);
        });

        res.status(200).json(summaries);
    } catch (error) {
        next(error);
    }
};

module.exports = { logStockActivity, getAllActivity, getVendorActivity, getVendorActivitySummary };
