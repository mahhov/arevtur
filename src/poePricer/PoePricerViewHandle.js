const path = require('path');
const {ViewHandle, ScreenMouse} = require('js-desktop-base');
const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');
const appData = require('./misc/appData');

const WIDTH = 300, HEIGHT_BASE = 20, HEIGHT_PER_LINE = 20;

class PoePricerViewHandle extends ViewHandle {
	constructor() {
		super({
			frame: false,
			thickFrame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			focusable: true,
			show: false,
			webPreferences: {nodeIntegration: true}
		}, path.join(__dirname, './view/View.html'));
	}

	onMessage(message) {
		switch (message.name) {
			case 'close':
				this.hide();
				break;
			case 'saveConfig':
				appData.saveConfig(message.config);
				break;
			default:
				console.error('Unknown window message:', message);
		}
	}

	async moveToMouse() {
		let mouse = await ScreenMouse.getMouse();
		await this.move(mouse.x, mouse.y);
	}

	async showTexts(texts, duration) {
		this.send({name: 'setTexts', texts});
		await this.show(duration);
		await this.resize(WIDTH, HEIGHT_BASE + HEIGHT_PER_LINE * texts.length);
		await this.moveToMouse();
		await this.validateOnScreen();
	}

	async showPreferences() {
		this.send({name: 'showPreferences'});
		await this.show();
		await this.resize(WIDTH, HEIGHT_BASE + HEIGHT_PER_LINE * 5);
		await this.moveToMouse();
		await this.validateOnScreen();
	}
}

module.exports = PoePricerViewHandle;
