const {autoUpdater} = require('electron-updater');
const {XPromise} = require('js-desktop-base');

let debugUtils;
if (process.env.AREVTUR_BUILD !== 'release') {
	try { debugUtils = require('../debug/debugUtils'); } catch (e) { debugUtils = null; }
} else {
	debugUtils = null;
}

const feedConfig = debugUtils?.updateFeedConfig || {
	provider: 'github',
	owner: 'mdnpascual',
	repo: 'arevtur',
};

class Updater {
	constructor() {
		autoUpdater.autoInstallOnAppQuit = false;
		autoUpdater.fullChangelog = true;
		autoUpdater.setFeedURL(feedConfig);
		this.checkForUpdate();

		autoUpdater.on('update-available', async result => {
			if (!result.releaseNotes) {
				try {
					let fetch = require('node-fetch');
					let releaseApiUrl = debugUtils?.releaseApiUrl || 'https://api.github.com/repos/mdnpascual/arevtur/releases/latest';
					let headers = debugUtils?.releaseApiToken ? {'Authorization': `Bearer ${debugUtils.releaseApiToken}`} : {};
					let res = await fetch(releaseApiUrl, {headers});
					let json = await res.json();
					if (json.body)
						result.releaseNotes = [{version: result.version, note: json.body}];
				} catch (e) {}
			}
			this.updateCheck.resolve(result);
		});
		autoUpdater.on('update-not-available', () => {
			console.debug('Updater:: update not available');
			this.updateCheck.resolve();
		});
		this.updateReady = new Promise(resolve =>
			autoUpdater.on('update-downloaded', result => {
				console.debug('Updater:: update downloaded', result);
				resolve();
			}));
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
