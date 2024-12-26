const {httpRequest, XPromise} = require('js-desktop-base');
const poeNinjaApi = require('../services/poeNinjaApi');
const configForRenderer = require('../services/config/configForRenderer');
const pobConsts = require('../services/pobApi/pobConsts');

class ApiConstants {

	// constants

	shortProperties = {
		totalEleRes: 'pseudo.pseudo_total_elemental_resistance',
		flatLife: 'pseudo.pseudo_total_life',
	};

	sort = {
		value: {'statgroup.0': 'desc'},
		price: {price: 'asc'},
	};

	constructor() {
		// todo[low] need to make it accessible on the singleton. Should figure out a more elegant
		//  syntax. Likewise for the fake-static constants above.
		this.createRequestHeader = ApiConstants.createRequestHeader;
		this.cache = {};
	}

	// leagues

	get leagues() {
		return this.cachedRequest('leagues', ApiConstants.initLeagues);
	}

	static async initLeagues(version2) {
		let response = await ApiConstants.get('leagues', version2);
		return JSON.parse(response.string).result
			.filter(league => league.realm === 'pc' || league.realm === 'poe2')
			.map(league => league.id);
		/*
			['Harvest', ...]
		*/
	}

	// types

	get types() {
		return this.cachedRequest('types', ApiConstants.initTypes);
	}

	static async initTypes(version2) {
		let response = await ApiConstants.get('filters', version2);
		let data = JSON.parse(response.string);
		return data.result
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options
			.map(type => ({id: type.id, text: type.text.replaceAll('-', ' ')}));
		/*
			[{
				id: 'weapon.claw',
				text: 'claw',
			}, ...]
		*/
	}

	async typeTexts() {
		let types = await this.types;
		return types.map(({text}) => text);
	}

	async typeTextToId(text) {
		let types = await this.types;
		return types.find(type => type.text === text)?.id;
	}

	async typeToPobType(text) {
		let typeId = await this.typeTextToId(text);
		return pobConsts.slots[typeId];
	}

	async typeIdToText(id) {
		let types = await this.types;
		return types.find(type => type.id === id)?.text;
	}

	// properties

	get properties() {
		return this.cachedRequest('properties', ApiConstants.initProperties);
	}

	static async initProperties(version2) {
		let response = await ApiConstants.get('stats', version2);
		let properties = JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.flatMap(({id, text, type, option}) => {
				let property = {id, text: `${text} (${type})`, originalText: text, type};
				return option?.options ?
					option.options.map(o =>
						({...property, optionId: o.id, text: `${text} (${type}) = ${o.text}`})) :
					property;
			});
		properties.unshift({id: '', text: '', originalText: '', type: ''});
		return properties;
	}

	async propertyTexts() {
		let properties = await this.properties;
		return properties.map(({text}) => text);
	}

	async propertyById(id) {
		let properties = await this.properties;
		return properties.find(property => property.id === id);
	}

	async propertyByText(text) {
		let properties = await this.properties;
		return properties.find(property => property.text === text);
	}

	async propertiesByType(type) {
		let properties = await this.properties;
		return properties.filter(property => property.type === type);
	}

	// currencies

	currencyPrices(league) {
		return this.cachedRequest(['currencies', league], version2 => ApiConstants.initCurrencies(version2, league));
	}

	static async initCurrencies(version2, league) {
		// todo[high] support currencies for version2
		let currencyPrices = poeNinjaApi.getData(
			poeNinjaApi.endpointsByLeague.CURRENCY(league));
		let beastPrices = poeNinjaApi.getData(poeNinjaApi.endpointsByLeague.BEAST(league));
		let staticDataStr = ApiConstants.get('static', version2);
		currencyPrices = await currencyPrices;
		staticDataStr = await staticDataStr;
		beastPrices = await beastPrices;

		let tuples = JSON.parse(staticDataStr.string).result
			.find(({id}) => id === 'Currency').entries
			.map(({id, text}) => {
				let price = currencyPrices.lines
					.find(line => line.currencyTypeName === text)
					?.chaosEquivalent;
				return [id, price];
			});

		let currencies = Object.fromEntries(tuples);
		currencies.fuse6LinkBenchCraft = currencies['fusing'] * 1500;
		currencies.theBlackMorrigan6LinkBeastCraft = beastPrices.lines
			.find(line => line.name === 'Black Mórrigan')
			.chaosValue;
		currencies.chaos = 1;
		return currencies;
		/* {alt: .125, ...} */
	}

	// items

	get items() {
		return this.cachedRequest('items', ApiConstants.initItems);
	}

	static async initItems(version2) {
		let response = await ApiConstants.get('items', version2);
		let items = JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({name, text, type}) => name || text || type);
		items.unshift('');
		return items;
		/* ['Pledge of Hands', ...] */
	}

	// utility

	static createRequestHeader(sessionId = undefined) {
		return {
			// Without a non-empty user-agent header, PoE will return 403.
			'User-Agent': `arevtur}`,
			Cookie: sessionId ? `POESESSID=${sessionId}` : '',
			'content-type': 'application/json',
		};
	}

	static endpoint(name, version2) {
		return `https://pathofexile.com/api/trade${version2 ? 2 : ''}/data/${name}`;
	}

	static get(name, version2) {
		let endpoint = `https://pathofexile.com/api/trade${version2 ? 2 : ''}/data/${name}`;
		return httpRequest.get(endpoint, {}, ApiConstants.createRequestHeader());
	}

	async cachedRequest(cacheKey, initializer) {
		let duration3hours = 3 * 60 * 60 * 1000;
		while (true) {
			let version2 = configForRenderer.config.version2;
			cacheKey = [cacheKey, version2].join(',');
			if (!this.cache[cacheKey] || performance.now() - this.cache[cacheKey].lastRequest > duration3hours || this.cache[cacheKey].promise.error) {
				this.cache[cacheKey] = {
					lastRequest: performance.now(),
					promise: new XPromise(initializer(version2)),
				};
			}
			await this.cache[cacheKey].promise;
			if (version2 === configForRenderer.config.version2)
				return this.cache[cacheKey].promise;
		}
	}
}

module.exports = new ApiConstants();
