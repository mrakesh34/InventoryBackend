const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAddresses, addAddress, updateAddress, deleteAddress, setDefault } = require('../controllers/addressController');

router.route('/')
    .get(protect, getAddresses)
    .post(protect, addAddress);

router.route('/:id')
    .patch(protect, updateAddress)
    .delete(protect, deleteAddress);

router.patch('/:id/set-default', protect, setDefault);

module.exports = router;
