const Book = require('../models/Book');
const { logStockActivity } = require('./stockActivityController');



// @desc    Get all books (optionally filter by category)
// @route   GET /api/books
// @access  Public
const getAllBooks = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const books = await Book.find(filter).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            res.status(404);
            throw new Error('Book not found');
        }
        res.json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Upload / create a new book
// @route   POST /api/books
// @access  Private (admin or vendor)
const createBook = async (req, res, next) => {
    try {
        const bookData = { ...req.body };
        // Vendors auto-tag the book with their own _id
        if (req.user && req.user.role === 'vendor') {
            bookData.vendor = req.user._id;
        } else {
            // Admin books are platform books (vendor = null)
            bookData.vendor = null;
        }
        const book = await Book.create(bookData);

        // If an initial stock was set, log a stock_in activity
        if (book.stock > 0) {
            await logStockActivity({
                bookId:      book._id,
                bookTitle:   book.bookTitle,
                type:        'stock_in',
                quantity:    book.stock,
                stockBefore: 0,
                stockAfter:  book.stock,
                performedBy: req.user?.email || req.user?._id || 'system',
                note:        'Initial stock on book creation',
            });
        }

        res.status(201).json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a book by ID
// @route   PATCH /api/books/:id
// @access  Private (admin or book owner vendor)
const updateBook = async (req, res, next) => {
    try {
        const existing = await Book.findById(req.params.id);
        if (!existing) { res.status(404); throw new Error('Book not found'); }
        // Vendor can only edit their own books
        if (req.user.role === 'vendor' && String(existing.vendor) !== String(req.user._id)) {
            res.status(403); throw new Error('Access denied: You can only edit your own books');
        }
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a book by ID
// @route   DELETE /api/books/:id
// @access  Private (admin or book owner vendor)
const deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) { res.status(404); throw new Error('Book not found'); }
        // Vendor can only delete their own books
        if (req.user.role === 'vendor' && String(book.vendor) !== String(req.user._id)) {
            res.status(403); throw new Error('Access denied: You can only delete your own books');
        }
        await book.deleteOne();
        res.json({ message: 'Book deleted successfully', id: req.params.id });
    } catch (error) {
        next(error);
    }
};

// @desc    Update book stock and/or low-stock threshold
// @route   PATCH /api/books/:id/stock
// @access  Private (admin for platform books, vendor for own books)
const updateBookStock = async (req, res, next) => {
    try {
        const { stock, lowStockThreshold } = req.body;

        const book = await Book.findById(req.params.id);
        if (!book) { res.status(404); throw new Error('Book not found'); }

        const isVendorBook = book.vendor !== null && book.vendor !== undefined;
        const userRole = req.user.role;

        // Admin cannot touch vendor-owned books' stock
        if (userRole === 'admin' && isVendorBook) {
            res.status(403);
            throw new Error('Admins cannot manage stock for vendor-owned books. Vendors manage their own stock.');
        }

        // Vendor can only touch their own books' stock
        if (userRole === 'vendor' && String(book.vendor) !== String(req.user._id)) {
            res.status(403);
            throw new Error('Access denied: You can only manage stock for your own books.');
        }

        const stockBefore = book.stock ?? 0;
        const updateFields = {};
        if (stock !== undefined) updateFields.stock = Math.max(0, Number(stock));
        if (lowStockThreshold !== undefined) updateFields.lowStockThreshold = Math.max(1, Number(lowStockThreshold));

        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        const stockAfter = updated.stock;
        const qty = Math.abs(stockAfter - stockBefore);
        const performedBy = req.user?.email || req.user?._id || 'unknown';
        const roleLabel = userRole === 'vendor' ? 'Vendor restock' : 'Admin restock';

        if (qty > 0) {
            await logStockActivity({
                bookId: updated._id,
                bookTitle: updated.bookTitle,
                type: stockAfter >= stockBefore ? 'stock_in' : 'stock_out',
                quantity: qty,
                stockBefore,
                stockAfter,
                performedBy,
                note: `${roleLabel} by ${performedBy}`,
            });
        }

        const isLowStock = updated.stock <= updated.lowStockThreshold;
        res.json({ ...updated.toObject(), isLowStock });
    } catch (error) {
        next(error);
    }
};


// get only books owned by the logged-in vendor
const getMyBooks = async (req, res, next) => {
    try {
        const books = await Book.find({ vendor: req.user._id }).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        next(error);
    }
};

// get books at or below threshold (admin: all, vendor: own)
const getLowStockBooks = async (req, res, next) => {
    try {
        const filter = { $expr: { $lte: ['$stock', '$lowStockThreshold'] } };
        if (req.user.role === 'vendor') {
            filter.vendor = req.user._id;
        }
        const books = await Book.find(filter)
            .select('bookTitle stock lowStockThreshold imageURL vendor category')
            .sort({ stock: 1 });
        res.json(books);
    } catch (error) {
        next(error);
    }
};

// returns total cost value, total retail value, and per-category breakdown
const getInventoryValuation = async (req, res, next) => {
    try {
        const books = await Book.find({}).select('category stock price costPrice bookTitle').lean();

        let totalCostValue = 0;
        let totalRetailValue = 0;
        const categoryMap = {};

        for (const book of books) {
            const cost   = (book.costPrice || 0) * (book.stock || 0);
            const retail = (book.price     || 0) * (book.stock || 0);
            totalCostValue   += cost;
            totalRetailValue += retail;

            if (!categoryMap[book.category]) {
                categoryMap[book.category] = { category: book.category, bookCount: 0, totalStock: 0, costValue: 0, retailValue: 0 };
            }
            categoryMap[book.category].bookCount++;
            categoryMap[book.category].totalStock  += book.stock || 0;
            categoryMap[book.category].costValue   += cost;
            categoryMap[book.category].retailValue += retail;
        }

        const byCategory = Object.values(categoryMap).sort((a, b) => b.retailValue - a.retailValue);

        res.json({
            totalBooks:       books.length,
            totalCostValue:   parseFloat(totalCostValue.toFixed(2)),
            totalRetailValue: parseFloat(totalRetailValue.toFixed(2)),
            potentialProfit:  parseFloat((totalRetailValue - totalCostValue).toFixed(2)),
            byCategory,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Rate a book (only buyers with a delivered order)
// @route   PATCH /api/books/:id/rate
// @access  Private (authenticated users only)
const rateBook = async (req, res, next) => {
    try {
        const { rating } = req.body;
        const star = Number(rating);
        if (!star || star < 1 || star > 5) {
            res.status(400); throw new Error('Rating must be between 1 and 5');
        }

        const book = await Book.findById(req.params.id);
        if (!book) { res.status(404); throw new Error('Book not found'); }

        // Order.user is stored as the user's EMAIL string (see Order model)
        const Order = require('../models/Order');
        const deliveredOrder = await Order.findOne({
            user: req.user.email,
            orderStatus: 'Delivered',
            'items.book': book._id,
        });

        if (!deliveredOrder) {
            res.status(403);
            throw new Error('You can only rate books from your delivered orders');
        }

        // Running average: newAvg = (oldAvg * count + newRating) / (count + 1)
        const oldCount  = book.ratingCount || 0;
        const oldRating = book.rating      || 0;
        const newCount  = oldCount + 1;
        const newRating = parseFloat(((oldRating * oldCount + star) / newCount).toFixed(2));

        book.rating      = newRating;
        book.ratingCount = newCount;
        await book.save();

        res.json({ rating: newRating, ratingCount: newCount });
    } catch (error) {
        next(error);
    }
};


module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook, updateBookStock, getMyBooks, getLowStockBooks, getInventoryValuation, rateBook };

