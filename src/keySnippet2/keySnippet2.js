const {ipcMain} = require('electron');
const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');

let windowPromise = new ElectronWindow('keySnippet', path.resolve(__dirname, 'keySnippet2.html'), 400, 400, false, {
	frame: false,
	thickFrame: false,
	skipTaskbar: true,
	alwaysOnTop: true,
});

let hideInterval;
ipcMain.handle('key-snippet', async (event, arg) => {
	let window = await windowPromise.window;
	switch (arg) {
		case 'show':
			window.show();
			window.focus();
			clearInterval(hideInterval);
			hideInterval = setTimeout(async () => window.hide(), 3000);
			break;
		case 'close':
			if (!window.webContents.isDevToolsOpened())
				window.hide();
			break;
		case 'prevent-close':
			clearInterval(hideInterval);
			break;
		default:
			console.error('Unknown window message:', arg);
	}
});

module.exports = windowPromise;
