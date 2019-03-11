const {app, BrowserWindow, ipcMain: ipc, Menu} = require('electron');
const appReadyPromise = require('./appReadyPromise');

class ViewHandle {
	timedHide;

	async init(selectListener) {
		await appReadyPromise;

		this.window = new BrowserWindow({
			width: 500,
			height: 450,
			frame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			show: false,
			webPreferences: {nodeIntegration: true}
		});
		this.window.loadFile('./src/view/View.html')
			.catch(e => console.log('error loading window html:', e));
		// this.window.webContents.openDevTools();

		ipc.on('window-request', (_, request) => {
			switch (request.name) {
				case 'close':
					this.window.minimize();
					if (request.selected && selectListener)
						selectListener(request.selected);
					break;
				default:
					console.error('Unknown window request:', request);
			}
		});

		app.on('browser-window-blur', () => this.window.hide());
	}

	sendText(text) {
		this.send({name: 'addText', text});
	}

	// if duration is falsy, will not auto-hide
	show(duration) {
		this.send({name: 'open'});

		clearInterval(this.timedHide);
		this.window.show();
		if (duration)
			this.timedHide = setTimeout(() => this.window.hide(), duration);
	}

	get visible() {
		return this.window.isVisible();
	}

	send(message) {
		this.window.webContents.send('window-command', message);
	}
}

module.exports = ViewHandle;
