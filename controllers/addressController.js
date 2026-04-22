const Address = require('../models/Address');

const userEmail = (req) => req.user?.email || req.user?.userEmail || req.user?._id;

// GET /api/addresses
const getAddresses = async (req, res, next) => {
    try {
        const email = userEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        const addresses = await Address.find({ user: email }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json(addresses);
    } catch (error) { next(error); }
};

// POST /api/addresses
const addAddress = async (req, res, next) => {
    try {
        const email = userEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        const { name, street, city, state, zip, country, phone, isDefault } = req.body;
        if (!name || !street || !city || !state || !zip || !phone)
            return res.status(400).json({ error: 'Please provide all required fields' });

        // If setting as default, unset others
        if (isDefault) {
            await Address.updateMany({ user: email }, { isDefault: false });
        }
        const address = await Address.create({
            user: email, name, street, city, state, zip,
            country: country || 'India', phone,
            isDefault: !!isDefault
        });
        res.status(201).json(address);
    } catch (error) { next(error); }
};

// PATCH /api/addresses/:id
const updateAddress = async (req, res, next) => {
    try {
        const email = userEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        const { name, street, city, state, zip, country, phone, isDefault } = req.body;
        const address = await Address.findOne({ _id: req.params.id, user: email });
        if (!address) return res.status(404).json({ error: 'Address not found' });

        if (isDefault) {
            await Address.updateMany({ user: email }, { isDefault: false });
        }
        Object.assign(address, {
            ...(name   !== undefined && { name }),
            ...(street !== undefined && { street }),
            ...(city   !== undefined && { city }),
            ...(state  !== undefined && { state }),
            ...(zip    !== undefined && { zip }),
            ...(country!== undefined && { country }),
            ...(phone  !== undefined && { phone }),
            ...(isDefault !== undefined && { isDefault: !!isDefault }),
        });
        await address.save();
        res.status(200).json(address);
    } catch (error) { next(error); }
};

// DELETE /api/addresses/:id
const deleteAddress = async (req, res, next) => {
    try {
        const email = userEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        const address = await Address.findOneAndDelete({ _id: req.params.id, user: email });
        if (!address) return res.status(404).json({ error: 'Address not found' });
        res.status(200).json({ message: 'Address deleted' });
    } catch (error) { next(error); }
};

// PATCH /api/addresses/:id/set-default
const setDefault = async (req, res, next) => {
    try {
        const email = userEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        await Address.updateMany({ user: email }, { isDefault: false });
        const address = await Address.findOneAndUpdate(
            { _id: req.params.id, user: email },
            { isDefault: true },
            { new: true }
        );
        if (!address) return res.status(404).json({ error: 'Address not found' });
        res.status(200).json(address);
    } catch (error) { next(error); }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress, setDefault };
