const path = require('path');
const {app, ipcMain} = require('electron');
const ElectronWindow = require('../services/ElectronWindow');
const Updater = require('./Updater');

let windowWrapper = new ElectronWindow(`Check for updates`, path.resolve(__dirname, 'updateCheck.html'), 400, 400);

let updater = new Updater();
updater.updateReady.then(() => windowWrapper.showView());

ipcMain.handle('update-check', (event, arg) => {
	switch (arg) {
		case 'request-current-version':
			return app.getVersion()
			break;
		case 'request-check-updates':
			return updater.checkForUpdate()
			break;
		case 'request-update':
			updater.updateAndRestart()
			break;
		default:
			console.error('Unknown window message:', arg);
	}
})

module.exports = windowWrapper;
