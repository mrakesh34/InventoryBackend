const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: String, // Storing email as user identifier
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        street: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        zip: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
            default: 'US',
        },
        phone: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
