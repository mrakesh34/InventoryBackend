const StockActivity = require('../models/StockActivity');
const Order         = require('../models/Order');
const Book          = require('../models/Book');

// @desc   Full analytics overview for admin dashboard
// @route  GET /api/analytics/overview
// @access Admin only
const getAnalyticsOverview = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [stockTrendRaw, topSellersRaw, categoryRaw, lowStockRaw] = await Promise.all([

            // ── 1. Stock trend: daily stock_in / stock_out for last 30 days ──────────
            StockActivity.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            type: '$type',
                        },
                        total: { $sum: '$quantity' },
                    },
                },
                { $sort: { '_id.date': 1 } },
            ]),

            // ── 2. Top 10 selling books by qty sold (from order items) ────────────
            Order.aggregate([
                { $unwind: '$items' },
                { $match: { paymentStatus: 'Succeeded' } },
                {
                    $group: {
                        _id: '$items.book',
                        title: { $first: '$items.title' },
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
            ]),

            // ── 3. Category breakdown: book count + total stock ───────────────────
            Book.aggregate([
                {
                    $group: {
                        _id: '$category',
                        bookCount:   { $sum: 1 },
                        totalStock:  { $sum: '$stock' },
                        retailValue: { $sum: { $multiply: ['$price', '$stock'] } },
                    },
                },
                { $sort: { bookCount: -1 } },
            ]),

            // ── 4. Low stock books ────────────────────────────────────────────────
            Book.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
                .select('bookTitle stock lowStockThreshold category vendor imageURL')
                .sort({ stock: 1 })
                .limit(20)
                .lean(),
        ]);

        // ── Transform stock trend into { date, stockIn, stockOut } array ─────────
        const trendMap = {};
        for (const row of stockTrendRaw) {
            const date = row._id.date;
            if (!trendMap[date]) trendMap[date] = { date, stockIn: 0, stockOut: 0 };
            if (row._id.type === 'stock_in')  trendMap[date].stockIn  = row.total;
            if (row._id.type === 'stock_out') trendMap[date].stockOut = row.total;
        }
        const stockTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

        // ── Top sellers with image via book lookup ────────────────────────────────
        const topSellers = await Promise.all(
            topSellersRaw.map(async (item) => {
                const book = await Book.findById(item._id).select('imageURL bookTitle').lean();
                return {
                    bookId:       item._id,
                    title:        item.title || book?.bookTitle || 'Unknown',
                    imageURL:     book?.imageURL || '',
                    totalSold:    item.totalSold,
                    totalRevenue: parseFloat((item.totalRevenue || 0).toFixed(2)),
                };
            })
        );

        // ── Category breakdown ────────────────────────────────────────────────────
        const categoryBreakdown = categoryRaw.map(c => ({
            category:    c._id,
            bookCount:   c.bookCount,
            totalStock:  c.totalStock,
            retailValue: parseFloat((c.retailValue || 0).toFixed(2)),
        }));

        res.json({ stockTrend, topSellers, categoryBreakdown, lowStockBooks: lowStockRaw });
    } catch (error) {
        next(error);
    }
};

