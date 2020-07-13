class Timer {
	constructor() {
		this.last = Date.now();
	}

	lap(msg = '') {
		let now = Date.now();
		console.log(msg, (now - this.last) / 1000);
		this.last = now;
	}
}

module.exports = Timer;
