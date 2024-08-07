const path = require('path');
const {ipcMain, dialog} = require('electron');
const ElectronWindow = require('../services/ElectronWindow');
const appData = require('../services/appData');

let window = new ElectronWindow('Arevtur', path.resolve(__dirname, 'arevtur.html'));
window.showView();
if (appData.isDev)
	window.showDevTools();

// todo this should be made generic for all windows
ipcMain.handle('open-dialog', async (event, arg) =>
	dialog.showOpenDialog(await window.window, arg));

module.exports = window;
