const path = require('path');
const ViewHandle = require('../base/ViewHandle');
const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');
const appReadyPromise = require('../base/appReadyPromise');

const WIDTH = 300, HEIGHT_PER_LINE = 20;

class PoePricerViewHandle extends ViewHandle {
	constructor() {
		super({
			frame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			show: false,
			webPreferences: {nodeIntegration: true}
		}, path.join(__dirname, './view/View.html'));
	}

	showTexts(texts) {
		this.send({name: 'setTexts', texts});
		this.resize(WIDTH, HEIGHT_PER_LINE * texts.length);
		this.show(3000);
	}
}

module.exports = PoePricerViewHandle;
