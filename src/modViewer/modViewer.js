const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');

let window = new ElectronWindow('Mod Viewer', path.resolve(__dirname, 'modViewer.html'));

module.exports = {trayOptions: window.trayOptions};
