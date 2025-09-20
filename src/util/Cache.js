class Cache {
	#data = {};
	#durationMs;
	#handler;

	constructor(durationMs, handler = undefined) {
		this.#durationMs = durationMs;
		this.#handler = handler;
	}

	getIfCached(key) {
		let obj = this.#data[key];
		if (obj?.promise && performance.now() - obj.timestampMs < this.#durationMs)
			return obj.promise;
		return null;
	}

	get(key, handler = this.#handler) {
		let cached = this.getIfCached(key);
		if (cached) return cached;

		let obj = this.#data[key] = {
			timestampMs: performance.now(),
			promise: this.#handler(key)
				.catch(e => {
					obj.promise = null;
					console.error(`Unable to compute cache '${key}':`, e);
				}),
		};
		return obj.promise;
	}

	clear(key) {
		this.#data[key] = null;
	}
}

module.exports = Cache;
