class Parallel {
	constructor(max) {
		this.max = max;
		this.queue = [];
	}

	add(handler) {
		return new Promise((resolve, reject) => {
			this.queue.push([handler, resolve, reject]);
			return this.activate();
		});
	}

	async next() {
		let [handler, resolve, reject] = this.queue.shift();
		try {
			resolve(await handler());
		} catch (e) {
			reject(e);
		}
	}

	async activate() {
		while (this.max && this.queue.length) {
			this.max--;
			await this.next();
			this.max++;
		}
	}
}

module.exports = Parallel;
