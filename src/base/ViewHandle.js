const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');
const appReadyPromise = require('../base/appReadyPromise');

class ViewHandle {
	timedHide;

	constructor(windowOptions, windowHtml) {
		this.windowOptions = windowOptions;
		this.windowHtml = windowHtml;
	}

	async init() {
		await appReadyPromise;

		this.window = new BrowserWindow(this.windowOptions);
		window.loadFile(this.windowHtml)
			.catch(e => console.log('error loading window html:', e));

		ipc.on('window-request', (_, request) => {
			switch (request.name) {
				case 'close':
					this.hide();
					this.onClose(request);
					break;
				default:
					console.error('Unknown window request:', request);
			}
		});

		app.on('browser-window-blur', () => this.window.hide());
	}

	onClose(request) {
		/* override */
	}

	sendText(text) {
		this.send({name: 'addText', text});
	}
}

module.exports = ViewHandle;
