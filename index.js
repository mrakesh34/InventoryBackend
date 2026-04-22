require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { seedAdminUser } = require('./controllers/authController');

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB then seed admin
connectDB().then(() => {
    seedAdminUser();
});

// ─── Global Middleware ────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'https://inventory-clinet.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Book Store API is running 🚀', version: '3.0.0' });
});

const cartRoutes         = require('./routes/cartRoutes');
const addressRoutes      = require('./routes/addressRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const userRoutes         = require('./routes/userRoutes');
const stockActivityRoutes = require('./routes/stockActivityRoutes');
const uploadRoutes       = require('./routes/uploadRoutes');
const vendorRoutes       = require('./routes/vendorRoutes');
const wishlistRoutes     = require('./routes/wishlistRoutes');
const analyticsRoutes    = require('./routes/analyticsRoutes');
const waitlistRoutes     = require('./routes/waitlistRoutes');
const settlementRoutes   = require('./routes/settlementRoutes');

app.use('/api/books',          bookRoutes);
app.use('/api/auth',           authRoutes);
app.use('/api/cart',           cartRoutes);
app.use('/api/addresses',      addressRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/stock-activity', stockActivityRoutes);
app.use('/api/upload',         uploadRoutes);
app.use('/api/vendor',         vendorRoutes);
app.use('/api/wishlist',       wishlistRoutes);
app.use('/api/analytics',      analyticsRoutes);
app.use('/api/waitlist',       waitlistRoutes);
app.use('/api/settlements',    settlementRoutes);


// ─── Error Handling Middleware (must be last) ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(port, () => {
    console.log(`📚 Book Store Server running on port ${port}`);
});