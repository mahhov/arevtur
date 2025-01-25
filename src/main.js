const fs = require('fs').promises;
const {app} = require('electron');
const {TrayHelper} = require('js-desktop-base');
const appData = require('./services/appData');
const keySnippet = require('./keySnippets/keySnippets');
const googleAnalyticsForMain = require('./services/googleAnalytics/googleAnalyticsForMain');
require('./services/logWatcher');
const {iconPath} = require('./util/util');

googleAnalyticsForMain.emitStartup();

let windows = [
	require('./updateCheck/updateCheck'),
	require('./arevtur/arevtur'),
];

TrayHelper.createExitTray(iconPath, 'Arevtur', [
	...keySnippet.trayOptions,
	...windows.flatMap(w => w.trayOptions),
	{type: 'separator'},
	{label: `Dev console`, click: () => windows.forEach(w => w.showDevTools())},
	appData.isDev && {
		label: `Clear all data and exit`, click: async () => {
			await Promise.all(windows.map(async w =>
				(await w.window).webContents.session.clearStorageData()));
			await fs.unlink(appData.configPath);
			app.exit();
		},
	},
].filter(v => v));
