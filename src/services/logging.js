const appData = require('./appData');

class Logging {
	constructor() {
		this.logs = [];
		// disabled in dev builds to avoid corrupting line numbers
		if (!appData.isDev)
			['log', 'info', 'warn', 'error'].forEach(type => {
				let std = console[type];
				console[type] = (...args) => {
					this.logs.push({type, args});
					std.apply(console, args);
				};
			});
	}
}

module.exports = new Logging();
