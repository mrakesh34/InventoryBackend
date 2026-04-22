const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const Address = require('../models/Address');
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn("⚠️ STRIPE_SECRET_KEY is missing. Stripe features will fail if called.");
}
const { logStockActivity } = require('./stockActivityController');

// ── Platform Commission Rate (10%) ──────────────────────────────────────────
const PLATFORM_COMMISSION_RATE = 0.10;

// Helper to calculate total from cart items and DB prices
// Also calculates commission split for vendor books
const calculateCartTotal = async (cartItems) => {
    let total = 0;
    const items = [];
    for (const item of cartItems) {
        const book = await Book.findById(item.book);
        if (book) {
            const lineTotal = book.price * item.quantity;
            total += lineTotal;

            // Calculate commission split — only for vendor books
            let vendorEarning = 0;
            let platformFee = 0;
            if (book.vendor) {
                platformFee = parseFloat((lineTotal * PLATFORM_COMMISSION_RATE).toFixed(2));
                vendorEarning = parseFloat((lineTotal - platformFee).toFixed(2));
            }

            items.push({
                book: book._id,
                title: book.bookTitle || book.title || 'Unknown Title',
                quantity: item.quantity,
                price: book.price,
                vendorEarning,
                platformFee,
            });
        }
    }
    return { total, items };
};

const createPaymentIntent = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });

        const cart = await Cart.findOne({ user: userEmail }).populate('items.book');
        if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

        const { total } = await calculateCartTotal(cart.items);

        if (!stripe) return res.status(500).json({ error: 'Stripe is not configured on the server. Please add STRIPE_SECRET_KEY to environment variables.' });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: { userEmail }
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
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

        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        if (!paymentIntentId || !addressId) return res.status(400).json({ error: 'PaymentIntent ID and Address ID are required' });

        const address = await Address.findOne({ _id: addressId, user: userEmail });
        if (!address) return res.status(404).json({ error: 'Address not found or unauthorized' });

        if (!stripe) return res.status(500).json({ error: 'Stripe is not configured on the server.' });

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') return res.status(400).json({ error: 'Payment has not succeeded yet' });

        const cart = await Cart.findOne({ user: userEmail });
        if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

        const { total, items } = await calculateCartTotal(cart.items);

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

        cart.items = [];
        await cart.save();

        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's own orders
// @route   GET /api/orders/my-orders
// @access  Private
const getUserOrders = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });

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
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });

        const order = await Order.findOne({ _id: req.params.id, user: userEmail })
            .populate('shippingAddress')
            .populate({ path: 'items.book', model: 'Book' });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders (Admin — sees everything)
// @route   GET /api/orders/all-orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({})
            .populate('shippingAddress')
            .populate({ path: 'items.book', model: 'Book' })
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

// @desc    Get orders for a vendor (only items belonging to that vendor)
// @route   GET /api/orders/vendor-orders
// @access  Private/Vendor
const getVendorOrders = async (req, res, next) => {
    try {
        const vendorId = req.user._id;

        // Find all books that belong to this vendor
        const vendorBooks = await Book.find({ vendor: vendorId }).select('_id');
        const vendorBookIds = vendorBooks.map(b => b._id.toString());

        if (vendorBookIds.length === 0) {
            return res.status(200).json([]);
        }

        // Find all orders that contain at least one of this vendor's books
        const orders = await Order.find({
            'items.book': { $in: vendorBookIds }
        })
            .populate('shippingAddress')
            .populate({ path: 'items.book', model: 'Book' })
            .sort({ createdAt: -1 });

        // For each order, filter items down to only this vendor's items
        const vendorOrders = orders.map(order => {
            const vendorItems = order.items.filter(
                item => item.book && vendorBookIds.includes(item.book._id?.toString() || item.book.toString())
            );
            // Use vendorEarning (90%) if available, fallback to 90% of full price for old orders
            const vendorTotal = vendorItems.reduce((sum, item) => {
                if (item.vendorEarning && item.vendorEarning > 0) {
                    return sum + item.vendorEarning;
                }
                // Fallback for orders created before commission system
                return sum + (item.price * item.quantity * (1 - PLATFORM_COMMISSION_RATE));
            }, 0);

            const platformFeeTotal = vendorItems.reduce((sum, item) => {
                if (item.platformFee && item.platformFee > 0) {
                    return sum + item.platformFee;
                }
                return sum + (item.price * item.quantity * PLATFORM_COMMISSION_RATE);
            }, 0);

            return {
                _id: order._id,
                user: order.user,
                items: vendorItems,
                vendorTotal: parseFloat(vendorTotal.toFixed(2)),
                platformFee: parseFloat(platformFeeTotal.toFixed(2)),
                totalAmount: order.totalAmount,
                shippingAddress: order.shippingAddress,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                stripePaymentIntentId: order.stripePaymentIntentId,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        });

        res.status(200).json(vendorOrders);
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (Admin or Vendor for their own-book orders)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin or Vendor
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }

        const order = await Order.findById(req.params.id).populate({ path: 'items.book', model: 'Book' });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        // If vendor, verify they have at least one item in this order
        if (req.user.role === 'vendor') {
            const vendorBooks = await Book.find({ vendor: req.user._id }).select('_id');
            const vendorBookIds = vendorBooks.map(b => b._id.toString());
            const hasVendorItem = order.items.some(
                item => item.book && vendorBookIds.includes(item.book._id?.toString() || item.book.toString())
            );
            if (!hasVendorItem) {
                return res.status(403).json({ error: 'Access denied: No items from your store in this order' });
            }
        }

        order.orderStatus = status;
        await order.save();

        res.status(200).json(order);
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel an order (user can only cancel their own Pending/Processing orders)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });

        const order = await Order.findOne({ _id: req.params.id, user: userEmail })
            .populate({ path: 'items.book', model: 'Book' });

        if (!order) return res.status(404).json({ error: 'Order not found or unauthorized' });

        const cancellableStatuses = ['Pending', 'Processing'];
        if (!cancellableStatuses.includes(order.orderStatus)) {
            return res.status(400).json({
                error: `Order cannot be cancelled. It is already "${order.orderStatus}".`
            });
        }

        // Restore stock for each item
        for (const item of order.items) {
            const book = await Book.findById(item.book);
            if (book) {
                const stockBefore = book.stock ?? 0;
                const stockAfter = stockBefore + item.quantity;
                await Book.findByIdAndUpdate(item.book, { stock: stockAfter });
                await logStockActivity({
                    bookId: book._id,
                    bookTitle: book.bookTitle,
                    type: 'stock_in',
                    quantity: item.quantity,
                    stockBefore,
                    stockAfter,
                    performedBy: userEmail,
                    note: `Order cancelled — Order #${order._id.toString().slice(-8).toUpperCase()}`,
                });
            }
        }

        order.orderStatus = 'Cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully.', order });
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
    getVendorOrders,
    updateOrderStatus,
    cancelOrder
};
