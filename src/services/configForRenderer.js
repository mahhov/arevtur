const {ipcRenderer} = require('electron');

class ConfigForRenderer {
	constructor() {
		ipcRenderer.on('config-changed', (event, config) => {
			this.config_ = config;
			this.listeners.forEach(handle => handle(this.config_));
		});
		ipcRenderer.invoke('listen-config-change');
		this.listeners = [];
	}

	set config(newConfig) {
		// this.config_ will be updated in the on('config-change') callback
		ipcRenderer.invoke('config-change', newConfig);
	}

	get config() {
		return this.config_;
	}

	listenConfigChange(handle) {
		this.listeners.push(handle);
		if (this.config_)
			handle(this.config_);
	}
}

module.exports = {configForRenderer: new ConfigForRenderer()};
