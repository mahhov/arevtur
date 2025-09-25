const {ipcMain, screen} = require('electron');
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
			// todo[blocking] size to fit contents
			let width = 400;
			let height = 400;
			let mouse = screen.getCursorScreenPoint();
			let bounds = screen.getPrimaryDisplay().bounds;
			let x = Math.min(mouse.x, bounds.x + bounds.width - width);
			let y = Math.min(mouse.y, bounds.y + bounds.height - height);
			window.setBounds({x, y, width, height});
			window.show();
			window.focus();
			clearInterval(hideInterval);
			if (!window.webContents.isDevToolsOpened())
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
