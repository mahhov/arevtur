const {ipcMain} = require('electron');
const fs = require('fs').promises;
const appData = require('./appData');

// keeps config in sync between windows
class Config {
	constructor() {
		this.configChangeListeners = [];
		try {
			this.config = require(appData.configPath);
		} catch (e) {
			// For the first run, config.json won't exist. This is expected and ok.
			this.config = {
				league: 'Harvest',
				restrictToPoeWindow: true,
				darkTheme: false,
			};
		}

		ipcMain.handle('config-change', (event, newConfig) => {
			Object.assign(this.config, newConfig);
			this.sendConfigChange();
			fs.writeFile(appData.configPath, JSON.stringify(this.config, '', 2));
		});

		ipcMain.handle('listen-config-change', event => {
			this.configChangeListeners.push(event.sender);
			if (this.config)
				this.sendConfigChange([event.sender]);
		});
	}

	sendConfigChange(listeners = this.configChangeListeners) {
		this.configChangeListeners.forEach(listener => listener.send('config-changed', this.config));
	}
}

module.exports = {config: new Config()};
