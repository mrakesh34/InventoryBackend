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
            enum: ['Fiction', 'Science', 'History', 'Programming', 'Business', 'Biography', 'Self-Help', 'Other'],
            default: 'Other',
        },
        bookDescription: {
            type: String,
            required: [true, 'Book description is required'],
        },
        bookPDFURL: {
            type: String,
            required: [true, 'Book PDF URL is required'],
        },
        price: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
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
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
