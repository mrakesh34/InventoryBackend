const Waitlist = require('../models/Waitlist');

// @desc   Join waitlist for a book
// @route  POST /api/waitlist/:bookId
// @access Private (user)
const joinWaitlist = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail;
        const userName  = req.user?.name || '';
        const { bookId } = req.params;

        // Upsert — silently succeed if already on list
        const entry = await Waitlist.findOneAndUpdate(
            { book: bookId, userEmail },
            { book: bookId, userEmail, userName },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(201).json({ message: 'Added to waitlist', entry });
    } catch (error) {
        if (error.code === 11000) return res.status(200).json({ message: 'Already on waitlist' });
        next(error);
    }
};

// @desc   Leave waitlist for a book
// @route  DELETE /api/waitlist/:bookId
// @access Private (user)
const leaveWaitlist = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail;
        await Waitlist.findOneAndDelete({ book: req.params.bookId, userEmail });
        res.json({ message: 'Removed from waitlist' });
    } catch (error) {
        next(error);
    }
};

// @desc   Check if current user is on a book's waitlist
// @route  GET /api/waitlist/:bookId/status
// @access Private (user)
const getWaitlistStatus = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail;
        const entry = await Waitlist.findOne({ book: req.params.bookId, userEmail });
        const count = await Waitlist.countDocuments({ book: req.params.bookId });
        res.json({ onWaitlist: !!entry, count });
    } catch (error) {
        next(error);
    }
};

// @desc   Get waitlist count for a book (admin / vendor)
// @route  GET /api/waitlist/:bookId/count
// @access Private (admin or vendor)
const getWaitlistCount = async (req, res, next) => {
    try {
        const count = await Waitlist.countDocuments({ book: req.params.bookId });
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// @desc   Get all books the current user is waitlisted for
// @route  GET /api/waitlist/my
// @access Private (user)
const getMyWaitlist = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail;
        const entries = await Waitlist.find({ userEmail })
            .populate('book', 'bookTitle imageURL price stock authorName')
            .sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        next(error);
    }
};

// @desc   Get waitlist summary for all books (admin / vendor)
// @route  GET /api/waitlist/summary
// @access Private (admin or vendor)
const getWaitlistSummary = async (req, res, next) => {
    try {
        const summary = await Waitlist.aggregate([
            { $group: { _id: '$book', count: { $sum: 1 }, latestAt: { $max: '$createdAt' } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
        ]);
        res.json(summary);
    } catch (error) {
        next(error);
    }
};

module.exports = { joinWaitlist, leaveWaitlist, getWaitlistStatus, getWaitlistCount, getMyWaitlist, getWaitlistSummary };
