const querystring = require('querystring');
const {httpRequest: {get, post}} = require('js-desktop-base');
const RateLimitedRetryQueue = require('../util/RateLimitedRetryQueue');
const apiConstants = require('./apiConstants');
const Stream = require('../util/Stream');
const UnifiedQueryParams = require('./UnifiedQueryParams');
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
		...responseHeaders['x-rate-limit-account'].split(','),
		...responseHeaders['x-rate-limit-ip'].split(','),
	];
	let states = [
		...responseHeaders['x-rate-limit-account-state'].split(','),
		...responseHeaders['x-rate-limit-ip-state'].split(','),
	];
	return rules.map((rule, i) => ({rule, state: states[i]}));
};

let rlrGetQueue = new RateLimitedRetryQueue(667 * 1.2, [5000, 15000, 60000]);
let rlrPostQueue = new RateLimitedRetryQueue(1500 * 1.2, [5000, 15000, 60000]);

let rlrGet = (endpoint, params, headers, stopObj) => rlrGetQueue.add(async () => {
	if (stopObj.stop)
		return;
	let g = await get(endpoint, params, headers);
	let rateLimitStr = parseRateLimitResponseHeader(getRateLimitHeaders(g.response.headers)[0]);
	console.log('got, made requests', rateLimitStr);
	return g;
});

let rlrPost = (endpoint, query, headers, stopObj) => rlrPostQueue.add(async () => {
	if (stopObj.stop)
		return;
	let p = await post(endpoint, query, headers);
	let rateLimitStr = parseRateLimitResponseHeader(getRateLimitHeaders(p.response.headers)[0]);
	console.log('posted, made requests', rateLimitStr);
	return p;
});

class TradeQuery {
	constructor(data) {
		this.league = data.league || '';
		this.sessionId = data.sessionId || '';
		this.name = data.name || '';
		this.type = data.type || '';
		this.minValue = data.minValue || 0;
		this.maxPrice = data.maxPrice || 0;
		this.online = data.online || false;
		this.defenseProperties = data.defenseProperties || {
			armour: {min: 0, weight: 0},
			evasion: {min: 0, weight: 0},
			energyShield: {min: 0, weight: 0},
		};
		this.affixProperties = data.affixProperties || {
			prefix: false,
			suffix: false,
		};
		this.linked = data.linked || false;
		this.uncorrupted = data.uncorrupted || false;
		this.nonUnique = data.nonUnique || false;
		this.influences = [...data.influences || []];
		this.uncrafted = data.uncrafted || false;
		// {property: weight, ...}
		this.weights = data.weights || {};
		// {property: min, ...}
		this.ands = data.ands || {};
		// {property: undefined, ...}
		this.nots = data.nots || {};
		this.sort = data.sort || apiConstants.sort.value;
		this.affixValueShift = data.affixValueShift || 0;
		this.priceShifts = data.priceShifts || {};

		this.itemStream = new Stream();
		this.progressStream = new Stream();
		this.stopObj = {};
	}

	getQuery(overrides = {}) {
		return UnifiedQueryParams.toApiQueryParams(this, overrides);
	}

	overrideDefenseProperty(name, min) {
		return {
			defenseProperties: {
				...this.defenseProperties,
				[name]: {
					...this.defenseProperties[name],
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
		let items = await this.queryAndParseItems(this.getQuery());

		// todo[low] this doesn't work for hybrid (e.g. es + evasion) bases
		let defenseProperty = Object.entries(this.defenseProperties)
			.find(([_, {weight}]) => weight);
		if (defenseProperty) {
			let newItems = items;
			let lastMinDefensePropertyValue = 0;
			do {
				let newItemsMinValue = Math.min(
					...newItems.map(itemData => itemData.weightedValue));
				let maxValue = Math.max(...items.map(itemData => itemData.weightedValue));
				let minModValue = Math.min(...items.map(item => item.weightedValueDetails.mods));
				let minDefensePropertyValue = ((maxValue + newItemsMinValue) / 2 - minModValue) /
					defenseProperty[1].weight;

				minDefensePropertyValue =
					Math.max(minDefensePropertyValue, lastMinDefensePropertyValue + 1);
				lastMinDefensePropertyValue = minDefensePropertyValue;

				let overrides = this.overrideDefenseProperty(defenseProperty[0],
					minDefensePropertyValue);
				let query = this.getQuery(overrides);
				newItems = await this.queryAndParseItems(query);
				items = items.concat(newItems);
			} while (newItems.length > 0);
		}
	}

	async queryAndParseItems(query) {
		// todo[medium] more selective try/catch
		try {
			const api = 'https://www.pathofexile.com/api/trade';
			let endpoint = `${api}/search/${this.league}`;
			let headers = apiConstants.createRequestHeader(this.sessionId);
			this.progressStream.write({
				text: 'Initial query.',
				queriesComplete: 0,
				queriesTotal: 11,
				itemCount: 0,
			});
			console.log('initial query', query);
			let response = await rlrPost(endpoint, query, headers, this.stopObj);
			let data = JSON.parse(response.string);
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
				let endpoint2 = `${api}/fetch/${requestGroup.join()}`;
				let response2 = await rlrGet(endpoint2, params, headers, this.stopObj, this.id);
				let data2 = JSON.parse(response2.string);
				this.progressStream.write({
					text: `Received grouped item query # ${i}.`,
					queriesComplete: 1 + ++receivedCount,
					queriesTotal: requestGroups.length + 1,
					itemCount,
				});
				let items = data2.result.map(itemData =>
					new ItemData(this.league, this.affixValueShift, this.defenseProperties,
						this.priceShifts, itemData));
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

	get toApiHtmlUrl() {
		const api = 'https://www.pathofexile.com/trade';
		let endpoint = `${api}/search/${this.league}`;
		let queryParams = {q: JSON.stringify(this.getQuery())};
		let queryParamsString = querystring.stringify(queryParams);
		return `${endpoint}?${queryParamsString}`;
	}

	static async fromApiHtmlUrl(sessionId, tradeSearchUrl) {
		tradeSearchUrl = tradeSearchUrl.replace('.com/trade', '.com/api/trade');
		let response = await get(tradeSearchUrl, {}, apiConstants.createRequestHeader(sessionId));
		let jsonString = response.string;
		let {query} = JSON.parse(jsonString);
		return {
			query,
			sort: {'statgroup.0': 'desc'},
		};
	}

	static async directWhisper(sessionId, token) {
		const endpoint = 'https://www.pathofexile.com/api/trade/whisper';
		let headers = apiConstants.createRequestHeader(sessionId);
		await post(endpoint, {token}, headers)
			.catch(e => console.error('failed to direct whisper:', e));
	}
}

module.exports = TradeQuery;
