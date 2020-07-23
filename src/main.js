const path = require('path');
require('./services/config');
const {TrayHelper} = require('js-desktop-base');
const {version} = require('../package.json');
const keySnippet = require('./keySnippets/keySnippets');
let windows = [
	require('./arevtur/arevtur'),
	require('./modViewer/modViewer')];

keySnippet.init();

let trayIcon = path.join(__dirname, '../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer', [
	{label: `Current version ${version}`, enabled: false},
	...keySnippet.trayOptions,
	...windows.flatMap(w => w.trayOptions),
	{label: `Dev`, click: () => windows.forEach(w => w.showDevTools())},
]);
