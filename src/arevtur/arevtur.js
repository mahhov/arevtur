const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');

let window = new ElectronWindow('Arevtur', path.resolve(__dirname, 'arevtur.html'));

module.exports = {trayOptions: window.trayOptions};
