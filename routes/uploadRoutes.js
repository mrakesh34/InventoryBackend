const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFiles } = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  }
});

// Accepts two file fields: 'image' and 'pdf'
const cpUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]);

// POST /api/upload
router.post('/', protect, adminOnly, cpUpload, uploadFiles);

module.exports = router;
