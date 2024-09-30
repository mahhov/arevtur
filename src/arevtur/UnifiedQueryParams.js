const apiConstants = require('./apiConstants');
const {XElement} = require('xx-element');
const {deepCopy} = require('../util/util');
const {
	defensePropertyTuples,
	affixPropertyTuples,
	influenceProperties,
	queryPropertyFilters,
} = require('./xElements/inputTradeParams/Properties');

let pruneIfEmptyFilters = obj =>
	Object.values(obj.filters).filter(v => v !== undefined).length ? obj : undefined;

class Entry {
	constructor(propertyText, weight, locked = false, enabled = true) {
		this.propertyText = propertyText;
		this.weight = weight;
		this.locked = locked;
		this.enabled = enabled;
	}

	get property() {
		return apiConstants.propertyByText(this.propertyText);
	}

	async toApiQueryParams(weightKey = null) {
		if (!this.enabled || !this.propertyText)
			return null;
		let property = await this.property;
		if (!property?.id)
			return null;
		let ret = {
			id: property.id,
		};
		if (weightKey || property.optionId) {
			ret.value = {};
			if (weightKey)
				ret.value[weightKey] = this.weight;
			if (property.optionId)
				ret.value.option = property.optionId;
		}
		return ret;
	}
}

class UnifiedQueryParams {
	static Entry = Entry;

	name = '';
	typeText = 'Any';
	minValue = 0;
	maxPrice = 0;
	offline = false;
	defenseProperties = {}; // {armour, evasion, energyShield: {weight: 0, min: 0}}
	affixProperties = {};   // {prefix, suffix: 0} // todo[high] allow disabling affix properties
	linked = false;
	uncorrupted = false;
	nonUnique = false;
	uncrafted = false;
	influences = [];
	weightEntries = [];
	// todo[high] don't default '' to 0 in order to not break negated mods; e.g. 'Socketed
	//  Attacks have +# to Total Mana Cost'
	andEntries = [];
	notEntries = [];
	conditionalPrefixEntries = [];
	conditionalSuffixEntries = [];
	sharedWeightEntries = [];

	constructor() {
		defensePropertyTuples.forEach(([property]) =>
			this.defenseProperties[property] = {weight: 0, min: 0});
		affixPropertyTuples.forEach(([property]) =>
			this.affixProperties[property] = 0);
	}

	get copy() {
		let copy = new UnifiedQueryParams();
		Object.assign(copy, deepCopy(this));
		queryPropertyFilters.forEach(([key]) => {
			copy[key] = copy[key].map(entry => {
				let entryCopy = new Entry();
				Object.assign(entryCopy, deepCopy(entry));
				return entryCopy;
			});
		});
		return copy;
	}

	static fromStorageQueryParams(storageQueryParams, sharedWeightEntriesData = []) {
		let unifiedQueryParams = new UnifiedQueryParams();
		Object.assign(unifiedQueryParams, storageQueryParams);
		unifiedQueryParams.sharedWeightEntries = sharedWeightEntriesData;
		queryPropertyFilters
			.map(([key]) => key)
			.forEach(key => unifiedQueryParams[key].map(entryData => {
				let entry = new Entry();
				Object.assign(entry, entryData);
				return entry;
			}));
		return unifiedQueryParams;
	}

	toInputTradeQueryParams(inputElement) {
		inputElement.name = this.name;
		inputElement.type = this.typeText;
		inputElement.minValue = this.minValue;
		inputElement.price = this.maxPrice;
		inputElement.offline = this.offline;
		defensePropertyTuples.forEach(([property]) =>
			inputElement[property] = this.defenseProperties[property].weight);
		affixPropertyTuples.forEach(([property]) =>
			inputElement[property] = this.affixProperties[property]);
		inputElement.linked = this.linked;
		inputElement.uncorrupted = this.uncorrupted;
		inputElement.nonUnique = this.nonUnique;
		inputElement.influences = influenceProperties.map(influence =>
			this.influences.includes(influence));

		XElement.clearChildren(inputElement.$('#query-properties-list'));

		queryPropertyFilters.forEach(([key, filter, hasWeight, isShared]) =>
			this[key].forEach(entry => {
				let queryProperty = inputElement.addQueryProperty();
				queryProperty.property = entry.propertyText;
				if (hasWeight) {
					queryProperty.weight = entry.weight;
					queryProperty.locked = entry.locked;
				}
				queryProperty.filter = filter;
				queryProperty.shared = isShared;
				queryProperty.enabled = entry.enabled;
			}));
	}

