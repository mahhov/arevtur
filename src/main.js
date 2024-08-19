const path = require('path');
const {TrayHelper} = require('js-desktop-base');
const keySnippet = require('./keySnippets/keySnippets');
let googleAnalytics = require('./services/googleAnalytics');

googleAnalytics.emitStartup();

let windows = [
	require('./updateCheck/updateCheck'),
	require('./arevtur/arevtur'),
];

let trayIcon = path.join(__dirname, '../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Arevtur', [
	...keySnippet.trayOptions,
	...windows.flatMap(w => w.trayOptions),
	{type: 'separator'},
	{label: `Dev console`, click: () => windows.forEach(w => w.showDevTools())},
]);
