require('dotenv').config();
const { cloudinary } = require('./utils/cloudinary');

async function test() {
    try {
        const res = await cloudinary.uploader.upload('package.json', { resource_type: 'raw' });
        console.log('Success!', res);
    } catch(err) {
        console.error('CLOUDINARY ERROR:', err);
    }
}
test();
