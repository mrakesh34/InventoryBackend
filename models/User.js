const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // never return password in queries by default
        },
        role: {
            type: String,
            enum: ['user', 'vendor', 'admin'],
            default: 'user',
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        vendorStatus: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected'],
            default: 'none',
        },
        vendorDetails: {
            businessName: { type: String, trim: true, default: '' },
            categories: { type: [String], default: [] },
            estimatedStock: { type: Number, default: 0, min: 0 },
            description: { type: String, trim: true, default: '' },
            phone: { type: String, trim: true, default: '' },
        },
    },
    {
        timestamps: true,
    }
);

// Instance method: compare passwords (hashing is done in the controller)
userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compareSync(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
