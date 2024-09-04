const {httpRequest, XPromise} = require('js-desktop-base');
const poeNinjaApi = require('../services/poeNinjaApi');
const {configForRenderer} = require('../services/config/configForRenderer');
const PobConsts = require('../pobApi/PobConsts');

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
	}

	// leagues

	get leagues() {
		return (this.leagues_ ||= ApiConstants.retry(ApiConstants.initLeagues))();
	}

	static async initLeagues() {
		let response = await ApiConstants.get('https://api.pathofexile.com/leagues');
		return JSON.parse(response.string)
			.filter(league => !league.rules.some(rule => rule.id === 'NoParties'))
			.map(league => league.id);
		/*
			['Harvest', ...]
		*/
	}

	// types

	get types() {
		return (this.types_ ||= ApiConstants.retry(ApiConstants.initTypes))();
	}

	static async initTypes() {
		let response = await ApiConstants.get('https://web.poecdn.com/js/PoE/Trade/Data/Static.js');
		let str = response.string.match(/return(.*)}\)\);/)[1];
		let cleanStr = str
			.replace(/e\.translate\("(.*?)"\)/g, '"$1"')
			.replace(/([{,])(\w+):/g, '$1"$2":')
			.replace(/!(\d)/g, `"!${1}}}"`);
		let data = JSON.parse(cleanStr);
		let types = data.propertyFilters
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options;
		types.find(({id}) => id === 'armour.chest').text += ' chest';
		return types;
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
		return PobConsts.slots[typeId];
	}

	async typeIdToText(id) {
		let types = await this.types;
		return types.find(type => type.id === id)?.text;
	}

	// properties

	get properties() {
		return (this.properties_ ||= ApiConstants.retry(ApiConstants.initProperties))();
	}

	static async initProperties() {
		let response = await ApiConstants.get('https://www.pathofexile.com/api/trade/data/stats');
		return JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({id, text, type}) => ({id, text: `${text} (${type})`, originalText: text, type}));
		/*
		[{
	      id: 'pseudo.pseudo_total_cold_resistance',
	      text: '+#% total to Cold Resistance (pseudo)',
	    }, ...]
		*/
	}

	async propertyTexts() {
		let properties = await this.properties;
		return properties.map(({text}) => text);
	}

	async propertyTextToId(text) {
		let properties = await this.properties;
		return properties.find(property => property.text === text)?.id;
	}

	async propertyById(id) {
		let properties = await this.properties;
		return properties.find(property => property.id === id);
	}

	// currencies

	static async initCurrencies(league) {
		let currencyPrices = poeNinjaApi.getData(
			poeNinjaApi.endpointsByLeague.CURRENCY(league));
		let beastPrices = poeNinjaApi.getData(poeNinjaApi.endpointsByLeague.BEAST(league));
		let staticDataStr = ApiConstants.get('https://www.pathofexile.com/api/trade/data/static');
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

	currencyPrices(league) {
		this.currencyPrices_ ||= {};
		return (this.currencyPrices_[league] ||=
			ApiConstants.retry(() => ApiConstants.initCurrencies(league)))();
	}

	// items

	get items() {
		return (this.items_ ||= ApiConstants.retry(ApiConstants.initItems))();
	}

	static async initItems() {
		let response = await ApiConstants.get('https://www.pathofexile.com/api/trade/data/items');
		return JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({name, text, type}) => name || text || type);
		/* ['Pledge of Hands', ...] */
	}

	// utility

	static createRequestHeader(sessionId = undefined) {
		return {
			// Without a non-empty user-agent header, PoE will return 403.
			// todo[high] userId will be empty before config has loaded. If PoE API starts blocking
			//  'arevtur_', we'll need to wait for the actual userId to load or flush out headers
			//  to look more like the expected value; e.g. scratch/poeTradeHeader.json
			'User-Agent': `arevtur_${configForRenderer.config.userId}`,
			Cookie: sessionId ? `POESESSID=${sessionId}` : '',
		};
	}

	static get(endpoint) {
		return httpRequest.get(endpoint, {}, ApiConstants.createRequestHeader());
	}

	static retry(handler) {
		let duration3hours = 3 * 60 * 60 * 1000;
		let lastRequest;
		let promise;
		return () => {
			if (!promise || promise.error || performance.now() - lastRequest > duration3hours) {
				lastRequest = performance.now();
				promise = new XPromise(handler());
			}
			return promise;
		};
	};
}

module.exports = new ApiConstants();
