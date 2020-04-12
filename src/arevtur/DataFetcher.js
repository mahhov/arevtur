const {httpRequest: {get, post}} = require('js-desktop-base');
const RateLimitedRetryQueue = require('./RateLimitedRetryQueue');
const ApiConstants = require('./ApiConstants');
const Stream = require('./Stream');

let rlrQueue = new RateLimitedRetryQueue();
let rlrGet = (endpoint, queryParams, headers) => rlrQueue.add(() => get(endpoint, queryParams, headers));
let rlrPost = (endpoint, query, headers) => rlrQueue.add(() => post(endpoint, query, headers));

let deepCopy = obj => {
	if (typeof obj !== 'object' || obj === null)
		return obj;
	if (Array.isArray(obj))
		return obj.map(v => deepCopy(v));
	return Object.fromEntries(Object.entries(obj)
		.map(([k, v]) => [k, deepCopy(v)]));
};

class QueryParams {
	constructor(clone = {}) {
		clone = deepCopy(clone);
		this.league = clone.league || 'Standard';
		this.sessionId = clone.sessionId || '';
		this.name = clone.name || '';
		this.type = clone.type || '';
		this.minValue = clone.minValue || 0;
		this.maxPrice = clone.maxPrice || 0;
		this.defenseProperties = clone.defenseProperties || {
			armour: {min: 0, weight: 0},
			evasion: {min: 0, weight: 0},
			energyShield: {min: 0, weight: 0},
		};
		this.affixProperties = clone.affixProperties || {
			prefix: false,
			suffix: false,
		};
		this.linked = clone.linked || false;
		this.uncorrupted = clone.uncorrupted || false;
		this.nonUnique = clone.nonUnique || false;
		this.uncrafted = clone.uncrafted || false;
		// {property: weight, ...}
		this.weights = clone.weights || {};
		// {property: min, ...}
		this.ands = clone.ands || {};
		// {property: undefined, ...}
		this.nots = clone.nots || {};
		this.sort = clone.sort || ApiConstants.SORT.value;
		this.online = clone.online || false;
		this.affixValueShift = clone.affixValueShift || 0;
		this.priceShift = clone.priceShift || 0;
	}

	getQuery(overrides = {}) {
		let overridden = {...this, ...overrides};

		let weightFilters = Object.entries(overridden.weights).map(([property, weight]) => ({
			id: property,
			value: {weight},
		}));
		let andFilters = Object.entries(overridden.ands).map(([property, min]) => ({
			id: property,
			value: {min},
		}));
		let notFilters = Object.entries(overridden.nots).map(([property]) => ({
			id: property,
		}));

		if (overridden.affixProperties.prefix)
			andFilters.push({id: 'pseudo.pseudo_number_of_empty_prefix_mods'});
		if (overridden.affixProperties.suffix)
			andFilters.push({id: 'pseudo.pseudo_number_of_empty_suffix_mods'});

		let typeFilters = {};
		typeFilters.category = {option: overridden.type};
		if (overridden.nonUnique)
			typeFilters.rarity = {option: 'nonunique'};

		let miscFilters = {};
		if (overridden.uncorrupted)
			miscFilters.corrupted = {option: false};
		if (overridden.uncrafted)
			miscFilters.crafted = {option: false};

		let sort = weightFilters.length ? overridden.sort : ApiConstants.SORT.price;

		return {
			query: {
				status: {option: overridden.online ? 'online' : 'any'},
				term: this.name,
				stats: [
					{
						type: 'weight',
						filters: weightFilters,
						value: {min: overridden.minValue},
					}, {
						type: 'and',
						filters: andFilters,
					}, {
						type: 'not',
						filters: notFilters,
					},
				],
				filters: {
					type_filters: {filters: typeFilters},
					trade_filters: {
						filters: {
							price: {max: overridden.maxPrice}
						}
					},
					socket_filters: {
						filters: {
							links: {min: 6}
						},
						disabled: !overridden.linked
					},
					armour_filters: {
						filters: {
							ar: {min: overridden.defenseProperties.armour.min},
							ev: {min: overridden.defenseProperties.evasion.min},
							es: {min: overridden.defenseProperties.energyShield.min},
						}
					},
					misc_filters: {filters: miscFilters},
				}
			},
			sort,
		}
	}

	overrideDefenseProperty(name, min) {
		return {
			defenseProperties: {
				...this.defenseProperties,
				[name]: {
					...this.defenseProperties[name],
					min,
				}
			}
		}
	}

	getItemsStream(progressCallback) {
		let stream = new Stream();
		this.writeItemsToStream(stream, progressCallback)
			.then(() => stream.done());
		return stream;
	}

