const {httpRequest: {get}} = require('js-desktop-base');
const ServicesDataFetcher = require('../services/DataFetcher');

class Constants {
	constructor() {
		this.initPromise = Promise.all([
			this.initTypes(),
			this.initProperties(),
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
				text: 'claw'
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
			.flatMap(({entries})=> entries);
		/*
		[{
      "id": "pseudo.pseudo_total_cold_resistance",
      "text": "+#% total to Cold Resistance",
      "type": "pseudo"
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
}

const SHORT_PROPERTIES = {
	totalEleRes: 'pseudo.pseudo_total_elemental_resistance',
	flatLife: 'pseudo.pseudo_total_life',
};

const SORT = {
	value: {'statgroup.0': 'desc'},
	price: {price: 'asc'},
};

let getCurrencies = async () => {
	let currencyPrices = ServicesDataFetcher.getData(ServicesDataFetcher.endpoints.CURRENCY);
	let prophecyPrices = ServicesDataFetcher.getData(ServicesDataFetcher.endpoints.PROPHECY);
	currencyPrices = await currencyPrices;
	prophecyPrices = await prophecyPrices;
	// https://www.pathofexile.com/api/trade/data/items
	// https://web.poecdn.com/js/PoE/Trade/Data/Static.js
	// https://www.pathofexile.com/api/trade/data/static
	let tuples = [
		['mir', 'Mirror of Kalandra'],
		['exa', 'Exalted Orb'],
		['divine', 'Divine Orb'],
		['vaal', 'Vaal Orb'],
		['regal', 'Regal Orb'],
		['gcp', "Gemcutter's Prism"],
		['regret', 'Orb of Regret'],
		['fuse', 'Orb of Fusing'],
		['alch', 'Orb of Alchemy'],
		['scour', 'Orb of Scouring'],
		['chisel', "Cartographer's Chisel"],
		['blessed', 'Blessed Orb'],
		['silver', 'Silver Coin'],
		['jew', "Jeweller's Orb"],
		['chrom', 'Chromatic Orb'],
		['alt', 'Orb of Alteration'],
		['chance', 'Orb of Chance'],
		['p', 'Perandus Coin'],
	].map(([poeId, ninjaId]) => {
		let price = currencyPrices.lines
			.find(line => line.currencyTypeName === ninjaId)
			.chaosEquivalent;
		return [poeId, price];
	});
	let fatedConnectionsPrice = prophecyPrices.lines
		.find(line => line.name === 'Fated Connections')
		.chaosValue;
	tuples.push(['fatedConnectionsProphecy', fatedConnectionsPrice]);
	tuples.push(['chaos', 1]);
	return Object.fromEntries(tuples);
};

const CURRENCIES = getCurrencies();

module.exports = {
	SHORT_PROPERTIES,
	SORT,
	CURRENCIES,
	constants: new Constants(),
};
