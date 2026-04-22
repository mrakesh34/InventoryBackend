const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAllUsers, getMe, updateMe } = require('../controllers/userController');

// Current user
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

// Admin: get all users
router.get('/', protect, adminOnly, getAllUsers);

module.exports = router;
