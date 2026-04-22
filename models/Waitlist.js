const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
    {
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        userName: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

// Unique: one user per book on the waitlist
waitlistSchema.index({ book: 1, userEmail: 1 }, { unique: true });

const Waitlist = mongoose.model('Waitlist', waitlistSchema);
module.exports = Waitlist;