	static fromInputTradeQueryParams(inputElement) {
		let defenseProperties = Object.fromEntries(defensePropertyTuples
			.map(([property]) => [property, {
				weight: Number(inputElement[property]),
				min: 0,
			}]));

		let affixProperties = Object.fromEntries(affixPropertyTuples
			.map(([property]) => [property, Number(inputElement[property])]));

		let propertyEntryDatas =
			[...inputElement.$$('#query-properties-list x-query-property')]
				.filter(queryProperty => queryProperty.property)
				.map(queryProperty => ({
					propertyText: queryProperty.property,
					weight: Number(queryProperty.weight),
					filter: queryProperty.filter,
					locked: queryProperty.locked,
					shared: queryProperty.shared,
					enabled: queryProperty.enabled,
				}));

		let entries = Object.fromEntries(
			queryPropertyFilters.map(([key, filter, hasWeight, isShared]) => {
				let entries = propertyEntryDatas
					.filter(data => data.filter === filter && data.shared === isShared)
					.map(data =>
						new Entry(data.propertyText, data.weight, data.locked, data.enabled));
				return [key, entries];
			}));

		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.name = inputElement.name;
		unifiedQueryParams.typeText = inputElement.type;
		unifiedQueryParams.minValue = Number(inputElement.minValue);
		unifiedQueryParams.maxPrice = Number(inputElement.price);
		unifiedQueryParams.offline = inputElement.offline;
		unifiedQueryParams.defenseProperties = defenseProperties;
		unifiedQueryParams.affixProperties = affixProperties;
		unifiedQueryParams.linked = inputElement.linked;
		unifiedQueryParams.uncorrupted = inputElement.uncorrupted;
		unifiedQueryParams.nonUnique = inputElement.nonUnique;
		unifiedQueryParams.influences =
			influenceProperties.filter((_, i) => inputElement.influences[i]);
		Object.assign(unifiedQueryParams, entries);
		return unifiedQueryParams;
	}

	/*async*/
	toTradeQueryData(manual6LinkName, manual6LinkPrice) {
		let queries = [];

		let linkedOptions = [
			// query with the intended links
			false,
			// query unlinked + uncorrupted items
			this.linked && this.maxPrice > manual6LinkPrice ? true : null,
		].filter(v => v !== null);
		let affixOptions = [
			// query without affixes
			false,
			// query items with a craftable prefix
			this.affixProperties.prefix ? ['prefix'] : null,
			// query items with a craftable suffix
			this.affixProperties.suffix ? ['suffix'] : null,
			// query items with specific craftable prefixes
			// ...await Promise.all(this.conditionalPrefixEntries.map(
			// 	async entry => ['prefix', (await entry.property)?.id, entry.weight])),
			// query items with specific craftable suffixes
			// ...await Promise.all(this.conditionalSuffixEntries.map(
			// 	async entry => ['suffix', (await entry.property)?.id, entry.weight])),
		].filter(v => v !== null);

		// cross product all combinations of linking and craftable affixes
		linkedOptions.forEach(lo => affixOptions.forEach(ao => {
			let copy = this.copy;
			if (lo) {
				copy.linked = false;
				copy.uncorrupted = true;
				copy.maxPrice -= manual6LinkPrice;
				copy.priceShifts[manual6LinkName] = manual6LinkPrice;
			}
			if (ao) {
				copy.affixProperties[ao[0]] = true;
				copy.uncorrupted = true;
				copy.uncrafted = true;
				if (ao.length === 1)
					copy.affixValueShift += this.affixProperties[ao[0]];
				else {
					copy.notEntries[ao[1]] = undefined;
					copy.affixValueShift += ao[2];
				}
			}
			queries.push(copy);
		}));

		// each query is like a `UnifiedQueryParams`, but with the additional fields:
		// `priceShifts`, & `affixValueShift`
		return queries;
	}

