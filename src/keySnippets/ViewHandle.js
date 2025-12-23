const path = require('path');
const {ViewHandle: ViewHandleBase, ScreenMouse} = require('js-desktop-base');
const pobApi = require('../services/pobApi/pobApi');

class ViewHandle extends ViewHandleBase {
	constructor() {
		super({
			frame: false,
			thickFrame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			focusable: true,
			show: false,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
		}, path.join(__dirname, './View.html'));

		this.window.then(window => {
			window.setAlwaysOnTop(true, 'normal');
			window.on('close', e => {
				e.preventDefault();
				window.hide();
			});
		});
	}

	onMessage(message) {
		switch (message.name) {
			case 'close':
				this.hide();
				break;
			case 'size':
				this.resize(600, message.height);
				break;
			default:
				console.error('Unknown window message:', message);
		}
	}

	async showDevOptions() {
		await this.show();
		let numLines = 5;
		await this.resize(300, Math.ceil(22.17 + 18.27 * numLines));
		let mouse = await ScreenMouse.getMouse();
		await this.move(mouse.x, mouse.y);
		await this.validateOnScreen();
	}
}

module.exports = ViewHandle;