// @desc   Inventory reports — summary data for the Reports page
// @route  GET /api/analytics/reports
// @access Admin only
const getReportsData = async (req, res, next) => {
    try {
        const [
            totalBooks,
            totalStockAgg,
            allOrders,
            topSellersRaw,
            categoryRaw,
            lowStockBooks,
            monthlyRevenueRaw,
        ] = await Promise.all([
            // 1. Total number of books
            Book.countDocuments(),

            // 2. Total stock units across all books
            Book.aggregate([
                { $group: { _id: null, totalStock: { $sum: '$stock' }, totalRetailValue: { $sum: { $multiply: ['$price', '$stock'] } }, totalCostValue: { $sum: { $multiply: ['$costPrice', '$stock'] } } } },
            ]),

            // 3. All orders for calculations
            Order.find().lean(),

            // 4. Top 10 selling books
            Order.aggregate([
                { $unwind: '$items' },
                { $match: { paymentStatus: 'Succeeded' } },
                {
                    $group: {
                        _id: '$items.book',
                        title: { $first: '$items.title' },
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
            ]),

            // 5. Category breakdown
            Book.aggregate([
                {
                    $group: {
                        _id: '$category',
                        bookCount: { $sum: 1 },
                        totalStock: { $sum: '$stock' },
                        retailValue: { $sum: { $multiply: ['$price', '$stock'] } },
                    },
                },
                { $sort: { bookCount: -1 } },
            ]),

            // 6. Low stock books
            Book.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
                .select('bookTitle stock lowStockThreshold category price imageURL')
                .sort({ stock: 1 })
                .limit(20)
                .lean(),

            // 7. Monthly revenue for last 12 months
            Order.aggregate([
                { $match: { paymentStatus: 'Succeeded' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        revenue: { $sum: '$totalAmount' },
                        orderCount: { $sum: 1 },
                    },
                },
                { $sort: { _id: -1 } },
                { $limit: 12 },
            ]),
        ]);

        // Order status counts + commission tracking
        const orderStatusCounts = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
        let totalRevenue = 0;
        let successfulOrders = 0;
        let platformCommissionTotal = 0;
        let vendorPayoutsTotal = 0;

        const COMMISSION_RATE = 0.10;

        for (const o of allOrders) {
            if (orderStatusCounts[o.orderStatus] !== undefined) orderStatusCounts[o.orderStatus]++;
            if (o.paymentStatus === 'Succeeded') {
                totalRevenue += o.totalAmount || 0;
                successfulOrders++;
                // Sum commission from each item
                for (const item of (o.items || [])) {
                    if (item.platformFee && item.platformFee > 0) {
                        platformCommissionTotal += item.platformFee;
                        vendorPayoutsTotal += item.vendorEarning || 0;
                    } else {
                        // Fallback: check if book has a vendor
                        const lineTotal = (item.price || 0) * (item.quantity || 0);
                        // We need to check if this was a vendor book — look up book
                        const bookDoc = await Book.findById(item.book).select('vendor').lean();
                        if (bookDoc && bookDoc.vendor) {
                            platformCommissionTotal += lineTotal * COMMISSION_RATE;
                            vendorPayoutsTotal += lineTotal * (1 - COMMISSION_RATE);
                        }
                    }
                }
            }
        }

        // Enrich top sellers with images
        const topSellers = await Promise.all(
            topSellersRaw.map(async (item) => {
                const book = await Book.findById(item._id).select('imageURL bookTitle').lean();
                return {
                    bookId: item._id,
                    title: item.title || book?.bookTitle || 'Unknown',
                    imageURL: book?.imageURL || '',
                    totalSold: item.totalSold,
                    totalRevenue: parseFloat((item.totalRevenue || 0).toFixed(2)),
                };
            })
        );

        const stockData = totalStockAgg[0] || { totalStock: 0, totalRetailValue: 0, totalCostValue: 0 };

        const categoryBreakdown = categoryRaw.map(c => ({
            category: c._id,
            bookCount: c.bookCount,
            totalStock: c.totalStock,
            retailValue: parseFloat((c.retailValue || 0).toFixed(2)),
        }));

        const monthlyRevenue = monthlyRevenueRaw
            .map(m => ({ month: m._id, revenue: parseFloat((m.revenue || 0).toFixed(2)), orders: m.orderCount }))
            .reverse();

        res.json({
            summary: {
                totalBooks,
                totalStock: stockData.totalStock,
                totalRetailValue: parseFloat((stockData.totalRetailValue || 0).toFixed(2)),
                totalCostValue: parseFloat((stockData.totalCostValue || 0).toFixed(2)),
                potentialProfit: parseFloat(((stockData.totalRetailValue || 0) - (stockData.totalCostValue || 0)).toFixed(2)),
                totalOrders: allOrders.length,
                successfulOrders,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                avgOrderValue: successfulOrders > 0 ? parseFloat((totalRevenue / successfulOrders).toFixed(2)) : 0,
                platformCommissionTotal: parseFloat(platformCommissionTotal.toFixed(2)),
                vendorPayoutsTotal: parseFloat(vendorPayoutsTotal.toFixed(2)),
                commissionRate: COMMISSION_RATE,
            },
            orderStatusCounts,
            topSellers,
            categoryBreakdown,
            lowStockBooks,
            monthlyRevenue,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAnalyticsOverview, getReportsData };
