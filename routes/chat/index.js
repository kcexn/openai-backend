const registerPost = require('./post');
const registerGet = require('./get.js');
module.exports = async function(app) {
    await registerPost(app);
    await registerGet(app);
}