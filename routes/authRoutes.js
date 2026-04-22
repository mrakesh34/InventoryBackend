const express = require('express');
const router = express.Router();

const { signup, login, getMe } = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected route
router.get('/me', protect, getMe);

module.exports = router;
