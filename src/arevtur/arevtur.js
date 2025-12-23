const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');
const appData = require('../services/appData');
const {ipcMain} = require('electron');
let keySnippetWindowWrapper = require('../keySnippet/keySnippet');

let windowWrapper = new ElectronWindow('Arevtur', path.resolve(__dirname, 'arevtur.html'), 10000, 10000, true);
windowWrapper.showView();
if (appData.isDev)
	windowWrapper.showDevTools();

ipcMain.handle('arevtur', async (event, arg) => {
	switch (arg) {
		case 'restart-pob':
			(await keySnippetWindowWrapper.window).webContents.send('restart-pob');
			break;
		default:
			console.error('Unknown window message:', arg);
	}
});

module.exports = windowWrapper;
