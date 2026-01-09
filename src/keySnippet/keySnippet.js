const {ipcMain, screen} = require('electron');
const path = require('path');
const ElectronWindow = require('../services/ElectronWindow');

let windowWrapper = new ElectronWindow('', path.resolve(__dirname, 'keySnippet.html'), 400, 400, false, {
	frame: false,
	thickFrame: false,
	alwaysOnTop: true,
	skipTaskbar: true,
	webPreferences: {
		nodeIntegration: true,
		contextIsolation: false,
		backgroundThrottling: false,
	},
});

windowWrapper.window.then(window => window.setAlwaysOnTop(true, 'screen-saver'));

let hideInterval;
ipcMain.handle('key-snippet', async (event, arg) => {
	console.debug('keySnippet received ipc:', arg);
	let window = await windowWrapper.window;
	switch (arg) {
		case 'show':
			window.show();
			// todo[high] size to fit contents
			let width = 400;
			let height = 400;
			let mouse = screen.getCursorScreenPoint();
			let bounds = screen.getPrimaryDisplay().bounds;
			let x = Math.min(mouse.x + 5, bounds.x + bounds.width - width);
			let y = Math.min(mouse.y + 5, bounds.y + bounds.height - height);
			window.setBounds({x, y, width, height});
			console.debug('keySnippet show', x, y, width, height);
			clearInterval(hideInterval);
			if (!window.webContents.isDevToolsOpened())
				hideInterval = setTimeout(async () => window.hide(), 3000);
			break;
		case 'close':
			clearInterval(hideInterval);
			window.hide();
			break;
		case 'prevent-close':
			clearInterval(hideInterval);
			break;
		default:
			console.error('Unknown window message:', arg);
	}
});

module.exports = windowWrapper;
