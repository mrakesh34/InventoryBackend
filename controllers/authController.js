const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore_secret_key_2024';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mrakeshrout34@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345678';

const generateToken = (user) =>
    jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

// initialize admin account if it doesn't exist
const seedAdminUser = async () => {
    try {
        const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (!existing) {
            await User.create({
                name: 'Admin',
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin',
                vendorStatus: 'none',
            });
            console.log(`Admin account verified: ${ADMIN_EMAIL}`);
        } else {
            // enforce admin role, name and password
            await User.findByIdAndUpdate(existing._id, {
                name: 'Admin',
                role: 'admin',
                vendorStatus: 'none',
                password: hashedPassword,
            });
            console.log(`Admin enforced: ${ADMIN_EMAIL}`);
        }
    } catch (err) {
        console.error('Failed to initialize admin:', err.message);
    }
};

// register new user
const signup = async (req, res, next) => {
    try {
        const { name, email, password, registerAsVendor, vendorDetails } = req.body;

        if (!name || !email || !password) {
            res.status(400); throw new Error('Name, email and password are required');
        }
        if (password.length < 6) {
            res.status(400); throw new Error('Password must be at least 6 characters');
        }
        if (email.toLowerCase() === ADMIN_EMAIL) {
            res.status(400); throw new Error('This email is reserved. Please use a different email.');
        }

        // check if they verified otp first
        const verifiedOtp = await Otp.findOne({
            email: email.toLowerCase().trim(),
            verified: true,
        });
        if (!verifiedOtp) {
            res.status(403);
            throw new Error('Email not verified. Please verify your email with OTP first.');
        }

        const userExists = await User.findOne({ email });
        if (userExists) { res.status(409); throw new Error('User already exists with this email'); }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const isVendor = registerAsVendor === true || registerAsVendor === 'true';
        const userData = {
            name,
            email,
            password: hashedPassword,
            role: 'user',
            vendorStatus: isVendor ? 'pending' : 'none',
            vendorDetails: isVendor ? {
                businessName: vendorDetails?.businessName || '',
                categories: vendorDetails?.categories || [],
                estimatedStock: vendorDetails?.estimatedStock || 0,
                description: vendorDetails?.description || '',
                phone: vendorDetails?.phone || '',
            } : {},
        };

        const user = await User.create(userData);

        await Otp.deleteMany({ email: email.toLowerCase().trim() });

        const token = generateToken(user);
        res.status(201).json({
            message: userData.vendorStatus === 'pending'
                ? 'Account created! Your vendor application is under review.'
                : 'User created successfully',
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, vendorStatus: user.vendorStatus },
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) { res.status(400); throw new Error('Email and password are required'); }

        const user = await User.findOne({ email }).select('+password');
        if (!user) { res.status(401); throw new Error('Invalid email or password'); }

        const isMatch = user.matchPassword(password);
        if (!isMatch) { res.status(401); throw new Error('Invalid email or password'); }

        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, vendorStatus: user.vendorStatus },
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) { res.status(404); throw new Error('User not found'); }
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, vendorStatus: user.vendorStatus });
    } catch (error) {
        next(error);
    }
};

module.exports = { signup, login, getMe, seedAdminUser };
