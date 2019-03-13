const {app} = require('electron');

module.exports = new Promise(resolve => app.on('ready', resolve));