	async writeItemsToStream(stream, progressCallback) {
		let items = await this.queryAndParseItems(this.getQuery(), stream, progressCallback);

		let defenseProperty = Object.entries(this.defenseProperties).find(([_, {weight}]) => weight);
		if (defenseProperty) {
			let newItems = items;
			let lastMinDefensePropertyValue = 0;
			do {
				let newItemsMinValue = Math.min(...newItems.map(({evalValue}) => evalValue));
				let maxValue = Math.max(...items.map(({evalValue}) => evalValue));
				let minWeightValue = Math.min(...items.map(item => item.valueDetails.weightValue));
				let minDefensePropertyValue = ((maxValue + newItemsMinValue) / 2 - minWeightValue) / defenseProperty[1].weight;

				minDefensePropertyValue = Math.max(minDefensePropertyValue, lastMinDefensePropertyValue + 1);
				lastMinDefensePropertyValue = minDefensePropertyValue;

				let overrides = this.overrideDefenseProperty(defenseProperty[0], minDefensePropertyValue);
				let query = this.getQuery(overrides);
				newItems = await this.queryAndParseItems(query, stream, progressCallback);
				items = items.concat(newItems);
			} while (newItems.length > 0);
		}

		return items;
	}

	async queryAndParseItems(query, stream, progressCallback) {
		try {
			const api = 'https://www.pathofexile.com/api/trade';
			let endpoint = `${api}/search/${this.league}`;
			let headers = this.sessionId ? {Cookie: `POESESSID=${this.sessionId}`} : {};
			progressCallback('Initial query.', 0);
			let response = await rlrPost(endpoint, query, headers);
			let data = JSON.parse(response.string);
			progressCallback(`Received ${data.result.length} items.`, 0);

			let requestGroups = [];
			while (data.result.length)
				requestGroups.push(data.result.splice(0, 10));
			progressCallback(`Will make ${requestGroups.length} grouped item queries.`, 1 / (requestGroups.length + 1));

			let receivedCount = 0;
			let promises = requestGroups.map(async (requestGroup, i) => {
				let queryParams = {
					query: data.id,
					'pseudos[]': [ApiConstants.SHORT_PROPERTIES.totalEleRes, ApiConstants.SHORT_PROPERTIES.flatLife],
				};
				let endpoint2 = `${api}/fetch/${requestGroup.join()}`;
				let response2 = await rlrGet(endpoint2, queryParams, headers);
				let data2 = JSON.parse(response2.string);
				progressCallback(`Received grouped item query # ${i}.`, (1 + ++receivedCount) / (requestGroups.length + 1));
				let items = await Promise.all(data2.result.map(async itemData => await this.parseItem(itemData)));
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

	async parseItem(itemData, parsingOptions) {
		let sockets = (itemData.item.sockets || []).reduce((a, v) => {
			a[v.group] = a[v.group] || [];
			a[v.group].push(v.sColour);
			return a;
		}, []);
		let extendedExplicitMods = itemData.item.extended.mods.explicit || [];
		let affixes = Object.fromEntries([['prefix', 'P'], ['suffix', 'S']].map(([prop, tier]) =>
			[prop, extendedExplicitMods.filter(mod => mod.tier[0] === tier).length]));
		let defenseProperties =
			[
				['ar', 'armour'],
				['ev', 'evasion'],
				['es', 'energyShield'],
			].map(([responseName, fullName]) => [fullName, itemData.item.extended[responseName] || 0])
				.filter(([_, value]) => value);
		let pseudoMods = itemData.item.pseudoMods || [];
		let valueDetails = {
			affixValueShift: Math.round(this.affixValueShift * 100) / 100,
			defensePropertiesValue: Math.round(evalDefensePropertiesValue(defenseProperties, this.defenseProperties) * 100) / 100,
			weightValue: Math.round(evalValue(pseudoMods) * 100) / 100,
		};

		return {
			id: itemData.id,
			name: itemData.item.name,
			type: itemData.item.typeLine,
			itemLevel: itemData.item.ilvl,
			corrupted: itemData.item.corrupted,
			sockets,
			affixes,
			defenseProperties: defenseProperties.map(nameValue => nameValue.join(' ')),
			enchantMods: itemData.item.enchantMods || [],
			implicitMods: itemData.item.implicitMods || [],
			explicitMods: itemData.item.explicitMods || [],
			craftedMods: itemData.item.craftedMods || [],
			pseudoMods,
			accountText: `${itemData.listing.account.name} > ${itemData.listing.account.lastCharacterName}`,
			whisper: itemData.listing.whisper,
			note: itemData.item.note,
			evalValue: Object.values(valueDetails).reduce((sum, v) => sum + v),
			valueDetails,
			// todo change text to: 3 fus + fated links (#c)
			priceText: `${itemData.listing.price.amount} ${itemData.listing.price.currency}${this.priceShift ? ` + price shift ${this.priceShift}` : ''}`,
			evalPrice: await evalPrice(itemData.listing.price) + this.priceShift,
			debug: itemData,
		};
	};
}

let evalDefensePropertiesValue = (itemDefenseProperties, queryDefenseProperties) =>
	itemDefenseProperties
		.map(([name, value]) => value * queryDefenseProperties[name].weight)
		.reduce((sum, v) => sum + v, 0);

let evalValue = pseudoMods => {
	let pseudoSumI = pseudoMods.findIndex(mod => mod.startsWith('Sum: '));
	if (pseudoSumI === -1)
		return 0;
	let [pseudoSum] = pseudoMods.splice(pseudoSumI, 1);
	return Number(pseudoSum.substring(5));
};

let evalPrice = async ({currency: currencyId, amount}) => {
	let currency = await ApiConstants.constants.currencyPrice(currencyId);
	if (currency)
		return currency * amount;
	console.warn('Missing currency', currencyId);
	return -1;
};

module.exports = {QueryParams};
