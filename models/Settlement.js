const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vendorName: { type: String, default: '' },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        period: {
            type: String,       // e.g. "2026-04"
            required: true,
        },
        note: { type: String, default: '' },
        settledBy: { type: String, default: '' },  // admin email
        settledAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Settlement = mongoose.model('Settlement', settlementSchema);
module.exports = Settlement;
