const Book = require('../models/Book');
const { logStockActivity } = require('./stockActivityController');

// Dummy books for seeding
const dummyBooks = [
    {
        bookTitle: "The Great Gatsby",
        authorName: "F. Scott Fitzgerald",
        imageURL: "https://covers.openlibrary.org/b/id/8226185-L.jpg",
        category: "Fiction",
        bookDescription: "A classic American novel set in the Jazz Age, exploring themes of wealth, class, love and the American Dream through the story of enigmatic millionaire Jay Gatsby.",
        bookPDFURL: "https://www.gutenberg.org/files/64317/64317-h/64317-h.htm",
        price: 12.99,
        rating: 4.5
    },
    {
        bookTitle: "Clean Code",
        authorName: "Robert C. Martin",
        imageURL: "https://covers.openlibrary.org/b/id/8091016-L.jpg",
        category: "Programming",
        bookDescription: "A handbook of agile software craftsmanship that teaches you how to write code that is clean, readable and maintainable.",
        bookPDFURL: "https://example.com/clean-code.pdf",
        price: 29.99,
        rating: 4.8
    },
    {
        bookTitle: "Sapiens: A Brief History of Humankind",
        authorName: "Yuval Noah Harari",
        imageURL: "https://covers.openlibrary.org/b/id/8908783-L.jpg",
        category: "History",
        bookDescription: "A sweeping narrative of human history from the Stone Age to the twenty-first century.",
        bookPDFURL: "https://example.com/sapiens.pdf",
        price: 16.99,
        rating: 4.7
    },
    {
        bookTitle: "A Brief History of Time",
        authorName: "Stephen Hawking",
        imageURL: "https://covers.openlibrary.org/b/id/8743461-L.jpg",
        category: "Science",
        bookDescription: "Stephen Hawking explores the most fundamental questions about the universe — from the Big Bang to black holes.",
        bookPDFURL: "https://example.com/brief-history-time.pdf",
        price: 14.99,
        rating: 4.6
    },
    {
        bookTitle: "To Kill a Mockingbird",
        authorName: "Harper Lee",
        imageURL: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
        category: "Fiction",
        bookDescription: "A gripping tale of racial injustice and the destruction of innocence in the American South.",
        bookPDFURL: "https://example.com/mockingbird.pdf",
        price: 11.99,
        rating: 4.9
    },
    {
        bookTitle: "JavaScript: The Good Parts",
        authorName: "Douglas Crockford",
        imageURL: "https://covers.openlibrary.org/b/id/8397454-L.jpg",
        category: "Programming",
        bookDescription: "An authoritative guide to the good parts of JavaScript for reliable, readable and maintainable code.",
        bookPDFURL: "https://example.com/js-good-parts.pdf",
        price: 24.99,
        rating: 4.4
    },
    {
        bookTitle: "The Alchemist",
        authorName: "Paulo Coelho",
        imageURL: "https://covers.openlibrary.org/b/id/12999701-L.jpg",
        category: "Fiction",
        bookDescription: "A magical story about Santiago, an Andalusian shepherd boy who follows his dreams across the world.",
        bookPDFURL: "https://example.com/alchemist.pdf",
        price: 13.99,
        rating: 4.6
    },
    {
        bookTitle: "Thinking, Fast and Slow",
        authorName: "Daniel Kahneman",
        imageURL: "https://covers.openlibrary.org/b/id/8291664-L.jpg",
        category: "Science",
        bookDescription: "Nobel Prize winner Daniel Kahneman explains the two systems that drive the way we think.",
        bookPDFURL: "https://example.com/thinking-fast-slow.pdf",
        price: 18.99,
        rating: 4.5
    },
    {
        bookTitle: "1984",
        authorName: "George Orwell",
        imageURL: "https://covers.openlibrary.org/b/id/8575708-L.jpg",
        category: "Fiction",
        bookDescription: "A dystopian tale about the dangers of totalitarianism. One of the most powerful political novels ever written.",
        bookPDFURL: "https://example.com/1984.pdf",
        price: 10.99,
        rating: 4.8
    },
    {
        bookTitle: "The Pragmatic Programmer",
        authorName: "Andrew Hunt & David Thomas",
        imageURL: "https://covers.openlibrary.org/b/id/8091016-L.jpg",
        category: "Programming",
        bookDescription: "A timeless guide to software development covering personal responsibility, architecture and best practices.",
        bookPDFURL: "https://example.com/pragmatic-programmer.pdf",
        price: 32.99,
        rating: 4.7
    }
];

// @desc    Seed dummy books (only if DB is empty)
// @route   GET /api/books/seed
// @access  Public
const seedBooks = async (req, res, next) => {
    try {
        const count = await Book.countDocuments();
        if (count > 0) {
            return res.json({ message: `Books already seeded. ${count} books exist.`, count });
        }
        const books = await Book.insertMany(dummyBooks);
        res.json({ message: 'Books seeded successfully!', count: books.length });
    } catch (error) {
        next(error);
    }
};

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
// @access  Private (admin)
const createBook = async (req, res, next) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a book by ID
// @route   PATCH /api/books/:id
// @access  Private (admin)
const updateBook = async (req, res, next) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!book) {
            res.status(404);
            throw new Error('Book not found');
        }
        res.json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a book by ID
// @route   DELETE /api/books/:id
// @access  Private (admin)
const deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            res.status(404);
            throw new Error('Book not found');
        }
        res.json({ message: 'Book deleted successfully', id: req.params.id });
    } catch (error) {
        next(error);
    }
};

// @desc    Update book stock and/or low-stock threshold
// @route   PATCH /api/books/:id/stock
// @access  Private (admin)
const updateBookStock = async (req, res, next) => {
    try {
        const { stock, lowStockThreshold } = req.body;

        const book = await Book.findById(req.params.id);
        if (!book) {
            res.status(404);
            throw new Error('Book not found');
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
        const adminEmail = req.user?.email || req.user?.userEmail || 'admin';

        if (qty > 0) {
            await logStockActivity({
                bookId: updated._id,
                bookTitle: updated.bookTitle,
                type: stockAfter >= stockBefore ? 'stock_in' : 'stock_out',
                quantity: qty,
                stockBefore,
                stockAfter,
                performedBy: adminEmail,
                note: `Admin restock by ${adminEmail}`,
            });
        }

        const isLowStock = updated.stock <= updated.lowStockThreshold;
        res.json({ ...updated.toObject(), isLowStock });
    } catch (error) {
        next(error);
    }
};

module.exports = { seedBooks, getAllBooks, getBookById, createBook, updateBook, deleteBook, updateBookStock };
