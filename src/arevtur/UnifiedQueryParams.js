const ApiConstants = require('./ApiConstants');
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

class UnifiedQueryParams {
	name = '';
	type = '';
	minValue = 0;
	maxPrice = 1;
	offline = false;
	defenseProperties = {}; // {armour, evasion, energyShield: {weight: 0, min: 0}}
	affixProperties = {};   // {prefix, suffix: 0} // todo[high] allow disabling affix properties
	linked = false;
	uncorrupted = false;
	nonUnique = false;
	influences = [];
	weightEntries = [];            // (propertyId, weight, locked, enabled)[]
	andEntries = [];               // (propertyId, weight, locked, enabled)[]
	notEntries = [];               // (propertyId, enabled)[]
	conditionalPrefixEntries = []; // (propertyId, weight, locked, enabled)[]
	conditionalSuffixEntries = []; // (propertyId, weight, locked, enabled)[]
	sharedWeightEntries = [];      // (propertyId, weight, locked, enabled)[]

	constructor() {
		defensePropertyTuples.forEach(([property]) =>
			this.defenseProperties[property] = {weight: 0, min: 0});
		affixPropertyTuples.forEach(([property]) =>
			this.affixProperties[property] = 0);
	}

	static fromStorageQueryParams(storageQueryParams, sharedWeightEntries = []) {
		let unifiedQueryParams = new UnifiedQueryParams();
		Object.assign(unifiedQueryParams, storageQueryParams);
		unifiedQueryParams.sharedWeightEntries = sharedWeightEntries;
		return unifiedQueryParams;
	}

	async toInputTradeQueryParams(inputElement) {
		inputElement.name = this.name || '';
		inputElement.type = await ApiConstants.constants.typeIdToText(this.type) || '';
		inputElement.minValue = this.minValue || 0;
		inputElement.price = this.maxPrice || 0;
		inputElement.offline = this.offline || false;
		let defenseProperties = this.defenseProperties || {};
		defensePropertyTuples.forEach(([property]) => {
			let defenseProperty = defenseProperties[property];
			inputElement[property] = defenseProperty ? defenseProperty.weight : 0;
		});
		let affixProperties = this.affixProperties || {};
		affixPropertyTuples.forEach(([property]) =>
			inputElement[property] = affixProperties[property] || 0);
		inputElement.linked = this.linked || false;
		inputElement.uncorrupted = this.uncorrupted || false;
		inputElement.nonUnique = this.nonUnique || false;
		inputElement.influences = this.influences ?
			influenceProperties.map(influence => this.influences.includes(influence)) : [];
		XElement.clearChildren(inputElement.$('#query-properties-list'));
		this.sharedWeightEntries.map(async ([property, weight, locked, enabled]) => {
			let queryProperty = inputElement.addQueryProperty();
			queryProperty.property = (await ApiConstants.constants.propertyById(property))?.text;
			queryProperty.weight = weight;
			queryProperty.filter = 'weight';
			queryProperty.locked = locked;
			queryProperty.shared = true;
			queryProperty.enabled = enabled;
		});

		queryPropertyFilters.forEach(([key, filter, hasWeight]) => {
			if (hasWeight)
				this[key].forEach(async ([property, weight, locked, enabled]) => {
					let queryProperty = inputElement.addQueryProperty();
					queryProperty.property =
						(await ApiConstants.constants.propertyById(property))?.text;
					queryProperty.filter = filter;
					queryProperty.weight = weight;
					queryProperty.locked = locked;
					queryProperty.enabled = enabled;
				});
			else
				this[key].forEach(async ([property, enabled]) => {
					let queryProperty = inputElement.addQueryProperty();
					queryProperty.property =
						(await ApiConstants.constants.propertyById(property))?.text;
					queryProperty.filter = filter;
					queryProperty.enabled = enabled;
				});
		});
		await ApiConstants.constants.properties;
	}

	static async fromInputTradeQueryParams(inputElement) {
		let type = await ApiConstants.constants.typeTextToId(inputElement.type);

		let defenseProperties = Object.fromEntries(defensePropertyTuples
			.map(([property]) => [property, {
				weight: Number(inputElement[property]),
				min: 0,
			}]));

		let affixProperties = Object.fromEntries(affixPropertyTuples
			.map(([property]) => [property, Number(inputElement[property])]));

		let propertyEntries = (await Promise.all(
			[...inputElement.$$('#query-properties-list x-query-property')]
				.map(async queryProperty => ({
					propertyId: await ApiConstants.constants.propertyTextToId(
						queryProperty.property),
					weight: Number(queryProperty.weight),
					filter: queryProperty.filter,
					locked: queryProperty.locked,
					shared: queryProperty.shared,
					enabled: queryProperty.enabled,
				})))).filter(({propertyId}) => propertyId);

		let sharedWeightEntries = propertyEntries
			.filter(entry => entry.filter === 'weight' && entry.weight && entry.shared)
			.map(entry => [entry.propertyId, entry.weight, entry.locked, entry.shared]);
		let unsharedEntries = Object.fromEntries(
			queryPropertyFilters.map(([key, filter, hasWeight]) => {
				let entries = propertyEntries
					.filter(entry =>
						entry.filter === filter && (entry.weight || !hasWeight) && !entry.shared)
					.map(entry => hasWeight ?
						[entry.propertyId, entry.weight, entry.locked, entry.enabled] :
						[entry.propertyId, entry.shared, entry.enabled]);
				return [key, entries];
			}));

		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.name = inputElement.name;
		unifiedQueryParams.type = type;
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
		Object.assign(unifiedQueryParams, unsharedEntries);
		unifiedQueryParams.sharedWeightEntries = sharedWeightEntries;
		return unifiedQueryParams;
	}

