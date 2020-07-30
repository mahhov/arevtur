const {httpRequest: {get}} = require('js-desktop-base');
const ServicesDataFetcher = require('../services/DataFetcher');

class Constants {
	constructor() {
		this.leagues = this.initLeagues();
		this.types = this.initTypes();
		this.properties = this.initProperties();
		this.currencies = {};
		this.items = this.initItems();
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
		let types = data.propertyFilters
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options
			.map(({id, text}) => ({id, text: text.match(/"(.*)"/)[1]}));
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
		return (await this.types).map(({text}) => text);
	}

	async typeTextToId(text) {
		return (await this.types).find(type => type.text === text)?.id;
	}

	async typeIdToText(id) {
		return (await this.types).find(type => type.id === id)?.text;
	}

	async initProperties() {
		return JSON.parse((await get('https://www.pathofexile.com/api/trade/data/stats')).string).result
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
		return (await this.properties).map(({text}) => text);
	}

	async propertyTextToId(text) {
		return (await this.properties).find(property => property.text === text)?.id;
	}

	async propertyIdToText(id) {
		return (await this.properties).find(property => property.id === id)?.text;
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
		// todo consider expiring cache to keep currencies updated even if the apps been running a while
		return this.currencies[league] = this.currencies[league] || this.initCurrencies(league);
	}

	async initItems() {
		return JSON.parse((await get('https://www.pathofexile.com/api/trade/data/items')).string).result
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
