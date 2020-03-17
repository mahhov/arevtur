const path = require('path');
const {TrayHelper} = require('js-desktop-base');
const keySnippet = require('./keySnippets/keySnippets');
const arevtur = require('./arevtur/arevtur');

keySnippet.init();

let trayIcon = path.join(__dirname, '../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer', [
	...keySnippet.trayOptions,
	...arevtur.trayOptions,
]);
