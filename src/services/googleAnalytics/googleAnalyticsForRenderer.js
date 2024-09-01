const {ipcRenderer} = require('electron');

class GoogleAnalyticsForRenderer {
	async emit(eventName, eventParams) {
		ipcRenderer.invoke('ga-emit', [eventName, eventParams]);
	}
}

module.exports = new GoogleAnalyticsForRenderer();
