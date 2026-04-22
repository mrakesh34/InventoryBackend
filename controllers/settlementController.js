const Order      = require('../models/Order');
const Book       = require('../models/Book');
const User       = require('../models/User');
const Settlement = require('../models/Settlement');

// Platform commission rate — must match orderController
const PLATFORM_COMMISSION_RATE = 0.10;

// Helper: aggregate vendor earnings from orders (uses 90% vendor share)
const calcVendorEarnings = async (vendorId) => {
    const vendorBooks = await Book.find({ vendor: vendorId }).select('_id').lean();
    const bookIds = vendorBooks.map(b => b._id);
    if (bookIds.length === 0) return { total: 0, delivered: 0, pending: 0, byMonth: [] };

    const orders = await Order.find({ 'items.book': { $in: bookIds }, paymentStatus: 'Succeeded' })
        .populate({ path: 'items.book', model: 'Book', select: 'vendor' })
        .lean();

    let total = 0, delivered = 0, pending = 0;
    const monthMap = {};

    for (const order of orders) {
        const vendorItems = order.items.filter(
            item => item.book && String(item.book.vendor) === String(vendorId)
        );
        // Use stored vendorEarning (90%) if available, fallback for old orders
        const vendorTotal = vendorItems.reduce((s, i) => {
            if (i.vendorEarning && i.vendorEarning > 0) {
                return s + i.vendorEarning;
            }
            // Fallback: compute 90% for orders created before commission system
            return s + (i.price * i.quantity * (1 - PLATFORM_COMMISSION_RATE));
        }, 0);
        total += vendorTotal;

        if (order.orderStatus === 'Delivered') delivered += vendorTotal;
        else if (['Pending', 'Processing', 'Shipped'].includes(order.orderStatus)) pending += vendorTotal;

        const month = new Date(order.createdAt).toISOString().slice(0, 7); // YYYY-MM
        if (!monthMap[month]) monthMap[month] = { month, revenue: 0 };
        monthMap[month].revenue += vendorTotal;
    }

    const byMonth = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    return { total, delivered, pending, byMonth };
};

// @desc   Get earnings summary for all vendors (admin)
// @route  GET /api/settlements/summary
// @access Admin only
const getSettlementSummary = async (req, res, next) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).select('_id name email createdAt').lean();
        const summaries = await Promise.all(vendors.map(async (vendor) => {
            const earnings = await calcVendorEarnings(vendor._id);
            const settlements = await Settlement.find({ vendor: vendor._id }).sort({ settledAt: -1 }).lean();
            const totalSettled = settlements.reduce((s, st) => s + st.amount, 0);
            return {
                vendorId:       vendor._id,
                name:           vendor.name,
                email:          vendor.email,
                totalEarned:    parseFloat(earnings.total.toFixed(2)),
                delivered:      parseFloat(earnings.delivered.toFixed(2)),
                pending:        parseFloat(earnings.pending.toFixed(2)),
                totalSettled:   parseFloat(totalSettled.toFixed(2)),
                outstanding:    parseFloat((earnings.delivered - totalSettled).toFixed(2)),
                byMonth:        earnings.byMonth,
                settlements,
            };
        }));
        summaries.sort((a, b) => b.outstanding - a.outstanding);
        res.json(summaries);
    } catch (error) {
        next(error);
    }
};

// @desc   Get current vendor's own earnings
// @route  GET /api/settlements/my-earnings
// @access Vendor only
const getMyEarnings = async (req, res, next) => {
    try {
        const earnings = await calcVendorEarnings(req.user._id);
        const settlements = await Settlement.find({ vendor: req.user._id }).sort({ settledAt: -1 }).lean();
        const totalSettled = settlements.reduce((s, st) => s + st.amount, 0);
        res.json({
            totalEarned:  parseFloat(earnings.total.toFixed(2)),
            delivered:    parseFloat(earnings.delivered.toFixed(2)),
            pending:      parseFloat(earnings.pending.toFixed(2)),
            totalSettled: parseFloat(totalSettled.toFixed(2)),
            outstanding:  parseFloat((earnings.delivered - totalSettled).toFixed(2)),
            byMonth:      earnings.byMonth,
            settlements,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Admin marks a vendor as settled for a period
// @route  POST /api/settlements/:vendorId
// @access Admin only
const createSettlement = async (req, res, next) => {
    try {
        const { amount, period, note } = req.body;
        const adminEmail = req.user?.email || 'admin';
        const vendor = await User.findById(req.params.vendorId).lean();
        if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

        const settlement = await Settlement.create({
            vendor: vendor._id,
            vendorName: vendor.name,
            amount: parseFloat(amount),
            period: period || new Date().toISOString().slice(0, 7),
            note: note || '',
            settledBy: adminEmail,
        });
        res.status(201).json(settlement);
    } catch (error) {
        next(error);
    }
};

module.exports = { getSettlementSummary, getMyEarnings, createSettlement };
