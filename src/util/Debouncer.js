class Debouncer {
	constructor(handler, delay) {
		this.handler = handler;
		this.delay = delay;
		this.scheduled = false;
		this.lastRun = 0;
	}

	request() {
		if (this.scheduled)
			return;
		let delay = this.delay - (Date.now() - this.lastRun);
		if (delay < 0)
			this.run();
		else {
			this.scheduled = true;
			setTimeout(() => this.run(), delay);
		}
	}

	run() {
		this.scheduled = false;
		this.lastRun = Date.now();
		this.handler();
	}
}

module.exports = Debouncer;
