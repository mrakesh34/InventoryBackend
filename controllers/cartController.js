const Cart = require('../models/Cart');
const Book = require('../models/Book');

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
        
        if (!cart) {
            // Create new cart
            cart = await Cart.create({
                user: userEmail,
                items: [{ book: bookId, quantity }]
            });
        } else {
            // Cart exists, check if item already exists
            const itemIndex = cart.items.findIndex(item => item.book.toString() === bookId);
            
            if (itemIndex > -1) {
                // Item exists, increase quantity
                cart.items[itemIndex].quantity += Number(quantity);
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
