const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: String,   // user email, consistent with other models
            required: true,
            unique: true,
        },
        books: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book',
            }
        ],
    },
    { timestamps: true }
);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
