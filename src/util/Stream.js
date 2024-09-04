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

	done(value) {
		this.resolve(value);
	}

	get lastValue() {
		return this.written[this.written.length - 1];
	}
}

module.exports = Stream;
