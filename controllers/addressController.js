const Address = require('../models/Address');

// @desc    Get user's addresses
// @route   GET /api/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        const addresses = await Address.find({ user: userEmail }).sort({ createdAt: -1 });
        res.status(200).json(addresses);
    } catch (error) {
        next(error);
    }
};

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private
const addAddress = async (req, res, next) => {
    try {
        const userEmail = req.user?.email || req.user?.userEmail || req.user?._id;
        if (!userEmail) return res.status(401).json({ error: 'User email not found in token' });
        
        const { name, street, city, state, zip, country, phone } = req.body;

        if (!name || !street || !city || !state || !zip) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const address = await Address.create({
            user: userEmail,
            name,
            street,
            city,
            state,
            zip,
            country: country || 'US',
            phone
        });

        res.status(201).json(address);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAddresses,
    addAddress
};
