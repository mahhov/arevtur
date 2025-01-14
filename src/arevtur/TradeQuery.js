const querystring = require('querystring');
const {httpRequest} = require('js-desktop-base');
const apiConstants = require('./apiConstants');
const Stream = require('../util/Stream');
const ItemData = require('./ItemData');
const RateLimiter = require('../util/RateLimitedRetryQueue');

let getRateLimiter = new RateLimiter();
let postRateLimiter = new RateLimiter();

window.getRateLimiter = getRateLimiter;
window.postRateLimiter = postRateLimiter;

let rlrGet = (endpoint, params, headers, stopObj) => {
	if (params)
		endpoint += `?${querystring.stringify(params)}`;
	return getRateLimiter.queueRequest(endpoint, {
		method: 'get',
		headers,
	}, stopObj);
};

let rlrPost = (endpoint, query, headers, stopObj) => {
	let body = JSON.stringify(query);
	return postRateLimiter.queueRequest(endpoint, {
		method: 'post',
		body,
		headers,
	}, stopObj);
};

class TradeQuery {
	constructor(unifiedQueryParams, version2, league, sessionId, affixValueShift = 0, priceShifts = {}) {
		this.unifiedQueryParams = unifiedQueryParams;
		this.version2 = version2;
		this.league = league;
		this.sessionId = sessionId;
		this.affixValueShift = affixValueShift;
		this.priceShifts = priceShifts;
		this.itemStream = new Stream();
		this.progressStream = new Stream();
		this.errorStream = new Stream();
		this.stopObj = {};
	}

	getQuery(overrides = {}) {
		return this.unifiedQueryParams.toApiQueryParams(this.version2, overrides);
	}

	overrideDefenseProperty(name, min) {
		return {
			minValue: 0,
			defenseProperties: {
				...this.unifiedQueryParams.defenseProperties,
				[name]: {
					...this.unifiedQueryParams.defenseProperties[name],
					min,
				},
			},
		};
	}

	start() {
		this.writeItemsToStream().then(() => this.itemStream.done());
	}

	stop() {
		this.stopObj.stop = true;
	}

	async writeItemsToStream() {
		let items = await this.queryAndParseItems(await this.getQuery());

		// todo[low] this doesn't work for hybrid (e.g. es + evasion) bases
		let defenseProperty = Object.entries(this.unifiedQueryParams.defenseProperties)
			.find(([_, {weight}]) => weight);
		if (defenseProperty) {
			let newItems = items;
			let lastMinDefensePropertyValue = 0;
			do {
				let minDefensePropertyValue;
				if (newItems.length) {
					let newItemsMinValue = Math.min(...newItems.map(itemData => itemData.weightedValue));
					let maxValue = Math.max(...items.map(itemData => itemData.weightedValue));
					let minModValue = Math.min(...items.map(item => item.weightedValueDetails.mods));
					minDefensePropertyValue = ((maxValue + newItemsMinValue) / 2 - minModValue) / defenseProperty[1].weight;
				} else
					minDefensePropertyValue = this.unifiedQueryParams.minValue / defenseProperty[1].weight;

				minDefensePropertyValue = Math.max(minDefensePropertyValue, lastMinDefensePropertyValue + 1);
				lastMinDefensePropertyValue = minDefensePropertyValue;

				let overrides = this.overrideDefenseProperty(defenseProperty[0], minDefensePropertyValue);
				let query = await this.getQuery(overrides);
				newItems = await this.queryAndParseItems(query);
				items = items.concat(newItems);
			} while (newItems.length > 0);
		}
	}

	async queryAndParseItems(query) {
		// todo[medium] more selective try/catch
		try {
			let endpoint = this.version2 ?
				`${apiConstants.api}/api/trade2/search/poe2/${this.league}` :
				`${apiConstants.api}/api/trade/search/${this.league}`;
			let headers = apiConstants.createRequestHeader(this.sessionId);
			this.progressStream.write({
				text: 'Initial query.',
				queriesComplete: 0,
				queriesTotal: 11,
				itemCount: 0,
			});
			console.log('initial query', endpoint, query, headers);
			let data = await rlrPost(endpoint, query, headers, this.stopObj);
			if (data.error)
				this.errorStream.write(data.error);
			let itemCount = data.result.length;
			this.progressStream.write({
				text: `Received ${data.result.length} items.`,
				queriesComplete: 0,
				queriesTotal: 11,
				itemCount,
			});

			let requestGroups = [];
			while (data.result.length)
				requestGroups.push(data.result.splice(0, 10));
			this.progressStream.write({
				text: `Will make ${requestGroups.length} grouped item queries.`,
				queriesComplete: 1,
				queriesTotal: requestGroups.length + 1,
				itemCount,
			});

			let receivedCount = 0;
			let promises = requestGroups.map(async (requestGroup, i) => {
				let params = {
					query: data.id,
					'pseudos[]': [
						apiConstants.shortProperties.totalEleRes,
						apiConstants.shortProperties.flatLife,
					],
				};
				let endpoint2 = this.version2 ?
					`${apiConstants.api}/api/trade2/fetch/${requestGroup.join()}` :
					`${apiConstants.api}/api/trade/fetch/${requestGroup.join()}`;
				let data2 = await rlrGet(endpoint2, params, headers, this.stopObj);
				if (data2.error)
					this.errorStream.write(data2.error);
				this.progressStream.write({
					text: `Received grouped item query # ${i}.`,
					queriesComplete: 1 + ++receivedCount,
					queriesTotal: requestGroups.length + 1,
					itemCount,
				});
				let items = data2.result.map(itemData =>
					new ItemData(this.league, this.affixValueShift,
						this.unifiedQueryParams.defenseProperties, this.priceShifts, itemData));
				// todo[high] let users wait on pricePromise and rm this await
				await Promise.all(items.map(item => item.pricePromise));
				this.itemStream.write(items);
				return items;
			});
			let items = (await Promise.all(promises)).flat();
			this.progressStream.write({
				text: 'All grouped item queries completed.',
				queriesComplete: requestGroups.length + 1,
				queriesTotal: requestGroups.length + 1,
				itemCount,
			});
			return items;
		} catch (e) {
			console.warn('ERROR', e);
			return [];
		}
	}

	async toApiHtmlUrl() {
		let endpoint = this.version2 ?
			`${apiConstants.api}/trade2/search/poe2/${this.league}` :
			`${apiConstants.api}/trade/search/${this.league}`;
		let queryParams = {q: JSON.stringify(await this.getQuery())};
		let queryParamsString = querystring.stringify(queryParams);
		return `${endpoint}?${queryParamsString}`;
	}

	static async fromApiHtmlUrl(sessionId, tradeSearchUrl) {
		tradeSearchUrl = tradeSearchUrl.replace('.com/trade', '.com/api/trade');
		let response = await httpRequest.get(tradeSearchUrl, {}, apiConstants.createRequestHeader(sessionId));
		let jsonString = response.string;
		let {query} = JSON.parse(jsonString);
		return {
			query,
			sort: {'statgroup.0': 'desc'},
		};
	}

	static async directWhisper(version2, sessionId, token) {
		let endpoint = version2 ?
			`${apiConstants.api}/api/trade2/whisper` :
			`${apiConstants.api}/api/trade/whisper`;
		let headers = apiConstants.createRequestHeader(sessionId);
		await httpRequest.post(endpoint, {token}, headers)
			.catch(e => console.error('failed to direct whisper:', e));
	}
}

module.exports = TradeQuery;
