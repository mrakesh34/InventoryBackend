const User = require('../models/User');

// @desc   Get all users (Admin)
// @route  GET /api/users
// @access Private/Admin
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

// @desc   Get current logged-in user profile
// @route  GET /api/users/me
// @access Private
const getMe = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail;
        const user = await User.findOne({ email: userEmail }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// @desc   Update current user's profile (name, phone)
// @route  PATCH /api/users/me
// @access Private
const updateMe = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail;
        const { name, phone } = req.body;

        // Validate name
        if (name !== undefined) {
            if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty' });
            if (!/^[a-zA-Z\s'-]+$/.test(name.trim()))
                return res.status(400).json({ error: 'Name can only contain letters, spaces, hyphens and apostrophes' });
        }

        // Validate phone (optional — Indian 10-digit if provided)
        if (phone !== undefined && phone !== '') {
            if (!/^\d{10}$/.test(phone))
                return res.status(400).json({ error: 'Phone must be a 10-digit number' });
        }

        const update = {};
        if (name  !== undefined) update.name  = name.trim();
        if (phone !== undefined) update.phone = phone.trim();

        const user = await User.findOneAndUpdate(
            { email: userEmail },
            { $set: update },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllUsers, getMe, updateMe };
