class Stream {
	constructor() {
		this.written = [];
		this.listeners = [];
		this.promise = new Promise(resolve => this.resolve = resolve);
	}

	write(...values) {
		this.written.push(...values);
		this.listeners.forEach(listener =>
			values.forEach(listener));
	}

	forEach(listener) {
		this.listeners.push(listener);
		this.written.forEach(listener);
	}

	done() {
		this.resolve();
	}
}

module.exports = Stream;
