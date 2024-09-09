let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class RateLimitedRetryQueue {
	constructor(delay = 1000, retries = [1000, 2000, 6000]) {
		this.delay = delay;
		this.retries = retries;
		this.lastTime = performance.now()();
		this.queue = [];
		this.active = false;
	}

	add(handler) {
		return new Promise((resolve, reject) => {
			this.queue.push([handler, resolve, reject]);
			return this.activate();
		});
	}

	async next() {
		await sleep(this.delay - performance.now()() + this.lastTime);
		let [handler, resolve, reject] = this.queue.shift();
		for (let retry of this.retries)
			try {
				this.lastTime = performance.now()();
				return resolve(await handler());
			} catch (e) {
				console.warn('RateLimitedRetryQueue failed', e, '. Will retry in ', retry);
				await sleep(retry);
			}
		try {
			this.lastTime = performance.now()();
			resolve(await handler());
		} catch (e) {
			reject(e);
		}
	}

	async activate() {
		if (this.active)
			return;
		this.active = true;
		while (this.queue.length)
			await this.next();
		this.active = false;
	}
}

module.exports = RateLimitedRetryQueue;
