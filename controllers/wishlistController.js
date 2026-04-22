const Wishlist = require('../models/Wishlist');

const getEmail = (req) => req.user?.email || req.user?.userEmail || req.user?._id;

// GET /api/wishlist  — get user's full wishlist (populated)
const getWishlist = async (req, res, next) => {
    try {
        const email = getEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });

        const wishlist = await Wishlist.findOne({ user: email }).populate('books');
        res.status(200).json(wishlist ? wishlist.books : []);
    } catch (err) { next(err); }
};

// POST /api/wishlist/:bookId  — toggle (add if absent, remove if present)
const toggleWishlist = async (req, res, next) => {
    try {
        const email  = getEmail(req);
        if (!email) return res.status(401).json({ error: 'Unauthorized' });
        const { bookId } = req.params;

        let wishlist = await Wishlist.findOne({ user: email });
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: email, books: [bookId] });
            return res.status(200).json({ added: true, message: 'Added to wishlist' });
        }

        const idx = wishlist.books.findIndex(id => id.toString() === bookId);
        if (idx === -1) {
            wishlist.books.push(bookId);
            await wishlist.save();
            return res.status(200).json({ added: true,  message: 'Added to wishlist' });
        } else {
            wishlist.books.splice(idx, 1);
            await wishlist.save();
            return res.status(200).json({ added: false, message: 'Removed from wishlist' });
        }
    } catch (err) { next(err); }
};

// GET /api/wishlist/check/:bookId  — true/false
const checkWishlist = async (req, res, next) => {
    try {
        const email = getEmail(req);
        if (!email) return res.status(200).json({ wishlisted: false });
        const wishlist = await Wishlist.findOne({ user: email });
        const wishlisted = wishlist?.books?.some(id => id.toString() === req.params.bookId) ?? false;
        res.status(200).json({ wishlisted });
    } catch (err) { next(err); }
};

module.exports = { getWishlist, toggleWishlist, checkWishlist };