	toTradeQueryData(league, sessionId, overridePrice, manual6LinkName, manual6LinkPrice) {
		let maxPrice = overridePrice !== null ? overridePrice : this.maxPrice;
		let weights = Object.fromEntries(
			[...this.weightEntries, ...this.sharedWeightEntries].filter(entry => entry[3]));
		let ands = Object.fromEntries(this.andEntries.filter(entry => entry[3]));
		let nots = Object.fromEntries(this.notEntries.filter(entry => entry[1]));

		let queries = [];

		let query = {
			league,
			sessionId,
			name: this.name,
			type: this.type,
			minValue: this.minValue,
			maxPrice: maxPrice,
			online: !this.offline,
			defenseProperties: this.defenseProperties,
			affixProperties: {prefix: false, suffix: false},
			linked: this.linked,
			uncorrupted: this.uncorrupted,
			nonUnique: this.nonUnique,
			influences: this.influences,
			weights,
			ands,
			nots,
			affixValueShift: 0,
			priceShifts: {},
		};

		let linkedOptions = [
			// query with the intended links
			false,
			// query unlinked + uncorrupted items
			this.linked && maxPrice > manual6LinkPrice ? true : null,
		].filter(v => v !== null);
		let affixOptions = [
			// query without affixes
			false,
			// query items with a craftable prefix
			this.affixProperties.prefix ? ['prefix'] : null,
			// query items with a craftable suffix
			this.affixProperties.suffix ? ['suffix'] : null,
			// query items with specific craftable prefixes
			...this.conditionalPrefixEntries.map(
				([propertyId, weight]) => ['prefix', propertyId, weight]),
			// query items with specific craftable suffixes
			...this.conditionalSuffixEntries.map(
				([propertyId, weight]) => ['suffix', propertyId, weight]),
		].filter(v => v !== null);

		// cross product all combinations of linking and craftable affixes
		linkedOptions.forEach(lo => affixOptions.forEach(ao => {
			let queryO = deepCopy(query);
			if (lo) {
				queryO.linked = false;
				queryO.uncorrupted = true;
				queryO.maxPrice -= manual6LinkPrice;
				queryO.priceShifts[manual6LinkName] = manual6LinkPrice;
			}
			if (ao) {
				queryO.affixProperties[ao[0]] = true;
				queryO.uncorrupted = true;
				queryO.uncrafted = true;
				if (ao.length === 1)
					queryO.affixValueShift += this.affixProperties[ao[0]];
				else {
					queryO.nots[ao[1]] = undefined;
					queryO.affixValueShift += ao[2];
				}
			}
			queries.push(queryO);
		}));

		return queries;
	}

	static toApiQueryParams(tradeQuery, overrides = {}) {
		let overridden = {...tradeQuery, ...overrides};

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
		if (overridden.type)
			typeFilters.category = {option: overridden.type};
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

		let sort = weightFilters.length ? overridden.sort : ApiConstants.SORT.price;

		return {
			query: {
				status: {option: overridden.online ? 'online' : 'any'},
				term: overridden.name,
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

	static fromApiQueryParams(apiQueryParams) {
		let filters = apiQueryParams.query?.filters;
		let stats = apiQueryParams.query?.stats;
		let weightedStats = stats?.find(stats => stats.type === 'weight');
		let andStats = stats?.find(stats => stats.type === 'and');
		let notStats = stats?.find(stats => stats.type === 'not');
		let data = {
			name: apiQueryParams.term || '',
			type: filters?.type_filters?.filters?.category?.option || '',
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
			weightEntries: weightedStats?.filters
				?.map(entry => [entry?.id, entry?.value?.weight, false, true]) || [],
			andEntries: andStats?.filters
				?.map(entry => [entry?.id, entry?.value?.min, false, true]) || [],
			notEntries: notStats?.filters
				?.map(entry => [entry?.id, true]) || [],
			// conditionalPrefixEntries
			// conditionalSuffixEntries
			// sharedWeightEntries
		};
		let unifiedQueryParams = new UnifiedQueryParams();
		Object.assign(unifiedQueryParams, data);
		return unifiedQueryParams;
	}

	static fromModWeights(baseUnifiedQueryParams, modWeights) {
		let unifiedQueryParams = new UnifiedQueryParams();
		Object.assign(unifiedQueryParams, deepCopy(baseUnifiedQueryParams));
		unifiedQueryParams.weightEntries = modWeights.map(modWeight =>
			[modWeight.tradeModId, modWeight.weight * (modWeight.invert ? -1 : 1), false, true]);
		return unifiedQueryParams;
	}
}

module.exports = UnifiedQueryParams;
