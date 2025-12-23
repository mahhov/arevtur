const fs = require('fs').promises;
const {app, ipcMain, dialog} = require('electron');
const {TrayHelper} = require('js-desktop-base');
const appData = require('./services/appData');
const googleAnalyticsForMain = require('./services/googleAnalytics/googleAnalyticsForMain');
require('./services/logWatcher');
const {iconPath} = require('./util/util');

googleAnalyticsForMain.emitStartup();

ipcMain.handle('open-dialog', async (event, arg) =>
	dialog.showOpenDialog(arg));

let windowWrappers = [
	require('./updateCheck/updateCheck'),
	require('./arevtur/arevtur'),
	require('./keySnippet/keySnippet'),
	require('./devOptions/devOptions'),
].filter(v => v);

TrayHelper.createExitTray(iconPath, 'Arevtur', [
	...windowWrappers.flatMap(w => w.trayOptions),
	{type: 'separator'},
	{label: `Dev console`, click: () => windowWrappers.forEach(w => w.showDevTools())},
	appData.isDev && {
		label: `Clear all data and exit`, click: async () => {
			await Promise.all(windowWrappers.map(async w =>
				(await w.window).webContents.session.clearStorageData()));
			await fs.unlink(appData.configPath);
			app.exit();
		},
	},
].filter(v => v));
