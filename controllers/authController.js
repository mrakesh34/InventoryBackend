const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore_secret_key_2024';

const generateToken = (user) =>
    jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error('Name, email and password are required');
        }

        if (password.length < 6) {
            res.status(400);
            throw new Error('Password must be at least 6 characters');
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(409);
            throw new Error('User already exists with this email');
        }

        // Hash password in the controller (avoids Mongoose 9 pre-save hook issues)
        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = await User.create({ name, email, password: hashedPassword });

        const token = generateToken(user);
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Email and password are required');
        }

        // Must explicitly select password since it's select: false in schema
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        const isMatch = user.matchPassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid email or password');
        }

        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (error) {
        next(error);
    }
};

module.exports = { signup, login, getMe };
