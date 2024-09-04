const {ipcRenderer} = require('electron');
const Emitter = require('../../util/Emitter');
const defaultConfig = require('./defaultConfig.json');

class ConfigForRenderer extends Emitter {
	constructor() {
		super();
		this.config_ = defaultConfig;
		ipcRenderer.on('config-changed', (event, config) => {
			this.config_ = config;
			this.emit('change', config);
		});
		ipcRenderer.invoke('listen-config-change');
	}

	get config() {
		return this.config_;
	}

	// callers should do `.config = {x: y}` instead of `.config.x = y` in order to invoke this
	// setter
	set config(newConfig) {
		// this.config_ will be updated in the on('config-change') callback
		ipcRenderer.invoke('config-change', newConfig);
	}

	addListener(event, handler) {
		super.addListener(event, handler);
	}
}

// todo[high] here and elsewhere, export `new X()` instead of `{x: new X()}`
module.exports = {configForRenderer: new ConfigForRenderer()};
