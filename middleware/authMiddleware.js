const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore_secret_key_2024';

// Protect routes — verifies JWT token
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Attach user to request (without password)
            req.user = await User.findById(decoded.userId).select('-password');

            next();
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Admins only' });
    }
};


// Vendor only middleware
const vendorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'vendor') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Vendors only' });
    }
};

// Admin OR Vendor middleware
const adminOrVendor = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'vendor')) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Admins or Vendors only' });
    }
};

module.exports = { protect, adminOnly, vendorOnly, adminOrVendor };
