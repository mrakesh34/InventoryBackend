const User = require('../models/User');

// @desc    Get all pending vendor applications
// @route   GET /api/vendor/applications
// @access  Admin only
const getVendorApplications = async (req, res, next) => {
    try {
        const pending = await User.find({ vendorStatus: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json(pending);
    } catch (error) {
        next(error);
    }
};

// @desc    Get count of pending vendor applications (for badge)
// @route   GET /api/vendor/applications/count
// @access  Admin only
const getPendingCount = async (req, res, next) => {
    try {
        const count = await User.countDocuments({ vendorStatus: 'pending' });
        res.status(200).json({ count });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve a vendor application
// @route   PATCH /api/vendor/approve/:userId
// @access  Admin only
const approveVendor = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) { res.status(404); throw new Error('User not found'); }
        if (user.vendorStatus !== 'pending') { res.status(400); throw new Error('No pending vendor application'); }
        user.role = 'vendor';
        user.vendorStatus = 'approved';
        await user.save();
        res.status(200).json({ message: `${user.name} approved as vendor.`, user: { _id: user._id, name: user.name, email: user.email, role: user.role, vendorStatus: user.vendorStatus } });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject a vendor application OR revoke an approved vendor's access
// @route   PATCH /api/vendor/reject/:userId
// @access  Admin only
const rejectVendor = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) { res.status(404); throw new Error('User not found'); }
        // Allow rejecting pending applications AND revoking approved vendor access
        if (user.vendorStatus !== 'pending' && user.vendorStatus !== 'approved') {
            res.status(400); throw new Error('User does not have a pending or active vendor status');
        }
        const originalStatus = user.vendorStatus;
        user.role = 'user';
        user.vendorStatus = 'rejected';
        await user.save();
        const action = originalStatus === 'approved' ? 'revoked' : 'rejected';
        res.status(200).json({ message: `${user.name}'s vendor access ${action}.`, user: { _id: user._id, name: user.name, email: user.email, role: user.role, vendorStatus: user.vendorStatus } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all approved vendors
// @route   GET /api/vendor/all
// @access  Admin only
const getAllVendors = async (req, res, next) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json(vendors);
    } catch (error) {
        next(error);
    }
};

module.exports = { getVendorApplications, getPendingCount, approveVendor, rejectVendor, getAllVendors };
