const querystring = require('querystring');
const {httpRequest} = require('js-desktop-base');
const apiConstants = require('./apiConstants');
const Stream = require('../util/Stream');
const ItemData = require('./ItemData');
const TradeQueryRateLimiter = require('./TradeQueryRateLimiter');

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
		let items = [];
		let runQuery = async overrides => {
			let query = await this.getQuery(overrides);
			let newItems = await this.queryAndParseItems(query);
			items = items.concat(newItems);
			return newItems;
		};

		// initial query
		await runQuery();

		// 0 value query
		if (!items.length)
			await runQuery({minValue: 0});

		// high value query
		if (items.length) {
			let maxValue = Math.max(...items.map(itemData => itemData.weightedValue));
			await runQuery({minValue: maxValue * .85});
		}

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
				newItems = await runQuery(overrides);
			} while (newItems.length > 0);
		}
	}

	async queryAndParseItems(apiQuery) {
		// todo[medium] more selective try/catch
		try {
			console.log('initial query', apiQuery,
				', online', apiQuery.query.status.online,
				', price', apiQuery.query.filters.trade_filters.filters.price.max,
				', value', apiQuery.query.stats[0]?.value.min,
				', defense',
				apiQuery.query.filters.equipment_filters?.filters.ar ||
				apiQuery.query.filters.equipment_filters?.filters.ev ||
				apiQuery.query.filters.equipment_filters?.filters.es ||
				apiQuery.query.filters.equipment_filters?.filters.block || 0,
			);
			this.progressStream.write({
				text: 'Initial query.',
				queriesComplete: 0,
				queriesTotal: 11,
				itemCount: 0,
			});

			let data = await TradeQuery.initialSearchApiQuery(this.version2, this.league, this.sessionId, this.stopObj, apiQuery);
			if (data.error)
				this.errorStream.write(data.error);
			let itemCount = data.result.length;
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
				let data2 = await TradeQuery.itemsApiQuery(this.version2, this.sessionId, this.stopObj, data.id, requestGroup.join());

				if (data2.error)
					this.errorStream.write(data2.error);
				this.progressStream.write({
					text: `Received grouped item query # ${i}.`,
					queriesComplete: 1 + ++receivedCount,
					queriesTotal: requestGroups.length + 1,
					itemCount,
				});

				let items = data2.result.map(itemData =>
					new ItemData(this.version2, this.league, this.affixValueShift,
						this.unifiedQueryParams.defenseProperties, this.priceShifts, data.id, itemData));
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

	static initialSearchRateLimiter = new TradeQueryRateLimiter();

	static initialSearchApiQuery(version2, league, sessionId, stopObj, apiQuery) {
		let endpoint = version2 ?
			`${apiConstants.api}/api/trade2/search/poe2/${league}` :
			`${apiConstants.api}/api/trade/search/${league}`;
		let headers = apiConstants.createRequestHeader(sessionId);
		let body = JSON.stringify(apiQuery);
		return TradeQuery.initialSearchRateLimiter.queueRequest(endpoint, {
			method: 'post',
			body,
			headers,
		}, stopObj);
	}

	static itemsApiQueryRateLimiter = new TradeQueryRateLimiter();

	static itemsApiQuery(version2, sessionId, stopObj, queryId, itemIds) {
		let endpoint = version2 ?
			`${apiConstants.api}/api/trade2/fetch/${itemIds}` :
			`${apiConstants.api}/api/trade/fetch/${itemIds}`;
		let params = {
			query: queryId,
			'pseudos[]': [
				apiConstants.shortProperties.totalEleRes,
				apiConstants.shortProperties.flatLife,
			],
		};
		endpoint += `?${querystring.stringify(params)}`;
		let headers = apiConstants.createRequestHeader(sessionId);
		return TradeQuery.itemsApiQueryRateLimiter.queueRequest(endpoint, {
			method: 'get',
			headers,
		}, stopObj);
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
