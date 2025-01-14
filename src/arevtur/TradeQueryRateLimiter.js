const {sleep} = require('../util/util');
const nodeFetch = require('node-fetch');
const {XPromise} = require('js-desktop-base');

class TradeQueryRateLimiter {
	queue = [];
	nextReady = 0;
	responseTimes = [];
	debugLogs = [];
	debugSleep = 0;

	calculateRateLimitRuleDelay(ruleStr, stateStr) {
		let rule = ruleStr.split(':');
		let state = stateStr.split(':');

		let now = Date.now();
		let maxHits = Number(rule[0]);
		let hits = Number(state[0]);
		let period = Number(rule[1]) * 1000;
		let timeout = Number(state[2]) * 1000;
		let periodResponses = this.responseTimes.filter(r => now - r < period);

		if (timeout > 0)
			return timeout + 5000;

		if (periodResponses.length < hits)
			this.responseTimes.push(...Array(hits - periodResponses.length).fill(now));

		let remaining = maxHits - hits;
		if (remaining > 1)
			return 500;

		return period - (periodResponses[0] ? now - periodResponses[0] : 0) + 1000;
	}

	static extractRateLimitHeaders(headers) {
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

	calculateRateLimitHeaderDelays({rules, states}) {
		return rules.map((rule, i) => this.calculateRateLimitRuleDelay(rule, states[i]));
	}

	queueRequest(endpoint, requestOptions, stopObj) {
		let promise = new XPromise();
		this.queue.push({endpoint, requestOptions, stopObj, promise});
		this.activate();
		return promise;
	}

	async activate() {
		if (this.nextReady === Infinity)
			return;

		let delay = this.nextReady - Date.now();
		this.nextReady = Infinity;

		while (true) {
			this.debugSleep = delay;
			await sleep(delay);

			let queueObj;
			do {
				queueObj = this.queue.shift();
				if (!queueObj) {
					this.nextReady = Date.now();
					return;
				}
			} while (queueObj.stopObj.stop);

			this.debugLogs.push({time: performance.now(), type: 'request'});
			let response = await nodeFetch(queueObj.endpoint, queueObj.requestOptions);
			let now = Date.now();
			this.responseTimes.push(now);
			this.responseTimes = this.responseTimes.filter(r => now - r <= 300 * 1000);
			let headers = Object.fromEntries(response.headers);
			let rateLimitHeaders = TradeQueryRateLimiter.extractRateLimitHeaders(headers);
			let delays = this.calculateRateLimitHeaderDelays(rateLimitHeaders);
			delay = Math.max(...delays);
			this.debugLogs.push({time: performance.now(), type: 'response', rateLimitHeaders, delays, delay});
			let json = response.json();
			if (json.error && !queueObj.retry) {
				queueObj.retry = true;
				this.queue.unshift(queueObj);
			} else
				queueObj.promise.resolve(json);
		}
	}
}

module.exports = TradeQueryRateLimiter;
