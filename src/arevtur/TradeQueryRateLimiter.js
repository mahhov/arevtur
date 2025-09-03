const {sleep} = require('../util/util');

class TradeQueryRateLimiter {
	#nextReady = 0;
	#responseTimes = [];

	#calculateRateLimitRuleDelay(ruleStr, stateStr) {
		let rule = ruleStr.split(':');
		let state = stateStr.split(':');

		let now = Date.now();
		let maxHits = Number(rule[0]);
		let hits = Number(state[0]);
		let period = Number(rule[1]) * 1000;
		let timeout = Number(state[2]) * 1000;
		let periodResponses = this.#responseTimes.filter(r => now - r < period);

		if (timeout > 0)
			return timeout + 5000;

		if (periodResponses.length < hits)
			this.#responseTimes.push(...Array(hits - periodResponses.length).fill(now));

		let remaining = maxHits - hits;
		if (remaining > 1)
			return 500;

		return period - (periodResponses[0] ? now - periodResponses[0] : 0) + 1000;
	}

	static #extractRateLimitHeaders(headers) {
		let rules = [
			...(headers['x-rate-limit-account'] || '').split(','),
			...(headers['x-rate-limit-ip'] || '').split(','),
		];
		let states = [
			...(headers['x-rate-limit-account-state'] || '').split(','),
			...(headers['x-rate-limit-ip-state'] || '').split(','),
		];
		return {rules, states};
	}

	#calculateRateLimitHeaderDelays({rules, states}) {
		return rules.map((rule, i) => this.#calculateRateLimitRuleDelay(rule, states[i]));
	}

	async waitRateLimitDelay() {
		if (this.#nextReady === Infinity)
			console.error('TradeQueryRateLimiter waitRateLimitDelay() called while active request');
		let delay = this.#nextReady - Date.now();
		this.#nextReady = Infinity;
		if (delay > 0)
			await sleep(delay);
	}

	handleResponseHeaders(nodeFetchResponse) {
		if (this.#nextReady !== Infinity)
			console.error('TradeQueryRateLimiter handleResponseHeaders() called without active request');
		let now = Date.now();
		this.#responseTimes.push(now);
		this.#responseTimes = this.#responseTimes.filter(r => now - r <= 300 * 1000);
		let headers = Object.fromEntries(nodeFetchResponse.headers);
		let rateLimitHeaders = TradeQueryRateLimiter.#extractRateLimitHeaders(headers);
		let delays = this.#calculateRateLimitHeaderDelays(rateLimitHeaders);
		let delay = Math.max(...delays);
		this.#nextReady = Date.now() + delay;
	}

	cancel() {
		if (this.#nextReady !== Infinity)
			console.error('TradeQueryRateLimiter cancel() called without active request');
		this.#nextReady = 0;
	}
}

module.exports = TradeQueryRateLimiter;
