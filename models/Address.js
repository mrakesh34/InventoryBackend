const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        street: {
            type: String,   // Flat/House No, Building, Street, Locality
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
            type: String,   // PIN Code (6 digits for India)
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
            default: 'India',
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },

    },
    {
        timestamps: true,
    }
);

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
