const {app, BrowserWindow} = require('electron');
const {appReadyPromise} = require('js-desktop-base');

// workaround for electron bug
// https://github.com/electron/electron/issues/22119
app.allowRendererProcessReuse = false;

class ElectronWindow {
	constructor(name, htmlPath, width = 1800, height = 1000) {
		this.name = name;

		this.window = appReadyPromise.then(() => {
			let window = new BrowserWindow({
				title: `${name} - ${app.getVersion()}`,
				width,
				height,
				show: false,
				webPreferences: {nodeIntegration: true},
			});
			window.setMenu(null);
			window.loadFile(htmlPath);

			window.on('close', e => {
				e.preventDefault();
				window.hide();
			});

			return window;
		});
	}

	async showView() {
		(await this.window).show();
	}

	async showDevTools() {
		(await this.window).webContents.openDevTools();
	}

	get trayOptions() {
		return [
			{label: `${this.name}`, click: () => this.showView()},
		];
	}
}

module.exports = ElectronWindow;
