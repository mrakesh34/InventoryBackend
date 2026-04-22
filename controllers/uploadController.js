const { cloudinary } = require('../utils/cloudinary');
const streamifier = require('streamifier');

// Helper to stream upload to Cloudinary
const streamUpload = (buffer, options) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// @desc    Upload multiple files (image and pdf) to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
const uploadFiles = async (req, res, next) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: 'No files were uploaded.' });
        }

        const uploadedData = {};

        // 1. Upload Image Buffer
        if (req.files.image && req.files.image[0]) {
            const imageFile = req.files.image[0];
            const result = await streamUpload(imageFile.buffer, {
                folder: 'book_covers',
                resource_type: 'image',
                public_id: imageFile.originalname.split('.')[0] + '-' + Date.now()
            });
            uploadedData.imageURL = result.secure_url;
        }

        // 2. Upload PDF Buffer
        if (req.files.pdf && req.files.pdf[0]) {
            const pdfFile = req.files.pdf[0];
            const result = await streamUpload(pdfFile.buffer, {
                folder: 'book_pdfs',
                resource_type: 'raw', // Must be raw for PDFs
                public_id: pdfFile.originalname.split('.')[0] + '-' + Date.now()
            });
            uploadedData.bookPDFURL = result.secure_url;
        }

        // 3. Upload Gallery Images (optional, up to 5)
        if (req.files.gallery && req.files.gallery.length > 0) {
            const galleryURLs = await Promise.all(
                req.files.gallery.map(file =>
                    streamUpload(file.buffer, {
                        folder: 'book_gallery',
                        resource_type: 'image',
                        public_id: file.originalname.split('.')[0] + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                    }).then(r => r.secure_url)
                )
            );
            uploadedData.galleryImages = galleryURLs;
        }

        res.status(200).json(uploadedData);
    } catch (error) {
        console.error('Stream Upload Error:', error);
        next(error);
    }
};

module.exports = {
    uploadFiles,
};
