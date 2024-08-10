const {ipcRenderer} = require('electron');
const Emitter = require('../util/Emitter');

class ConfigForRenderer extends Emitter {
	constructor() {
		super();
		ipcRenderer.on('config-changed', (event, config) => {
			this.config_ = config;
			this.emit('change', config);
		});
		ipcRenderer.invoke('listen-config-change');
	}

	get config() {
		return this.config_;
	}

	set config(newConfig) {
		// this.config_ will be updated in the on('config-change') callback
		ipcRenderer.invoke('config-change', newConfig);
	}

	addListener(event, handler) {
		super.addListener(event, handler);
	}
}

module.exports = {configForRenderer: new ConfigForRenderer()};
