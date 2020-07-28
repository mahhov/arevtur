const path = require('path');
const {app, ipcMain} = require('electron');
const ElectronWindow = require('../services/ElectronWindow');
const Updater = require('./Updater');

let updater = new Updater();
updater.updateReady.then(() => window.showView());

ipcMain.handle('request-current-version', () => app.getVersion());
ipcMain.handle('request-check-updates', () => updater.checkForUpdate());
ipcMain.handle('request-update', () => updater.updateAndRestart());

let window = new ElectronWindow(`Check for updates`, path.resolve(__dirname, 'updateCheck.html'), 400, 400);

module.exports = window;
