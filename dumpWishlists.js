const mongoose = require('mongoose');
const Wishlist = require('./models/Wishlist');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const wishlists = await Wishlist.find({});
        console.log(`Found ${wishlists.length} wishlists.`);
        for (const w of wishlists) {
            console.log(`User: ${w.user}, Books:`, w.books);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
