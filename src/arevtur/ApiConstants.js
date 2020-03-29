const {httpRequest: {get}} = require('js-desktop-base');
const ServicesDataFetcher = require('../services/DataFetcher');

class Constants {
	constructor() {
		this.initPromise = Promise.all([
			this.initTypes(),
			this.initProperties(),
			this.initCurrencies(),
		]);
	}

	async initTypes() {
		let str = (await get('https://web.poecdn.com/js/PoE/Trade/Data/Static.js'))
			.match(/return(.*)\}\);/)[1];
		let cleanStr = str.replace(/[^:,{}[\]]+/g, field =>
			field[0] === '"' ? field : `"${field.replace(/"/g, '\\"')}"`)
		let data = JSON.parse(cleanStr);
		this.types = data.propertyFilters
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options
			.map(type => {
				type.text = type.text.match(/"(.*)"/)[1];
				return type;
			});
		this.types.find(({id}) => id === 'armour.chest').text += ' chest';
		/*
			[{
				id: 'weapon.claw',
				text: 'claw',
			}, ...]
		*/
	}

	async typeTexts() {
		await this.initPromise;
		return this.types.map(({text}) => text);
	}

	async typeTextToId(text) {
		await this.initPromise;
		return this.types.find(type => type.text === text)?.id;
	}

	async typeIdToText(id) {
		await this.initPromise;
		return this.types.find(type => type.id === id)?.text;
	}

	async initProperties() {
		this.properties = JSON.parse(await get('https://www.pathofexile.com/api/trade/data/stats')).result
			.flatMap(({entries}) => entries);
		/*
		[{
      id: 'pseudo.pseudo_total_cold_resistance',
      text: '+#% total to Cold Resistance',
      type: 'pseudo',
    }, ...]
		*/
	}

	async propertyTexts() {
		await this.initPromise;
		return this.properties.map(({text}) => text);
	}

	async propertyTextToId(text) {
		await this.initPromise;
		return this.properties.find(property => property.text === text)?.id;
	}

	async propertyIdToText(id) {
		await this.initPromise;
		return this.properties.find(property => property.id === id)?.text;
	}

	async initCurrencies() {
		let currencyPrices = ServicesDataFetcher.getData(ServicesDataFetcher.endpoints.CURRENCY);
		let prophecyPrices = ServicesDataFetcher.getData(ServicesDataFetcher.endpoints.PROPHECY);
		let staticDataStr = get('https://www.pathofexile.com/api/trade/data/static');
		currencyPrices = await currencyPrices;
		prophecyPrices = await prophecyPrices;
		staticDataStr = await staticDataStr;

		let tuples = JSON.parse(staticDataStr).result
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
		this.currencies = Object.fromEntries(tuples);

		/*
		{
      alt: .125,
      ...
    }
		*/
	}

	async currencyPrice(currency) {
		await this.initPromise;
		return this.currencies[currency];
	}

	// also of interest, https://www.pathofexile.com/api/trade/data/items
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
