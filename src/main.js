const path = require('path');
const {TrayHelper} = require('js-desktop-base');
require('./services/config');
const keySnippet = require('./keySnippets/keySnippets');
let windows = [
	// require('./updateCheck/updateCheck'), // todo why is this failing
	require('./arevtur/arevtur'),
	// require('./modViewer/modViewer'), // todo either remove or get it working
];

keySnippet.init();

let trayIcon = path.join(__dirname, '../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Arevtur', [
	...keySnippet.trayOptions,
	...windows.flatMap(w => w.trayOptions),
	{type: 'separator'},
	{label: `Dev`, click: () => windows.forEach(w => w.showDevTools())},
]);
