const {ipcRenderer} = require('electron');

class GoogleAnalyticsForRenderer {
	async emit(eventName, eventParams) {
		ipcRenderer.invoke('ga-emit', [eventName, eventParams]);
	}
}

module.exports = new GoogleAnalyticsForRenderer();

// todo[high] log events for:
//  - adding query
//  - chart interaction
//  - setting sort
//  - whisper
//  - copy item
