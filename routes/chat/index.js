const registerPost = require('./post');
const registerGet = require('./get.js');
const registerDelete = require('./delete.js');
module.exports = async function(app) {
    await registerPost(app);
    await registerGet(app);
    await registerDelete(app);
}