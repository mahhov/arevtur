const nodeFetch = require('node-fetch');
const {XPromise} = require('js-desktop-base');
const TradeQueryRateLimiter = require('./TradeQueryRateLimiter');
const apiConstants = require('./apiConstants');

class TradeQueryItemSearcher {
	#active = false;
	#queued = [];
	#rateLimiter = new TradeQueryRateLimiter();

	get(version2, league, sessionId, stopObj, apiQuery) {
		let promise = new XPromise();
		this.#queued.push({version2, league, sessionId, stopObj, apiQuery, promise});
		this.#next();
		return promise;
	}

	async #next() {
		if (this.#active)
			return;
		this.#active = true;

		while (this.#queued.length) {
			await this.#rateLimiter.waitRateLimitDelay();
			let queueObj = this.#queued.shift();
			if (queueObj.stopObj.stop) {
				this.#rateLimiter.cancel();
				queueObj.promise.reject('stopped');
				continue;
			}

			let response = await TradeQueryItemSearcher.#makeRequest(queueObj);
			this.#rateLimiter.handleResponseHeaders(response);

			let json = await response.json();
			if (json.error)
				queueObj.promise.reject(json.error);
			else
				queueObj.promise.resolve(json);
		}
		this.#active = false;
	}

	static #makeRequest(queueObj) {
		let endpoint = queueObj.version2 ?
			`${apiConstants.api}/api/trade2/search/poe2/${queueObj.league}` :
			`${apiConstants.api}/api/trade/search/${queueObj.league}`;
		let headers = apiConstants.createRequestHeader(queueObj.sessionId);
		let body = JSON.stringify(queueObj.apiQuery);
		let options = {method: 'post', body, headers};
		return nodeFetch(endpoint, options);
	}
}

module.exports = TradeQueryItemSearcher;
