const mongoose = require('mongoose');

const stockActivitySchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        bookTitle: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['stock_in', 'stock_out'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        stockBefore: {
            type: Number,
            required: true,
        },
        stockAfter: {
            type: Number,
            required: true,
        },
        performedBy: {
            type: String,
            required: true,
        },
        note: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const StockActivity = mongoose.model('StockActivity', stockActivitySchema);
module.exports = StockActivity;
