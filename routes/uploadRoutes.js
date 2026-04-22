const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFiles } = require('../controllers/uploadController');
const { protect, adminOrVendor } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  }
});

// Accepts three file fields: 'image', 'pdf', and 'gallery'
const cpUpload = upload.fields([
  { name: 'image',   maxCount: 1 },
  { name: 'pdf',     maxCount: 1 },
  { name: 'gallery', maxCount: 5 },
]);

// POST /api/upload
router.post('/', protect, adminOrVendor, cpUpload, uploadFiles);

module.exports = router;
