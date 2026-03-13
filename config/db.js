const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            "mongodb+srv://djdahibara_db_user:maku123@cluster0.jseyyuy.mongodb.net/BookInventory"
        );
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);

    }
};

module.exports = connectDB;
