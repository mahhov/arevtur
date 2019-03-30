const path = require('path');
const {ViewHandle, ScreenMouse} = require('js-desktop-base');
const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');

const WIDTH = 300, HEIGHT_BASE = 20, HEIGHT_PER_LINE = 20;

class PoePricerViewHandle extends ViewHandle {
	constructor() {
		super({
			frame: false,
			thickFrame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			focusable: false,
			show: false,
			webPreferences: {nodeIntegration: true}
		}, path.join(__dirname, './view/View.html'));
	}

	async moveToMouse() {
		let mouse = await ScreenMouse.getMouse();
		this.move(mouse.x, mouse.y);
	}

	async showTexts(texts, duration) {
		this.send({name: 'setTexts', texts});
		this.resize(WIDTH, HEIGHT_BASE + HEIGHT_PER_LINE * texts.length);
		await this.validateOnScreen();
		this.show(duration);
	}
}

module.exports = PoePricerViewHandle;
