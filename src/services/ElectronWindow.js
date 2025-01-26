const {app, BrowserWindow} = require('electron');
const {appReadyPromise} = require('js-desktop-base');
const {iconPath} = require('../util/util');

// workaround for electron bug
// https://github.com/electron/electron/issues/22119
app.allowRendererProcessReuse = false;

class ElectronWindow {
	constructor(name, htmlPath, width, height, exitOnClose = false) {
		this.name = name;

		this.window = appReadyPromise.then(() => {
			let window = new BrowserWindow({
				title: `${name} - ${app.getVersion()}`,
				icon: iconPath,
				width,
				height,
				show: false,
				webPreferences: {
					nodeIntegration: true,
					contextIsolation: false,
				},
			});

			window.setMenu(null);
			window.loadFile(htmlPath);

			window.on('close', e => {
				if (exitOnClose)
					app.exit();
				else {
					e.preventDefault();
					window.hide();
				}
			});

			return window;
		});
	}

	get trayOptions() {
		return [{label: `${this.name}`, click: () => this.showView()}];
	}

	async showView() {
		(await this.window).show();
	}

	async showDevTools() {
		(await this.window).webContents.openDevTools();
	}
}

module.exports = ElectronWindow;
