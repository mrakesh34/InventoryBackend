const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Address = require('../models/Address');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logStockActivity } = require('./stockActivityController');

// Helper to calculate total from cart items and DB prices
const calculateCartTotal = async (cartItems) => {
    let total = 0;
    const items = [];
    for (const item of cartItems) {
        const book = await Book.findById(item.book);
        if (book) {
            total += book.price * item.quantity;
            items.push({
                book: book._id,
                title: book.bookTitle || book.title || 'Unknown Title',
                quantity: item.quantity,
                price: book.price
            });
        }
    }
    return { total, items };
};

const createPaymentIntent = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) {
            return res.status(401).json({ error: 'User email not found in token' });
        }

        // Find user cart
        const cart = await Cart.findOne({ user: userEmail }).populate('items.book');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const { total } = await calculateCartTotal(cart.items);

        // Create a PaymentIntent with the order amount and currency
        // Amount must be in cents (e.g., $10 = 1000)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userEmail
            }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        next(error);
    }
};

// @desc    Create a new order (after successful payment)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        const { paymentIntentId, addressId } = req.body;

        if (!userEmail) {
            return res.status(401).json({ error: 'User email not found in token' });
        }

        if (!paymentIntentId || !addressId) {
            return res.status(400).json({ error: 'PaymentIntent ID and Address ID are required' });
        }

        // Verify address belongs to user
        const address = await Address.findOne({ _id: addressId, user: userEmail });
        if (!address) {
            return res.status(404).json({ error: 'Address not found or unauthorized' });
        }

        // Verify payment intent with Stripe (optional but recommended)
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment has not succeeded yet' });
        }

        // Retrieve the cart to create order items
        const cart = await Cart.findOne({ user: userEmail });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const { total, items } = await calculateCartTotal(cart.items);

        // Create the order
        const order = await Order.create({
            user: userEmail,
            items,
            totalAmount: total,
            shippingAddress: addressId,
            paymentStatus: 'Succeeded',
            orderStatus: 'Pending',
            stripePaymentIntentId: paymentIntentId
        });

        // Decrement stock for each item and log activity
        for (const item of items) {
            const book = await Book.findById(item.book);
            if (book) {
                const stockBefore = book.stock ?? 0;
                const stockAfter = Math.max(0, stockBefore - item.quantity);
                await Book.findByIdAndUpdate(item.book, { stock: stockAfter });
                await logStockActivity({
                    bookId: book._id,
                    bookTitle: book.bookTitle,
                    type: 'stock_out',
                    quantity: item.quantity,
                    stockBefore,
                    stockAfter,
                    performedBy: userEmail,
                    note: `User purchase — Order #${order._id.toString().slice(-8).toUpperCase()}`,
                });
            }
        }

        // Clear the user's cart
        cart.items = [];
        await cart.save();

        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getUserOrders = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) {
            return res.status(401).json({ error: 'User email not found in token' });
        }

        const orders = await Order.find({ user: userEmail })
            .populate('shippingAddress')
            .populate('items.book')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) {
            return res.status(401).json({ error: 'User email not found in token' });
        }

        const order = await Order.findOne({ _id: req.params.id, user: userEmail })
            .populate('shippingAddress')
            .populate({
                path: 'items.book',
                model: 'Book'
            });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/all-orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({})
            .populate('shippingAddress')
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid sort status' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.orderStatus = status;
        await order.save();

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPaymentIntent,
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
};
