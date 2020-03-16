const path = require('path');
const {TrayHelper} = require('js-desktop-base');
const keySnippet = require('./keySnippets/keySnippets');

keySnippet.init();

let trayIcon = path.resolve('./resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer', [
	...keySnippet.trayOptions,
]);
