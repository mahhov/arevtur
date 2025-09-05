const nodeFetch = require('node-fetch');
const {XPromise} = require('js-desktop-base');
const {unique} = require('../util/util');
const TradeQueryRateLimiter = require('./TradeQueryRateLimiter');
const apiConstants = require('./apiConstants');
const querystring = require('querystring');

class TradeQueryItemGetter {
	#active = false;
	#cached = {};
	#queued = [];
	#rateLimiter = new TradeQueryRateLimiter();

	clearCache(itemId) {
		this.#cached[itemId] = null;
	}

	get(version2, sessionId, stopObj, searchId, itemId) {
		if (this.#cached[itemId]) return this.#cached[itemId];
		let queueObj = this.#queued.find(queueObj => queueObj.itemId === itemId);
		let promise = queueObj ? queueObj.promise : new XPromise();
		this.#queued.push({version2, sessionId, stopObj, searchId, itemId, promise});
		return promise;
	}

	async flush() {
		if (this.#active)
			return;
		this.#active = true;

		while (this.#queued.length) {
			await this.#rateLimiter.waitRateLimitDelay();
			let itemIds = this.#prepareNextBatch();
			if (!itemIds.length) {
				this.#rateLimiter.cancel();
				continue;
			}

			let response = await TradeQueryItemGetter.#makeRequest(this.#queued[0], itemIds);
			this.#rateLimiter.handleResponseHeaders(response);

			let json = await response.json();
			let requestObjs = this.#queued.filter(queueObj => itemIds.includes(queueObj.itemId));
			// remove from queue after all async stuff so incoming get() calls during async stuff can share same promise
			this.#queued = this.#queued.filter(queueObj => !itemIds.includes(queueObj.itemId));
			if (json.error)
				requestObjs.forEach(requestObj => requestObj.promise.reject(json.error));
			else {
				json.result.forEach(responseObj => {
					let requestObj = requestObjs.find(requestObj => requestObj.itemId === responseObj.id);
					requestObj.promise.resolve(responseObj);
					this.#cached[responseObj.id] = requestObj.promise;
				});
				requestObjs
					.filter(requestObj => !json.result.map(responseObj => responseObj.id).includes(requestObj.itemId))
					.forEach(requestObj => requestObj.promise.reject('missing from response'));
			}
		}
		this.#active = false;
	}

	#prepareNextBatch() {
		this.#queued = this.#queued.filter(queueObj => {
			if (!queueObj.stopObj.stop)
				return true;
			queueObj.promise.reject('stopped');
		});
		let first = this.#queued[0];
		return this.#queued
			.filter(queueObj =>
				queueObj.version2 === first.version2 &&
				queueObj.sessionId === first.sessionId &&
				queueObj.searchId === first.searchId)
			.map(queueObj => queueObj.itemId)
			.filter(unique)
			.slice(0, 10);
	}

	static #makeRequest(queueObj, itemIds) {
		let endpoint = queueObj.version2 ?
			`${apiConstants.api}/api/trade2/fetch/${itemIds}` :
			`${apiConstants.api}/api/trade/fetch/${itemIds}`;
		let params = {
			query: queueObj.searchId,
			'pseudos[]': [
				apiConstants.shortProperties.totalEleRes,
				apiConstants.shortProperties.flatLife,
			],
		};
		endpoint += `?${querystring.stringify(params)}`;
		let headers = apiConstants.createRequestHeader(queueObj.sessionId);
		let options = {method: 'get', headers};
		return nodeFetch(endpoint, options);
	}
}

module.exports = TradeQueryItemGetter;
