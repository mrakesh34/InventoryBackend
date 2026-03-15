require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Book Store API is running 🚀', version: '2.0.0' });
});

const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const stockActivityRoutes = require('./routes/stockActivityRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock-activity', stockActivityRoutes);
app.use('/api/upload', uploadRoutes);

// ─── Error Handling Middleware (must be last) ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`📚 Book Store Server running on port ${port}`);
});