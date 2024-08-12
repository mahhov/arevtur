const path = require('path');
const {TrayHelper} = require('js-desktop-base');
require('./services/config');
const keySnippet = require('./keySnippets/keySnippets');
let windows = [
	// todo[blocking] this doesn't seem to be working on linux. does it work on windows?
	require('./updateCheck/updateCheck'),
	require('./arevtur/arevtur'),
	// require('./modViewer/modViewer'), // todo[low] either remove or get it working
];

let trayIcon = path.join(__dirname, '../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Arevtur', [
	...keySnippet.trayOptions,
	...windows.flatMap(w => w.trayOptions),
	{type: 'separator'},
	{label: `Dev console`, click: () => windows.forEach(w => w.showDevTools())},
]);
