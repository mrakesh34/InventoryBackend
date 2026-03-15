const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAddresses, addAddress } = require('../controllers/addressController');

router.route('/')
    .get(protect, getAddresses)
    .post(protect, addAddress);

module.exports = router;
