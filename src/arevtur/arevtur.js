const path = require('path');
const {ipcMain, dialog} = require('electron');
const ElectronWindow = require('../services/ElectronWindow');

let window = new ElectronWindow('Arevtur', path.resolve(__dirname, 'arevtur.html'));

ipcMain.handle('open-dialog', async (event, arg) =>
	dialog.showOpenDialog(await window.window, arg));


module.exports = {trayOptions: window.trayOptions};
