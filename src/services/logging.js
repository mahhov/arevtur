class Logging {
	constructor() {
		this.logs = [];
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
