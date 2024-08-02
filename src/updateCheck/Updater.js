const {autoUpdater} = require('electron-updater');
const {XPromise} = require('js-desktop-base');

class Updater {
	constructor() {
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.fullChangelog = true;
		this.checkForUpdate();

		autoUpdater.on('update-available', result =>
			this.updateCheck.resolve(result));
		autoUpdater.on('update-not-available', () =>
			this.updateCheck.resolve());
		this.updateReady = new Promise(resolve =>
			autoUpdater.on('update-downloaded', result => resolve()));
	}

	async checkForUpdate() {
		if (!this.updateCheck || this.updateCheck.done) {
			autoUpdater.checkForUpdates();
			this.updateCheck = new XPromise();
		}
		return this.updateCheck;
	}

	async updateAndRestart() {
		await this.updateReady;
		autoUpdater.quitAndInstall();
	}
}

module.exports = Updater;
