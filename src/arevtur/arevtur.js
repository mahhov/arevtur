const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');
const appData = require('../services/appData');

let windowWrapper = new ElectronWindow('Arevtur', path.resolve(__dirname, 'arevtur.html'), 10000, 10000, true);
windowWrapper.showView();
if (appData.isDev)
	windowWrapper.showDevTools();

module.exports = windowWrapper;
