const path = require('path');
const ViewHandle = require('../base/ViewHandle');
const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');
const appReadyPromise = require('../base/appReadyPromise');

class ClipboardManagerViewHandle extends ViewHandle {
	constructor() {
		super({
			width: 500,
			height: 450,
			frame: false,
			thickFrame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			show: false,
			webPreferences: {nodeIntegration: true}
		}, path.join(__dirname, './view/View.html'));
	}

	addSelectListener(selectListener) {
		this.selectListener = selectListener;
	}

	onClose(request) {
		if (request.selected && this.selectListener)
			this.selectListener(request.selected);
	}

	sendText(text) {
		this.send({name: 'addText', text});
	}
}

module.exports = ClipboardManagerViewHandle;
