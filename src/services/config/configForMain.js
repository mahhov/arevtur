const {ipcMain} = require('electron');
const fs = require('fs').promises;
const appData = require('../appData');
const Emitter = require('../../util/Emitter');
const {deepMerge, randId} = require('../../util/util');
const defaultConfig = require('./defaultConfig.json');

// keeps config in sync between windows
class ConfigForMain extends Emitter {
	constructor() {
		super();
		this.config = defaultConfig;
		try {
			deepMerge(this.config, require(appData.configPath));
		} catch (e) {
			console.warn('config loading', e);
			// for the first run, config.json won't exist
		}
		// Initialize userId for first run. Used for google analytics and for PoE trade API for the
		// User-Agent header.
		if (!this.config.userId)
			this.updateConfig({userId: String(randId())});

		ipcMain.handle('config-change', (event, newConfig) => this.updateConfig(newConfig));

		let added = [];
		ipcMain.handle('listen-config-change', event => {
			if (!added.includes(event.sender)) {
				added.push(event.sender);
				this.addListener('change', config => event.sender.send('config-changed', config));
			}
			event.sender.send('config-changed', this.config);
		});
	}

	async updateConfig(newConfig) {
		let oldConfigJson = JSON.stringify(this.config, null, 2);
		deepMerge(this.config, newConfig);
		let newConfigJson = JSON.stringify(this.config, null, 2);
		if (oldConfigJson === newConfigJson)
			return;
		this.emit('change', this.config);
		// console.log('Updated config', JSON.stringify(this.config, null, 2));
		try {
			await fs.mkdir(appData.basePath, {recursive: true});
			await fs.writeFile(appData.configPath, newConfigJson);
		} catch (e) {
			console.error('Failed to save config', appData.configPath, e);
		}
	}
}

module.exports = new ConfigForMain();

// todo[medium] viewHorizontal & viewMaximize should use local storage, see git branch configButton
