const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/emailService');

// Generate a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc   Send OTP to email for verification
// @route  POST /api/auth/send-otp
// @access Public
const sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400);
            throw new Error('Email is required');
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            res.status(409);
            throw new Error('An account with this email already exists');
        }

        // Rate limit: don't allow more than 1 OTP per 60 seconds for same email
        const recentOtp = await Otp.findOne({
            email: normalizedEmail,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
        });
        if (recentOtp) {
            res.status(429);
            throw new Error('Please wait 60 seconds before requesting a new OTP');
        }

        // Delete any existing OTPs for this email
        await Otp.deleteMany({ email: normalizedEmail });

        // Generate and store new OTP (valid for 5 minutes)
        const otp = generateOtp();
        await Otp.create({
            email: normalizedEmail,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        });

        // Send OTP via email
        await sendOtpEmail(normalizedEmail, otp);

        res.status(200).json({
            message: 'OTP sent successfully! Check your email.',
            email: normalizedEmail,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Verify OTP
// @route  POST /api/auth/verify-otp
// @access Public
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400);
            throw new Error('Email and OTP are required');
        }

        const normalizedEmail = email.toLowerCase().trim();

        const otpRecord = await Otp.findOne({
            email: normalizedEmail,
            otp,
            expiresAt: { $gt: new Date() }, // not expired
        });

        if (!otpRecord) {
            res.status(400);
            throw new Error('Invalid or expired OTP. Please request a new one.');
        }

        // Mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        res.status(200).json({
            message: 'Email verified successfully!',
            verified: true,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendOtp, verifyOtp };
