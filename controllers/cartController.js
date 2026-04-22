const Cart = require('../models/Cart');
const Book = require('../models/Book');

const MAX_QTY = 5; // Max quantity per book per user

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        let cart = await Cart.findOne({ user: userEmail }).populate('items.book');
        
        if (!cart) {
            cart = await Cart.create({ user: userEmail, items: [] });
            return res.status(200).json(cart);
        }
        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        const { bookId, quantity = 1 } = req.body;

        if (!bookId) {
            return res.status(400).json({ error: 'Book ID is required' });
        }

        // Verify book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        let cart = await Cart.findOne({ user: userEmail });
        
        let currentQtyInCart = 0;
        let itemIndex = -1;

        if (cart) {
            itemIndex = cart.items.findIndex(item => item.book.toString() === bookId);
            if (itemIndex > -1) {
                currentQtyInCart = cart.items[itemIndex].quantity;
            }
        }

        const requestedTotalQty = currentQtyInCart + Number(quantity);
        const allowedMax = Math.min(MAX_QTY, book.stock ?? 0);

        if (requestedTotalQty > allowedMax) {
            if (book.stock < MAX_QTY) {
                return res.status(400).json({ error: `Cannot add more. Only ${book.stock} in stock.` });
            }
            return res.status(400).json({ error: `You can only purchase a maximum of ${MAX_QTY} copies of a single book.` });
        }

        if (!cart) {
            // Create new cart
            cart = await Cart.create({
                user: userEmail,
                items: [{ book: bookId, quantity }]
            });
        } else {
            if (itemIndex > -1) {
                // Item exists, increase quantity
                cart.items[itemIndex].quantity = requestedTotalQty;
            } else {
                // Item does not exist, add it
                cart.items.push({ book: bookId, quantity });
            }
            await cart.save();
        }

        // Return populated cart
        const updatedCart = await Cart.findById(cart._id).populate('items.book');
        res.status(200).json(updatedCart);
    } catch (error) {
        next(error);
    }
};

// @desc    Update item quantity in cart
// @route   PATCH /api/cart/:bookId
// @access  Private
const updateCartItem = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        const { bookId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const allowedMax = Math.min(MAX_QTY, book.stock ?? 0);
        if (quantity > allowedMax) {
            if (book.stock < MAX_QTY) {
                return res.status(400).json({ error: `Only ${book.stock} in stock.` });
            }
            return res.status(400).json({ error: `You can only purchase a maximum of ${MAX_QTY} copies of a single book.` });
        }

        const cart = await Cart.findOne({ user: userEmail });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.book.toString() === bookId);
        
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
            const updatedCart = await Cart.findById(cart._id).populate('items.book');
            return res.status(200).json(updatedCart);
        } else {
            res.status(404).json({ error: 'Item not found in cart' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:bookId
// @access  Private
const removeFromCart = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        const { bookId } = req.params;

        const cart = await Cart.findOne({ user: userEmail });
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.book.toString() !== bookId);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.book');
        res.status(200).json(updatedCart);
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        const cart = await Cart.findOne({ user: userEmail });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        
        res.status(200).json({ message: 'Cart cleared successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
