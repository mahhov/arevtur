const path = require('path');
const {app, ipcMain} = require('electron');
const ElectronWindow = require('../services/ElectronWindow');
const Updater = require('./Updater');

let updater = new Updater();

ipcMain.handle('request-current-version', () => app.getVersion());
ipcMain.handle('request-check-updates', () => updater.checkForUpdate());
ipcMain.handle('request-update', () => updater.updateAndRestart());

let window = new ElectronWindow(`Check for updates (v${app.getVersion()})`, path.resolve(__dirname, 'updateCheck.html'));

module.exports = window;
