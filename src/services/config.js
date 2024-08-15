const {ipcMain} = require('electron');
const fs = require('fs').promises;
const appData = require('./appData');
const Emitter = require('../util/Emitter');
const {deepMerge} = require('../util/util');
const defaultConfig = require('./defaultConfig.json');

// keeps config in sync between windows
class Config extends Emitter {
	constructor() {
		super();
		this.config = defaultConfig;
		try {
			deepMerge(this.config, require(appData.configPath));
		} catch (e) {
			// For the first run, config.json won't exist. This is expected and ok.
		}

		ipcMain.handle('config-change', async (event, newConfig) => {
			let oldConfigJson = JSON.stringify(this.config, '', 2);
			deepMerge(this.config, newConfig);
			let newConfigJson = JSON.stringify(this.config, '', 2);
			if (oldConfigJson === newConfigJson)
				return;
			this.emit('change', this.config);
			// console.log('Updated config', JSON.stringify(this.config, 2, 2));
			try {
				await fs.mkdir(appData.basePath, {recursive: true});
				await fs.writeFile(appData.configPath, newConfigJson);
			} catch (e) {
				console.error('Failed to save config', appData.configPath, e);
			}
		});

		let added = [];
		ipcMain.handle('listen-config-change', event => {
			if (added.includes(event.sender))
				return;
			added.push(event.sender);
			this.addListener('change', config => event.sender.send('config-changed', config));
			event.sender.send('config-changed', this.config);
		});
	}
}

module.exports = {config: new Config(), defaultConfig};

// todo[high] viewHorizontal & viewMaximize should use local storage, see git branch configButton
