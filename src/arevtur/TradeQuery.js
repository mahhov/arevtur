const querystring = require('querystring');
const {httpRequest, XPromise} = require('js-desktop-base');
const apiConstants = require('./apiConstants');
const Stream = require('../util/Stream');
const ItemData = require('./ItemData');
const TradeQuerySearcher = require('./TradeQuerySearcher');
const TradeQueryItemGetter = require('./TradeQueryItemGetter');

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

	getQuery(overrides) {
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
		let runQuery = async (overrides, note) => {
			let query = await this.getQuery(overrides);
			let newItems = await this.queryAndParseItems(query, note);
			items = items.concat(newItems);
			return newItems;
		};

		// initial query
		await runQuery({}, 'original');

		// 0 value query
		if (!items.length)
			await runQuery({minValue: 0}, 'no min value');

		// high value query
		if (items.length === 100) {
			let values = items.map(itemData => itemData.weightedValueDetails.mods);
			let newMinValue = (Math.min(...values) + Math.max(...values)) / 2;
			if (newMinValue > this.unifiedQueryParams.minValue)
				await runQuery({minValue: newMinValue}, 'high min value');
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
					let maxValue = Math.max(...items.map(itemData => itemData.weightedValue));
					let minModValue = Math.min(...items.map(item => item.weightedValueDetails.mods));
					minDefensePropertyValue = (maxValue - minModValue) / defenseProperty[1].weight;
				} else
					minDefensePropertyValue = this.unifiedQueryParams.minValue / defenseProperty[1].weight;

				minDefensePropertyValue = Math.max(minDefensePropertyValue, lastMinDefensePropertyValue + 1);
				lastMinDefensePropertyValue = minDefensePropertyValue;

				let overrides = this.overrideDefenseProperty(defenseProperty[0], minDefensePropertyValue);
				newItems = await runQuery(overrides, 'min defense');
			} while (newItems.length === 100);
		}
	}

	async queryAndParseItems(apiQuery, note) {
		// todo[medium] more selective try/catch
		try {
			let queryNotes = [
				['note', note],
				['online', apiQuery.query.status.option],
				['price', apiQuery.query.filters.trade_filters?.filters.price.max],
				['value', apiQuery.query.stats[0]?.value?.min],
				['defense',
					apiQuery.query.filters.equipment_filters?.filters.ar?.min ||
					apiQuery.query.filters.equipment_filters?.filters.ev?.min ||
					apiQuery.query.filters.equipment_filters?.filters.es?.min ||
					apiQuery.query.filters.equipment_filters?.filters.block?.min || 0],
			].map(line => line.join(': '));
			// console.log('initial query', apiQuery, queryNotes.join(', '));
			this.progressStream.write({
				text: 'Initial query.',
				queriesComplete: 0,
				queriesTotal: 110,
				itemCount: 0,
			});

			let searcherData;
			try {
				searcherData = await TradeQuery.searcher.get(this.version2, this.league, this.sessionId, this.stopObj, apiQuery);
			} catch (e) {
				this.errorStream.write(e);
				return;
			}

			this.progressStream.write({
				text: `Searcher returned fetch ${searcherData.result.length} items`,
				queriesComplete: 10,
				queriesTotal: searcherData.result.length - 100,
				itemCount: searcherData.result.length,
			});

			let itemGetterDataPromises = searcherData.result.map(itemId => TradeQuery.itemGetter.get(this.version2, this.sessionId, this.stopObj, searcherData.id, itemId));
			TradeQuery.itemGetter.flush();

			let itemPromises = itemGetterDataPromises.map(async (itemGetterDataPromise, i) => {
				let itemGetterData;
				try {
					itemGetterData = await itemGetterDataPromise;
				} catch (e) {
					this.errorStream.write(e);
					return null;
				}
				let item = new ItemData(this.version2, this.league, this.affixValueShift,
					this.unifiedQueryParams.defenseProperties, this.priceShifts, searcherData.id, queryNotes, itemGetterData);
				// todo[high] let users wait on pricePromise and rm this await
				await item.pricePromise;
				this.itemStream.write([item]);
				this.progressStream.write({
					text: `Received item #${i}.`,
					queriesComplete: 1,
					queriesTotal: 0,
					itemCount: 0,
				});
				return item;
			});

			let items = (await Promise.all(itemPromises)).filter(v => v);
			this.progressStream.write({
				text: 'All grouped item queries completed.',
				queriesComplete: 0,
				queriesTotal: 0,
				itemCount: 0,
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
		let queryParams = {q: JSON.stringify(await this.getQuery({}))};
		let queryParamsString = querystring.stringify(queryParams);
		return `${endpoint}?${queryParamsString}`;
	}

	static searcher = new TradeQuerySearcher();
	static itemGetter = new TradeQueryItemGetter();

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

	static directWhisper(version2, sessionId, token) {
		let endpoint = version2 ?
			`${apiConstants.api}/api/trade2/whisper` :
			`${apiConstants.api}/api/trade/whisper`;
		let headers = apiConstants.createRequestHeader(sessionId);
		return httpRequest.post(endpoint, {token}, headers)
			.then(() => true)
			.catch(e => console.error('failed to direct whisper:', e));
	}
}

module.exports = TradeQuery;
