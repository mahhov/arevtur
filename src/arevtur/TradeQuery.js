const {httpRequest: {get, post}} = require('js-desktop-base');
const RateLimitedRetryQueue = require('./RateLimitedRetryQueue');
const ApiConstants = require('./ApiConstants');
const Stream = require('./Stream');
const UnifiedQueryParams = require('./UnifiedQueryParams');
const ItemData = require('./ItemData');

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

let rlrGet = (endpoint, tradeQueryParams, headers, stopObj) => rlrGetQueue.add(async () => {
	if (stopObj.stop)
		return;
	let g = await get(endpoint, tradeQueryParams, headers);
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

class TradeQueryParams {
	constructor(data) {
		this.league = data.league || 'Standard';
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
		this.sort = data.sort || ApiConstants.SORT.value;
		this.affixValueShift = data.affixValueShift || 0;
		this.priceShifts = data.priceShifts || {};
	}

	static createRequestHeader(sessionId = undefined) {
		// Without a non-empty user-agent header, PoE will return 403.
		return {'User-Agent': '_', Cookie: sessionId ? `POESESSID=${sessionId}` : ''};
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

	getItemsStream(progressCallback, pobApi = null) {
		this.stopObj = {};
		let stream = new Stream();
		this.writeItemsToStream(stream, progressCallback, pobApi)
			.then(() => stream.done());
		return stream;
	}

	stop() {
		this.stopObj.stop = true;
	}

	async writeItemsToStream(stream, progressCallback, pobApi) {
		let items = await this.queryAndParseItems(this.getQuery(), stream, progressCallback,
			pobApi);

		// todo this doesn't work for hybrid (e.g. es + evasion) bases
		let defenseProperty = Object.entries(this.defenseProperties)
			.find(([_, {weight}]) => weight);
		if (defenseProperty) {
			let newItems = items;
			let lastMinDefensePropertyValue = 0;
			do {
				let newItemsMinValue = Math.min(...newItems.map(itemData => itemData.evalValue));
				let maxValue = Math.max(...items.map(itemData => itemData.evalValue));
				let minModValue = Math.min(...items.map(item => item.evalValueDetails.mods));
				let minDefensePropertyValue = ((maxValue + newItemsMinValue) / 2 - minModValue) /
					defenseProperty[1].weight;

				minDefensePropertyValue =
					Math.max(minDefensePropertyValue, lastMinDefensePropertyValue + 1);
				lastMinDefensePropertyValue = minDefensePropertyValue;

				let overrides = this.overrideDefenseProperty(defenseProperty[0],
					minDefensePropertyValue);
				let query = this.getQuery(overrides);
				newItems = await this.queryAndParseItems(query, stream, progressCallback, pobApi);
				items = items.concat(newItems);
			} while (newItems.length > 0);
		}

		return items;
	}

	async queryAndParseItems(query, stream, progressCallback, pobApi) {
		// todo more selective try/catch
		try {
			const api = 'https://www.pathofexile.com/api/trade';
			let endpoint = `${api}/search/${this.league}`;
			let headers = TradeQueryParams.createRequestHeader(this.sessionId);
			progressCallback('Initial query.', 0);
			console.log('initial query', query);
			let response = await rlrPost(endpoint, query, headers, this.stopObj);
			let data = JSON.parse(response.string);
			progressCallback(`Received ${data.result.length} items.`, 0);

			let requestGroups = [];
			while (data.result.length)
				requestGroups.push(data.result.splice(0, 10));
			progressCallback(`Will make ${requestGroups.length} grouped item queries.`,
				1 / (requestGroups.length + 1));

			let receivedCount = 0;
			let promises = requestGroups.map(async (requestGroup, i) => {
				let tradeQueryParams = {
					query: data.id,
					'pseudos[]': [
						ApiConstants.SHORT_PROPERTIES.totalEleRes,
						ApiConstants.SHORT_PROPERTIES.flatLife,
					],
				};
				let endpoint2 = `${api}/fetch/${requestGroup.join()}`;
				let response2 = await rlrGet(endpoint2, tradeQueryParams, headers, this.stopObj);
				let data2 = JSON.parse(response2.string);
				progressCallback(`Received grouped item query # ${i}.`,
					(1 + ++receivedCount) / (requestGroups.length + 1));
				let items = await Promise.all(data2.result.map(
					async itemData => await ItemData.create(this.league, this.affixValueShift,
						this.defenseProperties, this.priceShifts, pobApi, itemData)));
				stream.write(items);
				return items;
			});
			let items = (await Promise.all(promises)).flat();
			progressCallback('All grouped item queries completed.', 1);
			return items;
		} catch (e) {
			console.warn('ERROR', e);
			return [];
		}
	}
}

class TradeQueryImport {
	constructor(sessionId, tradeSearchUrl) {
		this.sessionId = sessionId;
		this.tradeSearchUrl = tradeSearchUrl.replace('.com/trade', '.com/api/trade');
	}

	async getApiQueryParams() {
		let response = await get(this.tradeSearchUrl, {},
			TradeQueryParams.createRequestHeader(this.sessionId));
		let jsonString = response.string;
		let {query} = JSON.parse(jsonString);
		return {
			query,
			sort: {'statgroup.0': 'desc'},
		};
	}
}

module.exports = {TradeQueryParams, TradeQueryImport};