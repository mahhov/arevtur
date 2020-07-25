const {httpRequest: {get}} = require('js-desktop-base');
const ServicesDataFetcher = require('../services/DataFetcher');

class Constants {
	constructor() {
		this.leagues = this.initLeagues();
		// todo this is ugly, the actual values should be wrapped in a promise
		this.initTypesPromise = this.initTypes();
		this.initPropertiesPromise = this.initProperties();
		this.currencies = {};
		this.initItemsPromise = this.initItems();
	}

	async initLeagues() {
		return JSON.parse((await get('https://api.pathofexile.com/leagues')).string)
			.filter(league => !league.rules.some(rule => rule.id === 'NoParties'))
			.map(league => league.id);
		/*
			['Harvest', ...]
		*/
	}

	async initTypes() {
		let str = (await get('https://web.poecdn.com/js/PoE/Trade/Data/Static.js')).string
			.match(/return(.*)\}\);/)[1];
		let cleanStr = str.replace(/[^:,{}[\]]+/g, field =>
			field[0] === '"' ? field : `"${field.replace(/"/g, '\\"')}"`)
		let data = JSON.parse(cleanStr);
		this.types = data.propertyFilters
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options
			.map(({id, text}) => ({id, text: text.match(/"(.*)"/)[1]}));
		this.types.find(({id}) => id === 'armour.chest').text += ' chest';
		/*
			[{
				id: 'weapon.claw',
				text: 'claw',
			}, ...]
		*/
	}

	async typeTexts() {
		await this.initTypesPromise;
		return this.types.map(({text}) => text);
	}

	async typeTextToId(text) {
		await this.initTypesPromise;
		return this.types.find(type => type.text === text)?.id;
	}

	async typeIdToText(id) {
		await this.initTypesPromise;
		return this.types.find(type => type.id === id)?.text;
	}

	async initProperties() {
		this.properties = JSON.parse((await get('https://www.pathofexile.com/api/trade/data/stats')).string).result
			.flatMap(({entries}) => entries)
			.map(({id, text, type}) => ({id, text: `${text} (${type})`}));
		/*
		[{
      id: 'pseudo.pseudo_total_cold_resistance',
      text: '+#% total to Cold Resistance (pseudo)',
    }, ...]
		*/
	}

	async propertyTexts() {
		await this.initPropertiesPromise;
		return this.properties.map(({text}) => text);
	}

	async propertyTextToId(text) {
		await this.initPropertiesPromise;
		return this.properties.find(property => property.text === text)?.id;
	}

	async propertyIdToText(id) {
		await this.initPropertiesPromise;
		return this.properties.find(property => property.id === id)?.text;
	}

	async initCurrencies(league) {
		let currencyPrices = ServicesDataFetcher.getData(ServicesDataFetcher.endpoints.CURRENCY(league));
		let prophecyPrices = ServicesDataFetcher.getData(ServicesDataFetcher.endpoints.PROPHECY(league));
		let staticDataStr = get('https://www.pathofexile.com/api/trade/data/static');
		currencyPrices = await currencyPrices;
		prophecyPrices = await prophecyPrices;
		staticDataStr = await staticDataStr;

		let tuples = JSON.parse(staticDataStr.string).result
			.find(({id}) => id === 'Currency').entries
			.map(({id, text}) => {
				let price = currencyPrices.lines
					.find(line => line.currencyTypeName === text)
					?.chaosEquivalent;
				return [id, price];
			});

		let fatedConnectionsPrice = prophecyPrices.lines
			.find(line => line.name === 'Fated Connections')
			.chaosValue;
		tuples.push(['fatedConnectionsProphecy', fatedConnectionsPrice]);
		tuples.push(['chaos', 1]);
		return Object.fromEntries(tuples);
		/* {alt: .125, ...} */
	}

	currencyPrices(league) {
		return this.currencies[league] = this.currencies[league] || this.initCurrencies(league);
	}

	async initItems() {
		this.items = JSON.parse((await get('https://www.pathofexile.com/api/trade/data/items')).string).result
			.flatMap(({entries}) => entries)
			.map(({name, text}) => name || text);
		/* ['Pledge of Hands', ...] */
	}

	async itemTexts() {
		await this.initItemsPromise;
		return this.items;
	}
}

const SHORT_PROPERTIES = {
	totalEleRes: 'pseudo.pseudo_total_elemental_resistance',
	flatLife: 'pseudo.pseudo_total_life',
};

const SORT = {
	value: {'statgroup.0': 'desc'},
	price: {price: 'asc'},
};

module.exports = {
	SHORT_PROPERTIES,
	SORT,
	constants: new Constants(),
};
