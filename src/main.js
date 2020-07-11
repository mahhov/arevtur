const path = require('path');
const {TrayHelper} = require('js-desktop-base');
const keySnippet = require('./keySnippets/keySnippets');
const arevtur = require('./arevtur/arevtur');
 const modViewer = require('./modViewer/modViewer');

keySnippet.init();

let trayIcon = path.join(__dirname, '../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer', [
	...keySnippet.trayOptions,
	...arevtur.trayOptions,
	...modViewer.trayOptions,
]);
