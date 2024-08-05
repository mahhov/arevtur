class Debouncer {
	constructor(handler, delay) {
		this.handler = handler;
		this.delay = delay;
		this.timeout = null;
	}

	request() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => this.run(), this.delay);
	}

	run() {
		this.handler();
	}
}

module.exports = Debouncer;
