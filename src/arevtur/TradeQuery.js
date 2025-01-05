const querystring = require('querystring');
const nodeFetch = require('node-fetch');
const {httpRequest} = require('js-desktop-base');
const RateLimitedRetryQueue = require('../util/RateLimitedRetryQueue');
const apiConstants = require('./apiConstants');
const Stream = require('../util/Stream');
const ItemData = require('./ItemData');

// todo[medium] when rate limit fails, show invalid indicator on session ID.
//  response "Query is too complex…rs used.\\nLogging in will increase this limit." indicates bad
//  session ID. other responses "{"error":{"code":2,"message":"Query is too complex. Please reduce
//  the amount of filters used."}}" don't indicate bad session IDs.

let parseRateLimitResponseHeader = ({rule, state}) => {
	let r = rule.split(':');
	let s = state.split(':');
	return `${s[0]} of ${r[0]} per ${r[1]} s. Timeout ${s[2]} of ${r[2]}`;
};

let getRateLimitHeaders = responseHeaders => {
	let rules = [
		...(responseHeaders['x-rate-limit-account'] || '').split(','),
		...(responseHeaders['x-rate-limit-ip'] || '').split(','),
	];
	let states = [
		...(responseHeaders['x-rate-limit-account-state'] || '').split(','),
		...(responseHeaders['x-rate-limit-ip-state'] || '').split(','),
	];
	return rules.map((rule, i) => ({rule, state: states[i]}));
};

let rlrGetQueue = new RateLimitedRetryQueue(667 * 1.2, [5000, 15000, 60000]);
let rlrPostQueue = new RateLimitedRetryQueue(1500 * 1.2, [5000, 15000, 60000]);

let rlrGet = (endpoint, params, headers, stopObj) => rlrGetQueue.add(async () => {
	if (stopObj.stop)
		return;
	if (params)
		endpoint += `?${querystring.stringify(params)}`;
	let response = await nodeFetch(endpoint, {
		method: 'get',
		headers,
	});
	let responseHeaders = Object.fromEntries(response.headers);
	let rateLimitStr = parseRateLimitResponseHeader(getRateLimitHeaders(responseHeaders)[0]);
	console.log('got, made requests', responseHeaders, rateLimitStr);
	let responseBody = await response.json();
	if (responseBody.error)
		console.error('response error', responseBody.error);
	return responseBody;
});

let rlrPost = (endpoint, query, headers, stopObj) => rlrPostQueue.add(async () => {
	if (stopObj.stop)
		return;
	let body = JSON.stringify(query);
	let response = await nodeFetch(endpoint, {
		method: 'post',
		body,
		headers,
	});
	let responseHeaders = Object.fromEntries(response.headers);
	let rateLimitStr = parseRateLimitResponseHeader(getRateLimitHeaders(responseHeaders)[0]);
	console.log('posted, made requests', response.headers, rateLimitStr);
	let responseBody = await response.json();
	if (responseBody.error)
		console.error('response error', responseBody.error);
	return responseBody;
});

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
		this.stopObj = {};
	}

	getQuery(overrides = {}) {
		return this.unifiedQueryParams.toApiQueryParams(overrides);
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
				let endpoint2 = `${apiConstants.api}/trade2/fetch/${requestGroup.join()}`;
				let data2 = await rlrGet(endpoint2, params, headers, this.stopObj);
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
