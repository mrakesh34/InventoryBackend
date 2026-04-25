const mongoose = require('mongoose');
const Wishlist = require('./models/Wishlist');
const User = require('./models/User');
const Book = require('./models/Book');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const email = 'fakerrt6374@gmail.com';
        const bookId = '69ebbeae9879792032c69e17'; // from the screenshot URL

        // Verify the user exists
        const user = await User.findOne({ email });
        console.log('User found:', !!user);

        // Try exactly what the controller does
        let wishlist = await Wishlist.findOne({ user: email });
        console.log('Wishlist found before toggle:', !!wishlist);

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: email, books: [bookId] });
            console.log('Wishlist created successfully.');
        } else {
            const idx = wishlist.books.findIndex(id => id.toString() === bookId);
            if (idx === -1) {
                wishlist.books.push(bookId);
                await wishlist.save();
                console.log('Book added to wishlist array.');
            } else {
                wishlist.books.splice(idx, 1);
                await wishlist.save();
                console.log('Book removed from wishlist array.');
            }
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    }
    process.exit(0);
});
