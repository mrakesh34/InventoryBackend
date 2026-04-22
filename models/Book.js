const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        bookTitle: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
        },
        authorName: {
            type: String,
            required: [true, 'Author name is required'],
            trim: true,
        },
        imageURL: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'Fiction', 'Non-fiction', 'Mystery', 'Programming', 'Science fiction',
                'Fantasy', 'Horror', 'Biography', 'Autobiography', 'History',
                'Self-help', 'Business', 'Memoir', 'Poetry', "Children's books",
                'Travel', 'Religion and spirituality', 'Science', 'Art and design', 'Other'
            ],
            default: 'Fiction',
        },
        bookDescription: {
            type: String,
            required: [true, 'Book description is required'],
        },
        bookPDFURL: {
            type: String,
            default: null,   // PDF is optional
        },
        price: {
            type: Number,
            default: 0,
        },
        costPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        stock: {
            type: Number,
            default: 0,
            min: 0,
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
            min: 1,
        },
        tags: {
            type: [String],
            default: [],
        },
        galleryImages: {
            type: [String],
            default: [],
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,  // null = platform book (admin-managed)
        },
    },
    {
        timestamps: true,
    }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
