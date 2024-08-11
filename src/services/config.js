const {ipcMain} = require('electron');
const fs = require('fs').promises;
const appData = require('./appData');
const Emitter = require('../util/Emitter');
const {deepMerge} = require('../util/util');

// keeps config in sync between windows
class Config extends Emitter {
	constructor() {
		super();
		this.config = {
			league: 'Standard',
			restrictToPoeWindow: true,
			darkTheme: true,
			// todo[high] these 2 should use local storage, see git branch configButton
			viewHorizontal: true,
			viewMaximize: false,
			buildParams: {
				pobPath: '',
				buildPath: '',
				weights: {
					life: .5,
					resist: .1,
					damage: .25,
				},
			},
		};
		try {
			deepMerge(this.config, require(appData.configPath));
		} catch (e) {
			// For the first run, config.json won't exist. This is expected and ok.
		}

		ipcMain.handle('config-change', async (event, newConfig) => {
			deepMerge(this.config, newConfig);
			this.emit('change', this.config);
			console.log('Updated config', JSON.stringify(this.config, 2, 2));
			try {
				await fs.mkdir(appData.basePath, {recursive: true});
				await fs.writeFile(appData.configPath, JSON.stringify(this.config, '', 2));
			} catch (e) {
				console.error('Failed to save config', appData.configPath, e);
			}
		});

		ipcMain.handle('listen-config-change', event => {
			this.addListener('change', config => event.sender.send('config-changed', config));
			event.sender.send('config-changed', this.config);
		});
	}
}

module.exports = {config: new Config()};
