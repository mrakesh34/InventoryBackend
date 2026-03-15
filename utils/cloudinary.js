const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine the resource_type and folder based on the file type
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: isPdf ? 'book_pdfs' : 'book_covers',
      resource_type: isPdf ? 'raw' : 'image',
      chunk_size: 50 * 1024 * 1024,
      public_id: file.originalname.split('.')[0] + '-' + Date.now(), // Unique filename
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
