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

module.exports = { getAllUsers };
