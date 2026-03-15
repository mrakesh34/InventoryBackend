const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: String, // Storing email as user identifier to match the current simple auth
        required: true,
        unique: true
    },
    items: [cartItemSchema]
}, { timestamps: true });

// Calculate total cart value before sending response
cartSchema.methods.calculateTotal = function(booksMap) {
    let total = 0;
    this.items.forEach(item => {
        const bookPrice = booksMap[item.book.toString()] || 0;
        total += bookPrice * item.quantity;
    });
    return total;
};

module.exports = mongoose.model('Cart', cartSchema);
