const {ipcMain} = require('electron');
const fs = require('fs').promises;
const appData = require('./appData');
const Emitter = require('../util/Emitter');

// keeps config in sync between windows
class Config extends Emitter {
	constructor() {
		super();
		try {
			this.config = require(appData.configPath);
		} catch (e) {
			// For the first run, config.json won't exist. This is expected and ok.
			this.config = {
				league: 'Standard',
				restrictToPoeWindow: true,
				darkTheme: true,
				// todo[high] these 2 should use local storage, see git branch configButton
				viewHorizontal: true,
				viewMaximize: false,
				pobBuildPath: '',
			};
		}

		ipcMain.handle('config-change', async (event, newConfig) => {
			Object.assign(this.config, newConfig);
			this.emit('change', this.config);
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