	async toApiQueryParams(overrides = {}) {
		let overridden = {...this, ...overrides};

		let weightFilters = (await Promise.all(
			[overridden.weightEntries, overridden.sharedWeightEntries]
				.flat()
				.map(entry => entry.toApiQueryParams('weight'))))
			.filter(v => v);
		let andFilters = (await Promise.all(overridden.andEntries
			.map(entry => entry.toApiQueryParams('min'))))
			.filter(v => v);
		let notFilters = (await Promise.all(overridden.notEntries
			.map(entry => entry.toApiQueryParams())))
			.filter(v => v);

		if (overridden.affixProperties.prefix)
			andFilters.push({id: 'pseudo.pseudo_number_of_empty_prefix_mods'});
		if (overridden.affixProperties.suffix)
			andFilters.push({id: 'pseudo.pseudo_number_of_empty_suffix_mods'});

		let typeFilters = {};
		let typeId = await apiConstants.typeTextToId(overridden.typeText);
		if (typeId)
			typeFilters.category = {option: typeId};
		if (overridden.nonUnique)
			typeFilters.rarity = {option: 'nonunique'};

		let miscFilters = {};
		if (overridden.uncorrupted)
			miscFilters.corrupted = {option: false};
		if (overridden.uncrafted)
			miscFilters.crafted = {option: false};
		overridden.influences
			.filter(influence => influence)
			.forEach(influence => miscFilters[`${influence}_item`] = {option: true});

		let sort = weightFilters.length ? apiConstants.sort.value : apiConstants.sort.price;

		return {
			query: {
				status: {option: overridden.offline ? 'any' : 'online'},
				type: overridden.name || undefined,
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
				].map(pruneIfEmptyFilters).filter(v => v),
				filters: {
					type_filters: pruneIfEmptyFilters({filters: typeFilters}),
					trade_filters: {
						filters: {
							price: {max: overridden.maxPrice || undefined},
						},
					},
					socket_filters: overridden.linked ? {
						filters: {
							links: {min: 6},
						},
					} : undefined,
					armour_filters: pruneIfEmptyFilters({
						filters: {
							ar: overridden.defenseProperties.armour.min ?
								{min: overridden.defenseProperties.armour.min} : undefined,
							ev: overridden.defenseProperties.evasion.min ?
								{min: overridden.defenseProperties.evasion.min} : undefined,
							es: overridden.defenseProperties.energyShield.min ?
								{min: overridden.defenseProperties.energyShield.min} : undefined,
						},
					}),
					misc_filters: pruneIfEmptyFilters({filters: miscFilters}),
				},
			},
			sort,
		};
	}

	static async fromApiQueryParams(apiQueryParams) {
		let filters = apiQueryParams.query?.filters;
		let stats = apiQueryParams.query?.stats;
		let weightedStats = stats?.find(stats => stats.type === 'weight');
		let andStats = stats?.find(stats => stats.type === 'and');
		let notStats = stats?.find(stats => stats.type === 'not');
		let data = {
			name: apiQueryParams.type || '',
			typeText: await apiConstants.typeIdToText(
				filters?.type_filters?.filters?.category?.option) || 'Any',
			minValue: weightedStats?.value?.min || 0,
			maxPrice: filters?.trade_filters?.filters?.price?.max || 0,
			offline: apiQueryParams?.query?.status !== 'online' &&
				apiQueryParams?.query?.status?.option !== 'online',
			// defenseProperties
			// affixProperties
			linked: filters?.socket_filters?.filters?.links?.min === 6 || false,
			uncorrupted: filters?.misc_filters?.filters?.corrupted?.option === false || false,
			nonUnique: filters?.type_filters?.filters?.rarity?.option === 'nonunique' || false,
			// influences
			weightEntries: await Promise.all(weightedStats?.filters?.map(async entry =>
				new Entry((await apiConstants.propertyById(entry?.id)).text,
					entry?.value?.weight)) || []),
			andEntries: await Promise.all(andStats?.filters?.map(async entry =>
				new Entry((await apiConstants.propertyById(entry?.id)).text,
					entry?.value?.min)) || []),
			notEntries: await Promise.all(notStats?.filters?.map(async entry =>
				new Entry((await apiConstants.propertyById(entry?.id)).text, 0)) || []),
			// conditionalPrefixEntries
			// conditionalSuffixEntries
			// sharedWeightEntries
		};
		let unifiedQueryParams = new UnifiedQueryParams();
		Object.assign(unifiedQueryParams, data);
		return unifiedQueryParams;
	}

	static async fromModWeights(baseUnifiedQueryParams, minValue, modWeights) {
		let unifiedQueryParams = baseUnifiedQueryParams.copy;
		unifiedQueryParams.minValue = minValue;
		unifiedQueryParams.weightEntries = await Promise.all(modWeights.map(async modWeight => {
			let property = await apiConstants.propertyById(modWeight.tradeModId);
			let weight = modWeight.weight * (modWeight.invert ? -1 : 1);
			return new Entry(property.text, weight);
		}));
		return unifiedQueryParams;
	}

	static fromPropertyIds(typeText, propertyTexts) {
		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.typeText = typeText;
		unifiedQueryParams.andEntries =
			propertyTexts.map(propertyTexts => new Entry(propertyTexts, 0));
		return unifiedQueryParams;
	}
}

module.exports = UnifiedQueryParams;
