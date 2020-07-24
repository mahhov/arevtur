const {app} = require('electron');
const {autoUpdater} = require("electron-updater");
const logger = require("electron-log");
const {XPromise} = require('js-desktop-base');

class Updater {
	constructor() {
		logger.info('Running version', app.getVersion());

		autoUpdater.logger = logger;
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.fullChangelog = true
		this.checkForUpdate();

		autoUpdater.on('update-available', result => {
			logger.info('update-available', result);
			this.updateCheck.resolve(result);
		});
		autoUpdater.on('update-not-available', result => {
			logger.info('update-not-available', result);
			this.updateCheck.resolve();
		});
		this.updateReady = new Promise(resolve =>
			autoUpdater.on('update-downloaded', result => {
				logger.info('update-downloaded', result);
				resolve();
			}));
	}

	async checkForUpdate() {
		if (!this.updateCheck || this.updateCheck.done) {
			logger.info('checking for update x');
			autoUpdater.checkForUpdates().then(result =>
				logger.info('  check for update', result));
			this.updateCheck = new XPromise();
		}
		return this.updateCheck;
	}

	async updateAndRestart() {
		logger.info('updating and restarting')
		await this.updateReady;
		autoUpdater.quitAndInstall();
	}
}

module.exports = Updater;
