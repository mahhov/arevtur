let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class RateLimitedRetryQueue {
	constructor(delay = 100, retries = [300, 600, 2000]) {
		this.delay = delay;
		this.retries = retries;
		this.lastTime = Date.now();
		this.queue = [];
		this.active = false;
	}

	add(handler) {
		return new Promise(async (resolve, reject) => {
			this.queue.push([handler, resolve, reject]);
			if (!this.active) {
				this.active = true;
				while (this.queue.length)
					await this.next();
				this.active = false;
			}
		});
	}

	async next() {
		await sleep(this.delay - Date.now() + this.lastTime);
		this.lastTime = Date.now();
		let [handler, resolve, reject] = this.queue.shift();
		for (let retry of this.retries)
			try {
				return resolve(handler());
			} catch (e) {
				await sleep(retry);
			}
		try {
			return resolve(handler());
		} catch (e) {
			reject(e);
		}
	}
}

module.exports = RateLimitedRetryQueue;
