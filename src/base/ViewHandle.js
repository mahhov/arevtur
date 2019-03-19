const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');
const appReadyPromise = require('./appReadyPromise');
const ScreenMouse = require('../base/ScreenMouse');

class ViewHandle {
	timedHide;

	constructor(windowOptions, windowHtml) {
		this.windowOptions = windowOptions;
		this.windowHtml = windowHtml;
		this.initPromise = this.init();
	}

	async init() {
		await appReadyPromise;

		this.window = new BrowserWindow(this.windowOptions);
		let initPromise = this.window.loadFile(this.windowHtml)
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

		return initPromise;
	}

	resize(width, height) {
		this.width = width;
		this.height = height;
		this.window.setSize(width, height);
	}

	move(x, y) {
		this.x = x;
		this.y = y;
		this.window.setPosition(x, y);
	}

	async validateOnScreen() {
		let screenBounds = await ScreenMouse.getScreenBounds();

		let x = Math.min(this.x, screenBounds.x + screenBounds.width - this.width);
		let y = Math.min(this.y, screenBounds.y + screenBounds.height - this.height);

		this.move(x, y);
	}

	onClose(request) {
		/* override */
	}

	// if duration is falsy, will not auto-hide
	show(duration) {
		this.send({name: 'open'});
		clearInterval(this.timedHide);
		this.window.show();
		this.window.restore();
		if (duration)
			this.timedHide = setTimeout(this.hide.bind(this), duration);
	}

	hide() {
		this.window.minimize();
		this.window.hide();
	}

	get visible() {

		return this.window.isVisible();
	}

	async send(message) {
		await this.initPromise;
		this.window.webContents.send('window-command', message);
	}
}

module.exports = ViewHandle;
